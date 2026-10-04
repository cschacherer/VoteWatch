import type pg from "pg";
import { createPool } from "./connection.js";
import type {
    BillPolicy,
    BillRow,
    CoupleScoreRow,
    CoupleVoteRow,
    LegislatorRow,
    PartyCoupleScoreRow,
    PolicyRow,
    PolicyTopicCoupleRow,
    SqlParam,
    VoteValue,
} from "../types.js";
import { buildLegislatorCoupleScores } from "../scoring/legislatorCoupleScores.js";
import {
    buildPolicyOutcomes,
    findPolicyCouple,
    outcomeScoreFromWeights,
    type OutcomePolicyRow,
    type TopicOutcome,
} from "../scoring/policyOutcomes.js";
import { getPolicyWeight } from "../scoring/policyWeight.js";

//the year value that means every year - the live score queries skip their year filter for it.
//Stored scores are per year, so "all" is always computed live
export const ALL_YEARS = "all";

// #region SQL FRAGMENTS
//The tables link by integer ids (schema.sql), but the API keeps its original JSON - text keys like
//session_id '2026GS', id 'HB0001', and legislator_id 'PETERT' - so the React app is unchanged. These
//fragments rebuild those fields with aliases. Aliases used throughout: b = bills, s = sessions,
//l = legislators, bp = bill_policies, t = policy_topics, d = policy_directions, c = policy_couples

//a bill as the API returns it - FROM bills b JOIN sessions s ON s.id = b.session_id
const BILL_COLUMNS = `
    s.code AS session_id,
    b.bill_number AS id,
    b.short_title,
    b.general_provisions,
    b.highlighted_provisions,
    b.money_appropriated,
    b.full_text,
    b.pdf_link,
    b.summary_text,
    s.year::text AS year,
    b.passed,
    b.date_passed,
    b.effective_date,
    b.last_action,
    b.last_action_date,
    b.subjects,
    b.sponsor_code AS bill_sponsor,
    COALESCE(b.floor_sponsor_code, '') AS floor_sponsor,
    b.tracking_id,
    b.house_vote_url,
    b.senate_vote_url,
    b.link,
    b.measure_type,
    b.is_substantive::int AS is_substantive,
    b.needs_review::int AS needs_review,
    b.review_reason`;

const BILLS_FROM = `bills b JOIN sessions s ON s.id = b.session_id`;

//a legislator as the API returns it - FROM legislators l
const LEGISLATOR_COLUMNS = `
    l.code AS id,
    l.full_name,
    l.format_name,
    l.image,
    l.house,
    l.party,
    l.district,
    l.counties,
    l.email,
    l.phone,
    l.service_start,
    l.link`;

//a bill policy's topic and direction - LEFT JOIN, since 6 policies have no known direction
const POLICY_JOINS = `
    JOIN policy_topics t ON t.id = bp.policy_topic_id
    LEFT JOIN policy_directions d ON d.id = bp.direction_id`;

//one bill policy as a JSON object, for json_agg
const POLICY_JSON = `json_build_object(
    'policy_topic', t.name,
    'policy_topic_strength', bp.strength,
    'policy_direction', d.name,
    'impact_level', bp.impact_level,
    'confidence', bp.confidence,
    'neutral_summary', bp.neutral_summary,
    'include_in_scorecard', bp.include_in_scorecard
)`;

//a bill's policies as a JSON array (pg decodes it) - use in a SELECT that has bills b. A subquery, so
//bills keep one row each, and it gives [] for bills without policies
const BILL_POLICIES_COLUMN = `(
    SELECT COALESCE(json_agg(${POLICY_JSON}), '[]'::json)
    FROM bill_policies bp ${POLICY_JOINS}
    WHERE bp.bill_id = b.id
) AS policies`;

//a bill policy's fields as the API returns them next to a bill (the old "policy.*")
const POLICY_COLUMNS = `
    s.code AS session_id,
    b.bill_number AS bill_id,
    t.name AS policy_topic,
    bp.strength AS policy_topic_strength,
    d.name AS policy_direction,
    bp.impact_level,
    bp.confidence,
    bp.neutral_summary,
    bp.include_in_scorecard`;

//policy couples with their topic and direction names - the shape the scoring code reads
const COUPLES_SELECT = `
    SELECT
        c.id,
        t.name AS policy_topic,
        c.label AS name_label,
        ld.name AS left_policy_direction,
        rd.name AS right_policy_direction,
        c.name AS policy_topic_couple_name
    FROM policy_couples c
    JOIN policy_topics t ON t.id = c.policy_topic_id
    JOIN policy_directions ld ON ld.id = c.left_direction_id
    JOIN policy_directions rd ON rd.id = c.right_direction_id`;

