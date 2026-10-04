-- VoteWatch's Postgres schema - the project's final database (decided 2026-10-03). Integer identity ids,
-- with foreign keys between the tables. copySqliteToPostgres.js builds it: it loads SQLite into the
-- "staging" schema (staging.sql), drops and recreates these tables, and fills them with transform.sql.
--
-- Conventions
--   * every table has  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
--   * links between tables are integer foreign keys to those ids, named <table>_id
--   * the old text keys stay as UNIQUE columns (legislators.code 'PETERT', bills.bill_number 'HB0001',
--     sessions.code '2026GS') - the API keeps returning them, and the ETL still matches on them
--   * CHECK constraints for the fixed value sets (vote, house, party, strength, impact)
--   * ON DELETE CASCADE where a child means nothing without its parent (a bill's votes and policies),
--     RESTRICT where deleting the parent would be a mistake (a legislator who has votes)
--
-- Tables are listed parents first, so every REFERENCES points at a table that already exists.

-- ============================================================================================
-- LOOKUP TABLES - small, rarely change
-- ============================================================================================

-- one row per legislative session; bills point here instead of repeating session code and year
CREATE TABLE sessions (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,              -- '2026GS', '2025S1'
    year INTEGER NOT NULL                   -- 2026 (replaces bills.year)
);

-- the 16 policy topics from server/database/policyTopics.js
CREATE TABLE policy_topics (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE               -- 'housing_land_use'
);

-- every direction a bill's policy can push (was the SQLite table "policy_topics")
CREATE TABLE policy_directions (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    policy_topic_id INTEGER NOT NULL REFERENCES policy_topics (id),
    name TEXT NOT NULL UNIQUE               -- 'increase_housing_supply'
);

-- two opposing directions of one topic scored as a single 0-100 axis (was policy_topic_couples)
CREATE TABLE policy_couples (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    policy_topic_id INTEGER NOT NULL REFERENCES policy_topics (id),
    name TEXT NOT NULL UNIQUE,              -- 'housing_supply'
    label TEXT NOT NULL,                    -- 'Housing Supply'
    left_direction_id INTEGER NOT NULL REFERENCES policy_directions (id),
    right_direction_id INTEGER NOT NULL REFERENCES policy_directions (id),
    CHECK (left_direction_id <> right_direction_id),
    UNIQUE (policy_topic_id, left_direction_id, right_direction_id)
);

-- a direction scored on its own (defined but not used yet - was policy_topic_singles)
CREATE TABLE policy_singles (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    policy_topic_id INTEGER NOT NULL REFERENCES policy_topics (id),
    label TEXT NOT NULL,
    direction_id INTEGER NOT NULL REFERENCES policy_directions (id),
    UNIQUE (policy_topic_id, direction_id)
);

-- ============================================================================================
-- CORE TABLES
-- ============================================================================================

CREATE TABLE legislators (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,              -- the Legislature's id, ie 'PETERT' (was legislators.id)
    full_name TEXT NOT NULL,
    format_name TEXT NOT NULL,
    image TEXT,
    house TEXT NOT NULL CHECK (house IN ('H', 'S')),
    party TEXT CHECK (party IN ('R', 'D', 'F')),
    district INTEGER,
    counties TEXT,
    email TEXT,
    phone TEXT,
    service_start TEXT,                     -- free text, ie 'Appointed October 15, 2019'
    link TEXT
);

CREATE TABLE bills (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions (id),
    bill_number TEXT NOT NULL,              -- 'HB0001' (was bills.id)
    short_title TEXT,
    general_provisions TEXT,
    highlighted_provisions TEXT,
    money_appropriated TEXT,
    full_text TEXT,
    pdf_link TEXT,
    summary_text TEXT,                      -- JSON from the LLM (could become JSONB later)
    passed BOOLEAN NOT NULL DEFAULT false,
    date_passed TEXT,                       -- mixed formats in the source data, kept as text for now
    effective_date TEXT,
    last_action TEXT,
    last_action_date TEXT,
    subjects TEXT,                          -- comma separated (could become a bill_subjects table later)
    -- sponsors link to legislators when they're in the table; the code is kept because 5 bill sponsors
    -- and 3 floor sponsors (former legislators) aren't, so their foreign key is NULL
    sponsor_id INTEGER REFERENCES legislators (id),
    sponsor_code TEXT,
    floor_sponsor_id INTEGER REFERENCES legislators (id),
    floor_sponsor_code TEXT,
    tracking_id TEXT,
    house_vote_url TEXT,
    senate_vote_url TEXT,
    link TEXT,
    measure_type TEXT,                      -- 'substantive_policy', 'technical_admin', ...
    is_substantive BOOLEAN,                 -- was INTEGER 0/1
    needs_review BOOLEAN,                   -- was INTEGER 0/1
    review_reason TEXT,
    UNIQUE (session_id, bill_number)
);

CREATE TABLE votes (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES bills (id) ON DELETE CASCADE,
    legislator_id INTEGER NOT NULL REFERENCES legislators (id) ON DELETE RESTRICT,
    vote TEXT NOT NULL CHECK (vote IN ('yes', 'no', 'absent')),
    UNIQUE (bill_id, legislator_id)         -- one vote per legislator per bill
);

-- a bill's policy topics and directions, as classified by the LLM (was "policy")
CREATE TABLE bill_policies (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES bills (id) ON DELETE CASCADE,
    policy_topic_id INTEGER NOT NULL REFERENCES policy_topics (id),
    -- separate from the topic on purpose: 14 rows pair a direction with a different topic (misfiled by
    -- the LLM) - the scoring already skips those, and keeping both ids keeps them visible to fix
    direction_id INTEGER REFERENCES policy_directions (id),
    strength TEXT NOT NULL CHECK (strength IN ('primary', 'secondary')),
    impact_level TEXT NOT NULL CHECK (impact_level IN ('low', 'moderate', 'high')),
    confidence NUMERIC NOT NULL CHECK (confidence BETWEEN 0 AND 1),   -- unconstrained, so nothing is rounded
    neutral_summary TEXT,
    include_in_scorecard BOOLEAN,
    UNIQUE (bill_id, policy_topic_id)       -- one classification per topic per bill
);

-- a legislator's stored score on a policy couple for a year (was leg_scores_policy_topic_couples)
CREATE TABLE legislator_couple_scores (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    legislator_id INTEGER NOT NULL REFERENCES legislators (id) ON DELETE CASCADE,
    policy_couple_id INTEGER NOT NULL REFERENCES policy_couples (id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    included_votes INTEGER NOT NULL CHECK (included_votes >= 0),   -- was all_included_votes
    score DOUBLE PRECISION NOT NULL CHECK (score BETWEEN 0 AND 100),
    UNIQUE (legislator_id, policy_couple_id, year)
);

-- ============================================================================================
-- INDEXES - Postgres indexes primary keys and UNIQUE columns itself, but not the referencing side of a
-- foreign key, so these cover the lookups the app runs most
-- ============================================================================================

CREATE INDEX votes_legislator_idx ON votes (legislator_id);           -- a legislator's voting history
CREATE INDEX bills_sponsor_idx ON bills (sponsor_id);                 -- sponsored bills
CREATE INDEX bills_floor_sponsor_idx ON bills (floor_sponsor_id);
CREATE INDEX bill_policies_direction_idx ON bill_policies (direction_id);  -- couple/direction scoring
CREATE INDEX bill_policies_topic_idx ON bill_policies (policy_topic_id);
CREATE INDEX legislator_couple_scores_couple_year_idx
    ON legislator_couple_scores (policy_couple_id, year);            -- Party Trends, Compare switch
