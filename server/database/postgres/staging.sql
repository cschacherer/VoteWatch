-- STAGING - a straight copy of the SQLite tables (server/database/voteWatch.db), same table and column
-- names, so copySqliteToPostgres.js can load them as-is. transform.sql then fills the real tables
-- (schema.sql) from these. The copy script runs this with search_path set to the "staging" schema, and
-- drops that schema again once the transform is done.
--
-- Types (SQLite doesn't enforce its declared types, so the data needed these choices):
--   bills.passed        BOOLEAN  - SQLite holds the text 'true' or the integer 0
--   policy.confidence   NUMERIC  - SQLite holds text like '0.95'
--   scores              DOUBLE PRECISION
--   date columns        TEXT     - mixed formats ('2026-01-29T0:00:00.000Z', '1/31/2026', ''), kept as-is
--   no keys or constraints - staging only has to hold the rows; schema.sql enforces the rules

CREATE TABLE legislators (
    id TEXT,
    full_name TEXT,
    format_name TEXT,
    image TEXT,
    house TEXT,
    party TEXT,
    district INTEGER,
    counties TEXT,
    email TEXT,
    phone TEXT,
    service_start TEXT,
    link TEXT
);

CREATE TABLE bills (
    session_id TEXT,
    id TEXT,
    short_title TEXT,
    general_provisions TEXT,
    highlighted_provisions TEXT,
    money_appropriated TEXT,
    full_text TEXT,
    pdf_link TEXT,
    summary_text TEXT,
    year TEXT,
    passed BOOLEAN,
    date_passed TEXT,
    effective_date TEXT,
    last_action TEXT,
    last_action_date TEXT,
    subjects TEXT,
    bill_sponsor TEXT,
    floor_sponsor TEXT,
    tracking_id TEXT,
    house_vote_url TEXT,
    senate_vote_url TEXT,
    link TEXT,
    policy_topics TEXT,
    measure_type TEXT,
    is_substantive INTEGER,
    needs_review INTEGER,
    review_reason TEXT
);

CREATE TABLE votes (
    session_id TEXT,
    bill_id TEXT,
    legislator_id TEXT,
    vote TEXT
);

CREATE TABLE policy (
    session_id TEXT,
    bill_id TEXT,
    policy_topic TEXT,
    policy_topic_strength TEXT,
    policy_direction TEXT,
    impact_level TEXT,
    confidence NUMERIC,
    neutral_summary TEXT,
    include_in_scorecard TEXT
);

-- despite the name, one row per policy DIRECTION (with its topic) - becomes policy_directions
CREATE TABLE policy_topics (
    policy_topic TEXT,
    policy_direction TEXT
);

-- the older per-direction scores - not carried into schema.sql (superseded by couple scores)
CREATE TABLE policy_score (
    legislator_id TEXT,
    year TEXT,
    policy_topic TEXT,
    policy_direction TEXT,
    score DOUBLE PRECISION,
    all_votes INTEGER,
    included_votes INTEGER,
    yes_votes INTEGER
);

CREATE TABLE policy_topic_couples (
    id INTEGER,
    policy_topic TEXT,
    name_label TEXT,
    left_policy_direction TEXT,
    right_policy_direction TEXT,
    policy_topic_couple_name TEXT
);

CREATE TABLE policy_topic_singles (
    id INTEGER,
    policy_topic TEXT,
    name_label TEXT,
    policy_direction TEXT
);

CREATE TABLE leg_scores_policy_topic_couples (
    legislator_id TEXT,
    year TEXT,
    policy_topic_couple_name TEXT,
    all_included_votes INTEGER,
    score DOUBLE PRECISION
);