// #endregion

type WithPolicies<T> = T & { policies: BillPolicy[] };

//a vote joined with its bill (and the bill's policies) - the legislator profile's voting history
type LegislatorVoteRow = Pick<
    BillRow,
    | "short_title"
    | "summary_text"
    | "general_provisions"
    | "highlighted_provisions"
    | "year"
    | "passed"
    | "date_passed"
    | "effective_date"
    | "last_action"
    | "last_action_date"
    | "subjects"
    | "link"
> & {
    legislator_id: string;
    bill_id: string;
    session_id: string;
    vote: VoteValue;
};

//a bill + one of its policies + a legislator's vote on it
type BillPolicyVoteRow = BillRow &
    PolicyRow & { vote: VoteValue; legislator_id: string };

type BillVoteRow = Pick<
    LegislatorRow,
    "full_name" | "format_name" | "party" | "image" | "house"
> & {
    session_id: string;
    bill_id: string;
    legislator_id: string;
    vote: VoteValue;
};

type OverviewScoreRow = {
    legislator_id: string;
    policy_topic_couple_name: string;
    score: number;
    all_included_votes: number;
    policy_topic: string;
    name_label: string;
    left_policy_direction: string;
    right_policy_direction: string;
    format_name: string;
    party: string | null;
    house: string | null;
    district: number | null;
};

type ParticipationRow = Pick<
    LegislatorRow,
    "full_name" | "format_name" | "image" | "party" | "house" | "district"
> & {
    legislator_id: string;
    yes_votes: number;
    no_votes: number;
    absent_votes: number;
};

export type LegislatureOverview = {
    summary:
        | { bills_voted_on: number; total_votes: number; absent_votes: number }
        | undefined;
    scores: OverviewScoreRow[];
    participation: ParticipationRow[];
    policy_outcomes: TopicOutcome[];
};

export type AnalysisYear = {
    year: string;
    has_scores: boolean;
    sessions: string[];
};

//every query the API needs, against Postgres (schema.sql) - read only. The ETL's writes stay in the
//JavaScript server/database/database.js, which still uses SQLite (voteWatch.db)
export class Database {
    private constructor(private readonly pool: pg.Pool) {}

    //connects to DATABASE_URL (server_ts/.env) - fails at startup if it's missing or wrong
    static async open(): Promise<Database> {
        return new Database(await createPool());
    }

    //shares an existing pool - the ETL's scoring stage reuses the API's live scoring this way
    static fromPool(pool: pg.Pool): Database {
        return new Database(pool);
    }

    async all<T>(sql: string, params: SqlParam[] = []): Promise<T[]> {
        const result = await this.pool.query(sql, params);
        return result.rows as T[];
    }

    async get<T>(sql: string, params: SqlParam[] = []): Promise<T | undefined> {
        const result = await this.pool.query(sql, params);
        return result.rows[0] as T | undefined;
    }

    close(): Promise<void> {
        return this.pool.end();
    }

    // #region BILLS

    getAllBillsWithPolicies() {
        return this.all<WithPolicies<BillRow>>(
            `SELECT ${BILL_COLUMNS}, ${BILL_POLICIES_COLUMN}
            FROM ${BILLS_FROM}
            ORDER BY s.code, b.bill_number`,
        );
    }

    getAllBillsWithPoliciesForSession(sessionId: string) {
        return this.all<WithPolicies<BillRow>>(
            `SELECT ${BILL_COLUMNS}, ${BILL_POLICIES_COLUMN}
            FROM ${BILLS_FROM}
            WHERE s.code = $1
            ORDER BY b.bill_number`,
            [sessionId],
        );
    }

    getBillDetailsWithPolicies(sessionId: string, billNumber: string) {
        return this.get<WithPolicies<BillRow>>(
            `SELECT ${BILL_COLUMNS}, ${BILL_POLICIES_COLUMN}
            FROM ${BILLS_FROM}
            WHERE s.code = $1
              AND b.bill_number = $2`,
            [sessionId, billNumber],
        );
    }

