//row shapes as the API returns them - snake_case, with the original text keys (session_id '2026GS',
//id 'HB0001', legislator_id 'PETERT') that database.ts rebuilds from the integer-id tables in
//server/database/postgres/schema.sql.
//COUNT/SUM come back as numbers (database.ts parses bigints), NUMERIC columns like policy.confidence as
//strings ('0.95'), and dates as the TEXT they were stored as

export type SqlParam = string | number | null;

export type LegislatorRow = {
    id: string;
    full_name: string;
    format_name: string;
    image: string | null;
    house: string | null;
    party: string | null;
    district: number | null;
    counties: string | null;
    email: string | null;
    phone: string | null;
    service_start: string | null;
    link: string | null;
};

export type BillRow = {
    session_id: string;
    id: string;
    short_title: string | null;
    general_provisions: string | null;
    highlighted_provisions: string | null;
    money_appropriated: string | null;
    full_text: string | null;
    pdf_link: string | null;
    summary_text: string | null;
    year: string | null;
    passed: boolean | null;
    date_passed: string | null;
    effective_date: string | null;
    last_action: string | null;
    last_action_date: string | null;
    subjects: string | null;
    bill_sponsor: string | null;
    floor_sponsor: string | null;
    tracking_id: string | null;
    house_vote_url: string | null;
    senate_vote_url: string | null;
    link: string | null;
    measure_type: string | null;
    is_substantive: number | null;
    needs_review: number | null;
    review_reason: string | null;
};

export type VoteValue = "yes" | "no" | "absent";

export type PolicyRow = {
    session_id: string | null;
    bill_id: string | null;
    policy_topic: string;
    policy_topic_strength: string | null;
    policy_direction: string | null;
    impact_level: string | null;
    //NUMERIC - a string like '0.95' from a column, a number inside json_build_object
    confidence: string | number | null;
    neutral_summary: string | null;
    include_in_scorecard: string | null;
};

//one of a bill's policies, as the BILL_POLICIES_COLUMN subquery returns them
export type BillPolicy = Omit<PolicyRow, "session_id" | "bill_id">;

export type PolicyTopicCoupleRow = {
    id: number;
    policy_topic: string;
    name_label: string;
    left_policy_direction: string;
    right_policy_direction: string;
    policy_topic_couple_name: string;
};

//a legislator's score on one policy couple - stored in leg_scores_policy_topic_couples, or computed live
export type CoupleScoreRow = {
    legislator_id: string;
    year: string;
    policy_topic: string;
    policy_topic_couple_name: string;
    name_label: string;
    left_policy_direction: string;
    right_policy_direction: string;
    all_included_votes: number;
    score: number;
};

//one vote on a bill whose policy sits on either side of a couple - the input to live scoring
export type CoupleVoteRow = {
    legislator_id: string;
    policy_topic_couple_name: string;
    vote: VoteValue;
    policy_direction: string;
    impact_level: string | null;
    policy_topic_strength: string | null;
    confidence: string | number | null;
};

//every legislator's couple score with their party, for comparing one legislator with the party medians
export type PartyCoupleScoreRow = {
    legislator_id: string;
    party: string | null;
    policy_topic_couple_name: string;
    score: number;
    all_included_votes: number;
};

//the policy fields that decide how much a bill counts toward a score
export type WeightedPolicy = {
    impact_level: string | null;
    policy_topic_strength: string | null;
    confidence: string | number | null;
};
