import pg from "pg";
import type { CoupleScoreRow, VoteValue } from "../types.js";
import type { PolicyTopic } from "../taxonomy/policyTopics.js";
import type { ParsedBill, ParsedLegislator } from "./parse.js";
import type { PolicyClassification } from "./ai/policies.js";
import { sessionYear } from "./config.js";

//every ETL write, into the Postgres tables in server/database/postgres/schema.sql. The ETL works with the
//Legislature's text codes (session '2026GS', bill 'HB0001', legislator 'PETERT') and these translate them
//to the integer ids the foreign keys use.
//
//Re-running a stage refreshes rows (upserts) instead of skipping them like SQLite's INSERT OR IGNORE did,
//so a fixed scrape or a re-classification just overwrites the old values.

//a bill as the later stages (text, votes, summaries, policies) need it
export type StoredBill = {
    id: number;
    bill_number: string;
    session_code: string;
    year: string;
    short_title: string | null;
    full_text: string | null;
    subjects: string | null;
    summary_text: string | null;
    house_vote_url: string | null;
    senate_vote_url: string | null;
    policy_count: number;
    vote_count: number;
    //set once the policies stage has classified the bill (non-substantive bills have no policies)
    measure_type: string | null;
};

type Queryable = pg.Pool | pg.PoolClient;

export class EtlStore {
    //a Pool for real runs; a PoolClient already inside a transaction for tests that roll everything back
    constructor(private readonly db: Queryable) {}

    private async query<T extends pg.QueryResultRow = pg.QueryResultRow>(
        sql: string,
        params: unknown[] = [],
    ) {
        return this.db.query<T>(sql, params);
    }