    getAllVotesOnBill(billNumber: string, sessionId: string) {
        return this.all<BillVoteRow>(
            `SELECT
                s.code AS session_id,
                b.bill_number AS bill_id,
                l.code AS legislator_id,
                l.full_name,
                l.format_name,
                l.party,
                l.image,
                v.vote,
                l.house
            FROM votes v
            JOIN ${BILLS_FROM} ON b.id = v.bill_id
            JOIN legislators l ON l.id = v.legislator_id
            WHERE b.bill_number = $1
              AND s.code = $2
            ORDER BY l.code`,
            [billNumber, sessionId],
        );
    }

    // #endregion

    // #region LEGISLATORS

    getAllLegislators() {
        return this.all<LegislatorRow>(
            `SELECT ${LEGISLATOR_COLUMNS} FROM legislators l ORDER BY l.code`,
        );
    }

    //id is the Legislature's code, ie 'PETERT'
    getLegislator(code: string) {
        return this.get<LegislatorRow>(
            `SELECT ${LEGISLATOR_COLUMNS} FROM legislators l WHERE l.code = $1`,
            [code],
        );
    }

    //chamber is "H" or "S". district is compared as text, so a non-number finds nobody instead of erroring
    getLegislatorFromDistrict(chamber: string, district: string) {
        return this.get<LegislatorRow>(
            `SELECT ${LEGISLATOR_COLUMNS} FROM legislators l
            WHERE l.house = $1 AND l.district::text = $2`,
            [chamber, district],
        );
    }

    getAllBillsAndVotesForLegislator(code: string) {
        return this.all<WithPolicies<LegislatorVoteRow>>(
            `SELECT
                l.code AS legislator_id,
                b.bill_number AS bill_id,
                s.code AS session_id,
                v.vote,
                b.short_title,
                b.summary_text,
                b.general_provisions,
                b.highlighted_provisions,
                s.year::text AS year,
                b.passed,
                b.date_passed,
                b.effective_date,
                b.last_action,
                b.last_action_date,
                b.subjects,
                b.link,
                ${BILL_POLICIES_COLUMN}
            FROM votes v
            JOIN legislators l ON l.id = v.legislator_id
            JOIN ${BILLS_FROM} ON b.id = v.bill_id
            WHERE l.code = $1
            ORDER BY s.code, b.bill_number`,
            [code],
        );
    }

    //by sponsor code rather than sponsor_id, so it also works for sponsors who aren't in legislators
    getLegislatorSponsoredBills(code: string) {
        return this.all<WithPolicies<BillRow>>(
            `SELECT ${BILL_COLUMNS}, ${BILL_POLICIES_COLUMN}
            FROM ${BILLS_FROM}
            WHERE b.sponsor_code = $1 OR b.floor_sponsor_code = $1
            ORDER BY s.code, b.bill_number`,
            [code],
        );
    }

    // #endregion

    // #region LEGISLATOR SCORES

    //stored couple scores for one legislator and year
    getPolicyCouplesFromLegislatorAndYear(code: string, year: string) {
        return this.all<CoupleScoreRow>(
            `SELECT
                l.code AS legislator_id,
                cs.year::text AS year,
                couple.policy_topic,
                couple.policy_topic_couple_name,
                couple.name_label,
                couple.left_policy_direction,
                couple.right_policy_direction,
                cs.included_votes AS all_included_votes,
                cs.score
            FROM legislator_couple_scores cs
            JOIN legislators l ON l.id = cs.legislator_id
            JOIN (${COUPLES_SELECT}) couple ON couple.id = cs.policy_couple_id
            WHERE l.code = $1
              AND cs.year::text = $2
            ORDER BY couple.policy_topic_couple_name`,
            [code, year],
        );
    }

    //a legislator's couple scores computed from their votes instead of read from legislator_couple_scores
    //- for one session, all years, or a year that was never scored
    async getLiveCoupleScoresForLegislator(
        code: string,
        year: string,
        sessionId: string | null = null,
    ) {
        const { couples, voteRows } = await this.getCoupleVoteRows(
            year,
            sessionId,
            code,
        );
        return buildLegislatorCoupleScores(couples, voteRows, code, year);
    }

