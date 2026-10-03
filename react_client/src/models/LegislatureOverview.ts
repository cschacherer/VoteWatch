import { normalizeParty } from "./Legislator";
import { type Bill, createBillFromVote } from "./Bill";

//the year value for "every year" in the legislator score routes - the server scores it live, since
//stored scores are per year
export const ALL_YEARS = "all";

export type AnalysisYear = {
    year: string;
    //true when scores for this year are stored - years without them are scored live for a legislator
    hasScores: boolean;
    //this year's sessions, newest first - ie ["2025S2", "2025S1", "2025GS"]
    sessions: string[];
};

//one legislator's score on one policy couple (only couples they had counted votes on)
export type LegislatorCoupleScore = {
    legislatorId: string;
    formatName: string;
    party: string;
    house: string;
    district: number;
    policyTopic: string;
    policyCoupleName: string;
    policyNameLabel: string;
    leftPolicyDirection: string;
    rightPolicyDirection: string;
    score: number;
    includedVotes: number;
};

//one legislator's vote counts for the year
export type LegislatorParticipation = {
    legislatorId: string;
    fullName: string;
    formatName: string;
    image: string;
    party: string;
    house: string;
    district: number;
    yesVotes: number;
    noVotes: number;
    absentVotes: number;
};

//bills the AI put in one policy direction for the year, and how many passed
export type DirectionOutcome = {
    direction: string;
    bills: number;
    passed: number;
};

export type CoupleOutcome = {
    policyCoupleName: string;
    policyNameLabel: string;
    left: DirectionOutcome;
    right: DirectionOutcome;
    //0-100 on the same scale as legislator scores, based on the bills that PASSED - null if none did
    outcomeScore: number | null;
};

export type TopicOutcome = {
    policyTopic: string;
    bills: number;
    passed: number;
    couples: CoupleOutcome[];
    //directions that aren't part of a couple (ie "Reallocate Spending")
    otherDirections: DirectionOutcome[];
};

//the passed bills behind one couple's legislature outcome score
export type PolicyCoupleOutcome = {
    year: string;
    policyTopic: string;
    policyCoupleName: string;
    policyNameLabel: string;
    leftPolicyDirection: string;
    rightPolicyDirection: string;
    outcomeScore: number | null;
    //each bill's policies[0] is its policy for this couple's topic
    bills: Bill[];
};

export type LegislatureOverview = {
    billsVotedOn: number;
    totalVotes: number;
    absentVotes: number;
    scores: LegislatorCoupleScore[];
    participation: LegislatorParticipation[];
    policyOutcomes: TopicOutcome[];
};

const normalizeHouse = (text?: string) =>
    text?.toUpperCase() === "S" ? "Senate" : "House";

const createDirectionOutcome = (raw: any): DirectionOutcome => ({
    direction: String(raw?.direction ?? ""),
    bills: Number(raw?.bills ?? 0),
    passed: Number(raw?.passed ?? 0),
});

export const createPolicyCoupleOutcome = (raw: any): PolicyCoupleOutcome => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid policy couple outcome payload");
    }

    return {
        year: String(raw.year ?? ""),
        policyTopic: String(raw.policy_topic ?? ""),
        policyCoupleName: String(raw.policy_topic_couple_name ?? ""),
        policyNameLabel: String(raw.name_label ?? ""),
        leftPolicyDirection: String(raw.left_policy_direction ?? ""),
        rightPolicyDirection: String(raw.right_policy_direction ?? ""),
        outcomeScore:
            raw.outcome_score == null ? null : Number(raw.outcome_score),
        //rows are bills joined with one policy row, the same shape createBillFromVote reads
        bills: (raw.bills ?? []).map(createBillFromVote),
    };
};

//one legislator's score on one policy couple, with their party - only couples they have counted votes on
export type PartyCoupleScore = {
    legislatorId: string;
    party: string;
    policyCoupleName: string;
    score: number;
    includedVotes: number;
};

export const createPartyCoupleScore = (raw: any): PartyCoupleScore => ({
    legislatorId: String(raw.legislator_id ?? ""),
    party: normalizeParty(raw.party),
    policyCoupleName: String(raw.policy_topic_couple_name ?? ""),
    score: Number(raw.score ?? 50),
    includedVotes: Number(raw.all_included_votes ?? 0),
});

export const createAnalysisYear = (raw: any): AnalysisYear => ({
    year: String(raw.year ?? ""),
    hasScores: Boolean(raw.has_scores),
    sessions: Array.isArray(raw.sessions) ? raw.sessions.map(String) : [],
});

export const createLegislatureOverview = (raw: any): LegislatureOverview => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid legislature overview payload");
    }

    return {
        billsVotedOn: Number(raw.summary?.bills_voted_on ?? 0),
        totalVotes: Number(raw.summary?.total_votes ?? 0),
        absentVotes: Number(raw.summary?.absent_votes ?? 0),

        scores: (raw.scores ?? []).map((s: any): LegislatorCoupleScore => ({
            legislatorId: String(s.legislator_id ?? ""),
            formatName: String(s.format_name ?? ""),
            party: normalizeParty(s.party),
            house: normalizeHouse(s.house),
            district: Number(s.district ?? 0),
            policyTopic: String(s.policy_topic ?? ""),
            policyCoupleName: String(s.policy_topic_couple_name ?? ""),
            policyNameLabel: String(s.name_label ?? ""),
            leftPolicyDirection: String(s.left_policy_direction ?? ""),
            rightPolicyDirection: String(s.right_policy_direction ?? ""),
            score: Number(s.score ?? 50),
            includedVotes: Number(s.all_included_votes ?? 0),
        })),

        participation: (raw.participation ?? []).map(
            (p: any): LegislatorParticipation => ({
                legislatorId: String(p.legislator_id ?? ""),
                fullName: String(p.full_name ?? ""),
                formatName: String(p.format_name ?? ""),
                image: String(p.image ?? ""),
                party: normalizeParty(p.party),
                house: normalizeHouse(p.house),
                district: Number(p.district ?? 0),
                yesVotes: Number(p.yes_votes ?? 0),
                noVotes: Number(p.no_votes ?? 0),
                absentVotes: Number(p.absent_votes ?? 0),
            }),
        ),

        policyOutcomes: (raw.policy_outcomes ?? []).map(createTopicOutcome),
    };
};

//one topic's outcomes - used by the overview and by the per-session outcomes route
export const createTopicOutcome = (t: any): TopicOutcome => ({
    policyTopic: String(t.policy_topic ?? ""),
    bills: Number(t.bills ?? 0),
    passed: Number(t.passed ?? 0),
    couples: (t.couples ?? []).map((c: any): CoupleOutcome => ({
        policyCoupleName: String(c.policy_topic_couple_name ?? ""),
        policyNameLabel: String(c.name_label ?? ""),
        left: createDirectionOutcome(c.left),
        right: createDirectionOutcome(c.right),
        outcomeScore: c.outcome_score == null ? null : Number(c.outcome_score),
    })),
    otherDirections: (t.other_directions ?? []).map(createDirectionOutcome),
});