    //runs fn atomically - a transaction on a Pool, or a savepoint when already inside one (tests)
    private async atomically<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
        if (this.db instanceof pg.Pool) {
            const client = await this.db.connect();
            try {
                await client.query("BEGIN");
                const result = await fn(client);
                await client.query("COMMIT");
                return result;
            } catch (err) {
                await client.query("ROLLBACK");
                throw err;
            } finally {
                client.release();
            }
        }
        await this.db.query("SAVEPOINT etl_step");
        try {
            const result = await fn(this.db);
            await this.db.query("RELEASE SAVEPOINT etl_step");
            return result;
        } catch (err) {
            await this.db.query("ROLLBACK TO SAVEPOINT etl_step");
            throw err;
        }
    }

    // #region TAXONOMY

    //the policy_* tables from the taxonomy (taxonomy/policyTopics.ts) - adds what's new and updates labels,
    //never deletes (bill policies point at these rows)
    async seedTaxonomy(policyTopics: PolicyTopic[]) {
        await this.atomically(async (q) => {
            for (const topic of policyTopics) {
                await q.query(
                    `INSERT INTO policy_topics (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
                    [topic.topic],
                );
                for (const direction of topic.policyDirections) {
                    await q.query(
                        `INSERT INTO policy_directions (policy_topic_id, name)
                        SELECT id, $2 FROM policy_topics WHERE name = $1
                        ON CONFLICT (name) DO UPDATE SET policy_topic_id = EXCLUDED.policy_topic_id`,
                        [topic.topic, direction],
                    );
                }
                for (const couple of topic.policyCouples) {
                    await q.query(
                        `INSERT INTO policy_couples (policy_topic_id, name, label, left_direction_id, right_direction_id)
                        SELECT t.id, $2, $3, l.id, r.id
                        FROM policy_topics t
                        JOIN policy_directions l ON l.name = $4
                        JOIN policy_directions r ON r.name = $5
                        WHERE t.name = $1
                        ON CONFLICT (name) DO UPDATE SET
                            policy_topic_id = EXCLUDED.policy_topic_id,
                            label = EXCLUDED.label,
                            left_direction_id = EXCLUDED.left_direction_id,
                            right_direction_id = EXCLUDED.right_direction_id`,
                        [
                            topic.topic,
                            couple.policyCoupleName,
                            couple.nameLabel,
                            couple.leftPolicyDirection,
                            couple.rightPolicyDirection,
                        ],
                    );
                }
                for (const single of topic.policySingles) {
                    await q.query(
                        `INSERT INTO policy_singles (policy_topic_id, label, direction_id)
                        SELECT t.id, $2, d.id
                        FROM policy_topics t JOIN policy_directions d ON d.name = $3
                        WHERE t.name = $1
                        ON CONFLICT (policy_topic_id, direction_id) DO UPDATE SET label = EXCLUDED.label`,
                        [topic.topic, single.nameLabel, single.policyDirection],
                    );
                }
            }
        });
    }

    // #endregion

    // #region LEGISLATORS

    async upsertLegislator(legislator: ParsedLegislator) {
        await this.query(
            `INSERT INTO legislators (code, full_name, format_name, image, house, party, district, counties,
                email, phone, service_start, link)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (code) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                format_name = EXCLUDED.format_name,
                image = EXCLUDED.image,
                house = EXCLUDED.house,
                party = EXCLUDED.party,
                district = EXCLUDED.district,
                counties = EXCLUDED.counties,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                service_start = EXCLUDED.service_start,
                link = EXCLUDED.link`,
            [
                legislator.code,
                legislator.full_name,
                legislator.format_name,
                legislator.image,
                legislator.house,
                legislator.party || null,
                legislator.district,
                legislator.counties,
                legislator.email,
                legislator.phone,
                legislator.service_start,
                legislator.link,
            ],
        );
        //sponsor links that were waiting for this legislator
        await this.query(
            `UPDATE bills SET sponsor_id = l.id FROM legislators l
            WHERE l.code = $1 AND bills.sponsor_code = $1 AND bills.sponsor_id IS NULL`,
            [legislator.code],
        );
        await this.query(
            `UPDATE bills SET floor_sponsor_id = l.id FROM legislators l
            WHERE l.code = $1 AND bills.floor_sponsor_code = $1 AND bills.floor_sponsor_id IS NULL`,
            [legislator.code],
        );
    }

    //the code of the legislator in a chamber ("H"/"S") and district - for vote links that don't redirect
    async legislatorCodeForDistrict(chamber: string, district: string) {
        const { rows } = await this.query<{ code: string }>(
            `SELECT code FROM legislators WHERE house = $1 AND district::text = $2`,
            [chamber, district],
        );
        return rows[0]?.code ?? null;
    }

    async legislatorCodes(): Promise<string[]> {
        const { rows } = await this.query<{ code: string }>(
            `SELECT code FROM legislators ORDER BY code`,
        );
        return rows.map((r) => r.code);
    }

    // #endregion

    // #region BILLS

    //the gov API's fields for a bill - inserts it, or refreshes those fields on an existing bill (text,
    //summary, and policy fields from later stages are left alone). Creates the session if it's new, and
    //links sponsors who are in legislators (the code is kept either way)
    async upsertBill(bill: ParsedBill) {
        await this.query(
            `INSERT INTO sessions (code, year) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`,
            [bill.session_code, sessionYear(bill.session_code)],
        );
        await this.query(
            `INSERT INTO bills (session_id, bill_number, short_title, general_provisions,
                highlighted_provisions, money_appropriated, last_action, last_action_date, subjects,
                sponsor_id, sponsor_code, floor_sponsor_id, floor_sponsor_code, tracking_id,
                house_vote_url, senate_vote_url, link)
            SELECT s.id, $2, $3, $4, $5, $6, $7, $8, $9,
                (SELECT id FROM legislators WHERE code = $10), $10,
                (SELECT id FROM legislators WHERE code = $11), $11,
                $12, $13, $14, $15
            FROM sessions s WHERE s.code = $1
            ON CONFLICT (session_id, bill_number) DO UPDATE SET
                short_title = EXCLUDED.short_title,
                general_provisions = EXCLUDED.general_provisions,
                highlighted_provisions = EXCLUDED.highlighted_provisions,
                money_appropriated = EXCLUDED.money_appropriated,
                last_action = EXCLUDED.last_action,
                last_action_date = EXCLUDED.last_action_date,
                subjects = EXCLUDED.subjects,
                sponsor_id = EXCLUDED.sponsor_id,
                sponsor_code = EXCLUDED.sponsor_code,
                floor_sponsor_id = EXCLUDED.floor_sponsor_id,
                floor_sponsor_code = EXCLUDED.floor_sponsor_code,
                tracking_id = EXCLUDED.tracking_id,
                house_vote_url = EXCLUDED.house_vote_url,
                senate_vote_url = EXCLUDED.senate_vote_url,
                link = EXCLUDED.link`,
            [
                bill.session_code,
                bill.bill_number,
                bill.short_title,
                bill.general_provisions,
                bill.highlighted_provisions,
                bill.money_appropriated,
                bill.last_action,
                bill.last_action_date,
                bill.subjects,
                bill.sponsor_code || null,
                bill.floor_sponsor_code || null,
                bill.tracking_id,
                bill.house_vote_url,
                bill.senate_vote_url,
                bill.link,
            ],
        );
    }

    async billsForSession(sessionCode: string): Promise<StoredBill[]> {
        const { rows } = await this.query<StoredBill>(
            `SELECT
                b.id,
                b.bill_number,
                s.code AS session_code,
                s.year::text AS year,
                b.short_title,
                b.full_text,
                b.subjects,
                b.summary_text,
                b.house_vote_url,
                b.senate_vote_url,
                (SELECT COUNT(*) FROM bill_policies bp WHERE bp.bill_id = b.id) AS policy_count,
                (SELECT COUNT(*) FROM votes v WHERE v.bill_id = b.id) AS vote_count,
                b.measure_type
            FROM bills b JOIN sessions s ON s.id = b.session_id
            WHERE s.code = $1
            ORDER BY b.bill_number`,
            [sessionCode],
        );
        return rows;
    }

    //marks a bill passed - false when there's no such bill in the session
    async markPassed(
        sessionCode: string,
        billNumber: string,
        datePassed: string | null,
        effectiveDate: string | null,
    ) {
        const result = await this.query(
            `UPDATE bills SET passed = true, date_passed = $3, effective_date = $4
            FROM sessions s
            WHERE bills.session_id = s.id AND s.code = $1 AND bills.bill_number = $2`,
            [sessionCode, billNumber, datePassed, effectiveDate],
        );
        return (result.rowCount ?? 0) > 0;
    }

    async setFullText(billId: number, fullText: string | null, pdfUrl: string) {
        await this.query(
            `UPDATE bills SET full_text = $2, pdf_link = $3 WHERE id = $1`,
            [billId, fullText, pdfUrl],
        );
    }

    async setSummary(billId: number, summary: string) {
        await this.query(`UPDATE bills SET summary_text = $2 WHERE id = $1`, [
            billId,
            summary,
        ]);
    }

    //a bill's policy classification: its review fields, and its policies replaced all at once. A topic or
    //direction outside the taxonomy can't happen (the LLM's schema only allows the taxonomy's values), but if
    //one did, the topic would be skipped and the direction left NULL rather than failing the bill
    async replaceBillPolicies(
        billId: number,
        classification: PolicyClassification,
    ) {
        return this.atomically(async (q) => {
            await q.query(
                `UPDATE bills SET measure_type = $2, is_substantive = $3, needs_review = $4, review_reason = $5
                WHERE id = $1`,
                [
                    billId,
                    classification.measure_type,
                    classification.is_substantive,
                    classification.needs_review,
                    classification.review_reason,
                ],
            );
            await q.query(`DELETE FROM bill_policies WHERE bill_id = $1`, [
                billId,
            ]);

            let added = 0;
            for (const topic of classification.topics) {
                const result = await q.query(
                    `INSERT INTO bill_policies (bill_id, policy_topic_id, direction_id, strength,
                        impact_level, confidence, neutral_summary)
                    SELECT $1, t.id, (SELECT id FROM policy_directions WHERE name = $3), $4, $5, $6, $7
                    FROM policy_topics t WHERE t.name = $2
                    ON CONFLICT (bill_id, policy_topic_id) DO NOTHING`,
                    [
                        billId,
                        topic.topic,
                        topic.policy_direction,
                        topic.topic_strength,
                        topic.impact_level,
                        topic.confidence,
                        topic.neutral_summary_for_scorecard,
                    ],
                );
                added += result.rowCount ?? 0;
            }
            return added;
        });
    }

    // #endregion

    // #region VOTES

    //a bill's votes in one chamber - legislators are matched by code, and a vote whose legislator isn't in
    //legislators is skipped (the foreign key needs one). Returns how many were stored and skipped
    async upsertVotes(
        billId: number,
        votes: { legislator_code: string; vote: VoteValue }[],
    ) {
        if (votes.length === 0) return { stored: 0, skipped: 0 };
        //one row per legislator - a single upsert can't update the same row twice, so if a page ever lists
        //someone twice, their last vote wins
        votes = [...new Map(votes.map((v) => [v.legislator_code, v])).values()];
        const result = await this.query(
            `INSERT INTO votes (bill_id, legislator_id, vote)
            SELECT $1, l.id, x.vote
            FROM unnest($2::text[], $3::text[]) AS x(code, vote)
            JOIN legislators l ON l.code = x.code
            ON CONFLICT (bill_id, legislator_id) DO UPDATE SET vote = EXCLUDED.vote`,
            [
                billId,
                votes.map((v) => v.legislator_code),
                votes.map((v) => v.vote),
            ],
        );
        const stored = result.rowCount ?? 0;
        return { stored, skipped: votes.length - stored };
    }

    // #endregion

    // #region SCORES

    //a legislator's couple scores for a year, replacing any stored ones
    async upsertCoupleScores(year: number, scores: CoupleScoreRow[]) {
        if (scores.length === 0) return 0;
        const result = await this.query(
            `INSERT INTO legislator_couple_scores (legislator_id, policy_couple_id, year, included_votes, score)
            SELECT l.id, c.id, $1, x.included_votes, x.score
            FROM unnest($2::text[], $3::text[], $4::int[], $5::float8[])
                AS x(legislator_code, couple_name, included_votes, score)
            JOIN legislators l ON l.code = x.legislator_code
            JOIN policy_couples c ON c.name = x.couple_name
            ON CONFLICT (legislator_id, policy_couple_id, year) DO UPDATE SET
                included_votes = EXCLUDED.included_votes,
                score = EXCLUDED.score`,
            [
                year,
                scores.map((s) => s.legislator_id),
                scores.map((s) => s.policy_topic_couple_name),
                scores.map((s) => s.all_included_votes),
                scores.map((s) => s.score),
            ],
        );
        return result.rowCount ?? 0;
    }

    //years that have bills, newest first
    async yearsWithBills(): Promise<number[]> {
        const { rows } = await this.query<{ year: number }>(
            `SELECT DISTINCT s.year FROM sessions s
            WHERE EXISTS (SELECT 1 FROM bills b WHERE b.session_id = s.id)
            ORDER BY s.year DESC`,
        );
        return rows.map((r) => r.year);
    }

    // #endregion
}