    //every policy couple, plus one row per vote on a bill whose policy is on either side of a couple -
    //for one legislator (by code), or everyone when legislatorCode is null. Matching the couple's topic as
    //well as its directions leaves out policies filed under the wrong topic, like the scoring always has
    private async getCoupleVoteRows(
        year: string,
        sessionId: string | null = null,
        legislatorCode: string | null = null,
    ) {
        const [couples, voteRows] = await Promise.all([
            this.all<PolicyTopicCoupleRow>(`${COUPLES_SELECT} ORDER BY c.name`),
            this.all<CoupleVoteRow>(
                `SELECT
                    l.code AS legislator_id,
                    c.name AS policy_topic_couple_name,
                    v.vote,
                    d.name AS policy_direction,
                    bp.impact_level,
                    bp.strength AS policy_topic_strength,
                    bp.confidence
                FROM policy_couples c
                JOIN bill_policies bp
                    ON bp.policy_topic_id = c.policy_topic_id
                    AND bp.direction_id IN (c.left_direction_id, c.right_direction_id)
                JOIN policy_directions d ON d.id = bp.direction_id
                JOIN ${BILLS_FROM} ON b.id = bp.bill_id
                JOIN votes v ON v.bill_id = b.id
                JOIN legislators l ON l.id = v.legislator_id
                WHERE ($1::text IS NULL OR l.code = $1)
                  AND ($2 = '${ALL_YEARS}' OR s.year::text = $2)
                  AND ($3::text IS NULL OR s.code = $3)`,
                [legislatorCode, year, sessionId],
            ),
        ]);
        return { couples, voteRows };
    }

    //every legislator's couple scores with their party, only couples they have counted votes on - for
    //comparing one legislator with the party medians. Reads the stored scores for a year when there are
    //any, otherwise (one session, all years, or an unscored year) computes them live
    async getLegislatureCoupleScores(
        year: string,
        sessionId: string | null = null,
    ): Promise<PartyCoupleScoreRow[]> {
        if (!sessionId && year !== ALL_YEARS) {
            const stored = await this.all<PartyCoupleScoreRow>(
                `SELECT
                    l.code AS legislator_id,
                    l.party,
                    c.name AS policy_topic_couple_name,
                    cs.score,
                    cs.included_votes AS all_included_votes
                FROM legislator_couple_scores cs
                JOIN legislators l ON l.id = cs.legislator_id
                JOIN policy_couples c ON c.id = cs.policy_couple_id
                WHERE cs.year::text = $1
                  AND cs.included_votes > 0
                ORDER BY l.code, c.name`,
                [year],
            );
            if (stored.length > 0) return stored;
        }

        const [{ couples, voteRows }, legislators] = await Promise.all([
            this.getCoupleVoteRows(year, sessionId),
            this.all<Pick<LegislatorRow, "id" | "party">>(
                `SELECT code AS id, party FROM legislators`,
            ),
        ]);
        const partyById = new Map(legislators.map((l) => [l.id, l.party]));

        //every vote joins a legislator now (a foreign key), so each one has a party
        const rowsByLegislator = new Map<string, CoupleVoteRow[]>();
        for (const row of voteRows) {
            const rows = rowsByLegislator.get(row.legislator_id) ?? [];
            rows.push(row);
            rowsByLegislator.set(row.legislator_id, rows);
        }

        const scores: PartyCoupleScoreRow[] = [];
        for (const [legislatorId, rows] of rowsByLegislator) {
            for (const score of buildLegislatorCoupleScores(
                couples,
                rows,
                legislatorId,
                year,
            )) {
                if (score.all_included_votes === 0) continue;
                scores.push({
                    legislator_id: legislatorId,
                    party: partyById.get(legislatorId) ?? null,
                    policy_topic_couple_name: score.policy_topic_couple_name,
                    score: score.score,
                    all_included_votes: score.all_included_votes,
                });
            }
        }
        return scores;
    }

    //every bill + vote for a legislator's policy couple, including absent votes (which are not scored)
    getAllBillsAndVotesForLegislatorByPolicyCouple(
        code: string,
        policyCoupleName: string,
        year: string,
        sessionId: string | null = null,
    ) {
        return this.all<BillPolicyVoteRow>(
            `SELECT ${BILL_COLUMNS}, v.vote, l.code AS legislator_id, ${POLICY_COLUMNS}
            FROM policy_couples c
            JOIN bill_policies bp
                ON bp.policy_topic_id = c.policy_topic_id
                AND bp.direction_id IN (c.left_direction_id, c.right_direction_id)
            ${POLICY_JOINS}
            JOIN ${BILLS_FROM} ON b.id = bp.bill_id
            JOIN votes v ON v.bill_id = b.id
            JOIN legislators l ON l.id = v.legislator_id
            WHERE c.name = $1
              AND l.code = $2
              AND ($3 = '${ALL_YEARS}' OR s.year::text = $3)
              AND ($4::text IS NULL OR s.code = $4)
            ORDER BY s.code, b.bill_number`,
            [policyCoupleName, code, year, sessionId],
        );
    }

    //the bills and a legislator's votes for one policy direction
    getAllBillsAndVotesForLegislatorByPolicyDirection(
        code: string,
        policyTopic: string,
        policyDirection: string,
        year: string,
    ) {
        return this.all<BillPolicyVoteRow>(
            `SELECT ${BILL_COLUMNS}, v.vote, l.code AS legislator_id, ${POLICY_COLUMNS}
            FROM votes v
            JOIN legislators l ON l.id = v.legislator_id
            JOIN ${BILLS_FROM} ON b.id = v.bill_id
            JOIN bill_policies bp ON bp.bill_id = b.id
            ${POLICY_JOINS}
            WHERE l.code = $1
              AND t.name = $2
              AND d.name = $3
              AND s.year::text = $4
            ORDER BY s.code, b.bill_number`,
            [code, policyTopic, policyDirection, year],
        );
    }

    // #endregion

    // #region LEGISLATURE

    //years that have bills, newest first, whether each has stored scores, and its sessions newest first
    getAnalysisYears() {
        return this.all<AnalysisYear>(
            `SELECT
                s.year::text AS year,
                EXISTS (
                    SELECT 1 FROM legislator_couple_scores cs WHERE cs.year = s.year
                ) AS has_scores,
                array_agg(s.code ORDER BY s.code DESC) AS sessions
            FROM sessions s
            WHERE EXISTS (SELECT 1 FROM bills b WHERE b.session_id = s.id)
            GROUP BY s.year
            ORDER BY s.year DESC`,
        );
    }

    //legislature-wide numbers for the Analysis page - every legislator's couple scores, each legislator's
    //vote counts, and what passed per policy topic and direction. year can be ALL_YEARS
    async getLegislatureOverview(year: string): Promise<LegislatureOverview> {
        const [summary, scores, participation, policyOutcomes] =
            await Promise.all([
                this.get<LegislatureOverview["summary"]>(
                    `SELECT
                        COUNT(DISTINCT v.bill_id) AS bills_voted_on,
                        COUNT(*) AS total_votes,
                        COUNT(*) FILTER (WHERE v.vote = 'absent') AS absent_votes
                    FROM votes v
                    JOIN ${BILLS_FROM} ON b.id = v.bill_id
                    WHERE ($1 = '${ALL_YEARS}' OR s.year::text = $1)`,
                    [year],
                ),
                //stored scores are per year, so all years is scored live (about a second)
                year === ALL_YEARS
                    ? this.getLiveOverviewScores()
                    : this.all<OverviewScoreRow>(
                          `SELECT
                            l.code AS legislator_id,
                            couple.policy_topic_couple_name,
                            cs.score,
                            cs.included_votes AS all_included_votes,
                            couple.policy_topic,
                            couple.name_label,
                            couple.left_policy_direction,
                            couple.right_policy_direction,
                            l.format_name,
                            l.party,
                            l.house,
                            l.district
                        FROM legislator_couple_scores cs
                        JOIN (${COUPLES_SELECT}) couple ON couple.id = cs.policy_couple_id
                        JOIN legislators l ON l.id = cs.legislator_id
                        WHERE cs.year::text = $1
                          AND cs.included_votes > 0
                        ORDER BY l.code, couple.policy_topic_couple_name`,
                          [year],
                      ),
                this.all<ParticipationRow>(
                    `SELECT
                        l.code AS legislator_id,
                        l.full_name,
                        l.format_name,
                        l.image,
                        l.party,
                        l.house,
                        l.district,
                        COUNT(*) FILTER (WHERE v.vote = 'yes') AS yes_votes,
                        COUNT(*) FILTER (WHERE v.vote = 'no') AS no_votes,
                        COUNT(*) FILTER (WHERE v.vote = 'absent') AS absent_votes
                    FROM votes v
                    JOIN ${BILLS_FROM} ON b.id = v.bill_id
                    JOIN legislators l ON l.id = v.legislator_id
                    WHERE ($1 = '${ALL_YEARS}' OR s.year::text = $1)
                    GROUP BY l.id
                    ORDER BY l.code`,
                    [year],
                ),
                this.getPolicyOutcomes(year),
            ]);

        return {
            summary,
            scores,
            participation,
            policy_outcomes: policyOutcomes,
        };
    }

    //every legislator's couple scores across all years, in the same shape as the overview's stored
    //scores (couple labels plus the legislator's name, party, chamber, and district) - computed live
    private async getLiveOverviewScores(): Promise<OverviewScoreRow[]> {
        const [scores, couples, legislators] = await Promise.all([
            this.getLegislatureCoupleScores(ALL_YEARS),
            this.all<PolicyTopicCoupleRow>(COUPLES_SELECT),
            this.all<
                Pick<
                    LegislatorRow,
                    "id" | "format_name" | "party" | "house" | "district"
                >
            >(
                `SELECT code AS id, format_name, party, house, district FROM legislators`,
            ),
        ]);
        const coupleByName = new Map(
            couples.map((c) => [c.policy_topic_couple_name, c]),
        );
        const legislatorById = new Map(legislators.map((l) => [l.id, l]));

        return scores.map((score) => {
            const couple = coupleByName.get(score.policy_topic_couple_name)!;
            const legislator = legislatorById.get(score.legislator_id)!;
            return {
                legislator_id: score.legislator_id,
                policy_topic_couple_name: score.policy_topic_couple_name,
                score: score.score,
                all_included_votes: score.all_included_votes,
                policy_topic: couple.policy_topic,
                name_label: couple.name_label,
                left_policy_direction: couple.left_policy_direction,
                right_policy_direction: couple.right_policy_direction,
                format_name: legislator.format_name,
                party: legislator.party,
                house: legislator.house,
                district: legislator.district,
            };
        });
    }

    //what passed per policy topic and direction for a year (or ALL_YEARS), or one of its sessions
    async getPolicyOutcomes(year: string, sessionId: string | null = null) {
        const policyRows = await this.all<OutcomePolicyRow>(
            `SELECT
                s.code AS session_id,
                b.bill_number AS bill_id,
                t.name AS policy_topic,
                d.name AS policy_direction,
                bp.strength AS policy_topic_strength,
                bp.impact_level,
                bp.confidence,
                b.passed
            FROM bill_policies bp
            ${POLICY_JOINS}
            JOIN ${BILLS_FROM} ON b.id = bp.bill_id
            WHERE ($1 = '${ALL_YEARS}' OR s.year::text = $1)
              AND ($2::text IS NULL OR s.code = $2)`,
            [year, sessionId],
        );
        return buildPolicyOutcomes(policyRows);
    }

    //the passed bills behind a couple's legislature outcome score - one row per bill with its policy
    //for this couple's topic, plus the couple's labels and outcome score. null for an unknown couple
    async getPolicyCoupleOutcome(
        policyCoupleName: string,
        year: string,
        sessionId: string | null = null,
    ) {
        const found = findPolicyCouple(policyCoupleName);
        if (!found) return null;
        const { topic, couple } = found;

        const bills = await this.all<
            BillRow &
                Pick<
                    PolicyRow,
                    | "policy_topic"
                    | "policy_direction"
                    | "policy_topic_strength"
                    | "impact_level"
                    | "confidence"
                    | "neutral_summary"
                >
        >(
            `SELECT
                ${BILL_COLUMNS},
                t.name AS policy_topic,
                d.name AS policy_direction,
                bp.strength AS policy_topic_strength,
                bp.impact_level,
                bp.confidence,
                bp.neutral_summary
            FROM bill_policies bp
            ${POLICY_JOINS}
            JOIN ${BILLS_FROM} ON b.id = bp.bill_id
            WHERE ($1 = '${ALL_YEARS}' OR s.year::text = $1)
              AND ($2::text IS NULL OR s.code = $2)
              AND b.passed
              AND t.name = $3
              AND d.name IN ($4, $5)
            ORDER BY s.code DESC, b.bill_number`,
            [
                year,
                sessionId,
                topic,
                couple.leftPolicyDirection,
                couple.rightPolicyDirection,
            ],
        );

        const sideWeight = (direction: string) =>
            bills
                .filter((bill) => bill.policy_direction === direction)
                .reduce((sum, bill) => sum + getPolicyWeight(bill), 0);

        return {
            year,
            policy_topic: topic,
            policy_topic_couple_name: couple.policyCoupleName,
            name_label: couple.nameLabel,
            left_policy_direction: couple.leftPolicyDirection,
            right_policy_direction: couple.rightPolicyDirection,
            outcome_score: outcomeScoreFromWeights(
                sideWeight(couple.leftPolicyDirection),
                sideWeight(couple.rightPolicyDirection),
            ),
            bills,
        };
    }

    // #endregion
}
