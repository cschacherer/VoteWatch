-- fills the real tables (schema.sql) from the straight SQLite copy in the "staging" schema (staging.sql).
-- Run by copySqliteToPostgres.js inside its transaction, after schema.sql has recreated the tables.
--
-- Parents are filled first, so every integer id a child needs already exists; the children look those ids
-- up by joining on the old text keys (session code, bill number, legislator code, topic/direction names).
-- ORDER BY keeps the new ids in a stable, readable order (ie bills numbered by session then bill number).

-- SESSIONS - one per session code on a bill
INSERT INTO sessions (code, year)
SELECT DISTINCT session_id, year::integer
FROM staging.bills
ORDER BY session_id;

-- POLICY TOPICS - every topic named by a direction, couple, single, or bill policy
INSERT INTO policy_topics (name)
SELECT name FROM (
    SELECT policy_topic AS name FROM staging.policy_topics
    UNION SELECT policy_topic FROM staging.policy_topic_couples
    UNION SELECT policy_topic FROM staging.policy_topic_singles
    UNION SELECT policy_topic FROM staging.policy WHERE bill_id IS NOT NULL
) AS topics
ORDER BY name;

-- POLICY DIRECTIONS - the SQLite "policy_topics" table is really one row per direction
INSERT INTO policy_directions (policy_topic_id, name)
SELECT t.id, d.policy_direction
FROM staging.policy_topics d
JOIN policy_topics t ON t.name = d.policy_topic
ORDER BY t.name, d.policy_direction;

INSERT INTO policy_couples (policy_topic_id, name, label, left_direction_id, right_direction_id)
SELECT t.id, c.policy_topic_couple_name, c.name_label, l.id, r.id
FROM staging.policy_topic_couples c
JOIN policy_topics t ON t.name = c.policy_topic
JOIN policy_directions l ON l.name = c.left_policy_direction
JOIN policy_directions r ON r.name = c.right_policy_direction
ORDER BY c.policy_topic_couple_name;

INSERT INTO policy_singles (policy_topic_id, label, direction_id)
SELECT t.id, s.name_label, d.id
FROM staging.policy_topic_singles s
JOIN policy_topics t ON t.name = s.policy_topic
JOIN policy_directions d ON d.name = s.policy_direction
ORDER BY t.name, s.name_label;

-- LEGISLATORS - the Legislature's id becomes legislators.code
INSERT INTO legislators (code, full_name, format_name, image, house, party, district, counties,
    email, phone, service_start, link)
SELECT id, full_name, format_name, image, house, party, district, counties,
    email, phone, service_start, link
FROM staging.legislators
ORDER BY id;

-- BILLS - year moves to sessions, and the legacy policy_topics column is dropped. Sponsors link to
-- legislators when they're in the table (LEFT JOIN); the code is kept either way, because a few sponsors
-- are former legislators who aren't. An empty floor sponsor becomes NULL
INSERT INTO bills (session_id, bill_number, short_title, general_provisions, highlighted_provisions,
    money_appropriated, full_text, pdf_link, summary_text, passed, date_passed, effective_date,
    last_action, last_action_date, subjects, sponsor_id, sponsor_code, floor_sponsor_id,
    floor_sponsor_code, tracking_id, house_vote_url, senate_vote_url, link, measure_type,
    is_substantive, needs_review, review_reason)
SELECT s.id, b.id, b.short_title, b.general_provisions, b.highlighted_provisions,
    b.money_appropriated, b.full_text, b.pdf_link, b.summary_text, COALESCE(b.passed, false),
    b.date_passed, b.effective_date, b.last_action, b.last_action_date, b.subjects,
    sponsor.id, NULLIF(b.bill_sponsor, ''), floor_sponsor.id, NULLIF(b.floor_sponsor, ''),
    b.tracking_id, b.house_vote_url, b.senate_vote_url, b.link, b.measure_type,
    b.is_substantive <> 0, b.needs_review <> 0, b.review_reason
FROM staging.bills b
JOIN sessions s ON s.code = b.session_id
LEFT JOIN legislators sponsor ON sponsor.code = NULLIF(b.bill_sponsor, '')
LEFT JOIN legislators floor_sponsor ON floor_sponsor.code = NULLIF(b.floor_sponsor, '')
ORDER BY b.session_id, b.id;

-- VOTES - bill and legislator by integer id (every vote matches both; the copy script checks the count)
INSERT INTO votes (bill_id, legislator_id, vote)
SELECT b.id, l.id, v.vote
FROM staging.votes v
JOIN sessions s ON s.code = v.session_id
JOIN bills b ON b.session_id = s.id AND b.bill_number = v.bill_id
JOIN legislators l ON l.code = v.legislator_id
ORDER BY b.id, l.id;

-- BILL POLICIES - the 105 old rows with no bill drop out at the bill join. A direction that isn't in the
-- taxonomy (6 rows) keeps a NULL direction_id (LEFT JOIN); a direction filed under another topic (14 rows)
-- keeps both ids, since topic and direction are separate links
INSERT INTO bill_policies (bill_id, policy_topic_id, direction_id, strength, impact_level, confidence,
    neutral_summary, include_in_scorecard)
SELECT b.id, t.id, d.id, p.policy_topic_strength, p.impact_level, p.confidence, p.neutral_summary,
    CASE
        WHEN p.include_in_scorecard IS NULL OR p.include_in_scorecard = '' THEN NULL
        ELSE lower(p.include_in_scorecard) IN ('true', '1')
    END
FROM staging.policy p
JOIN sessions s ON s.code = p.session_id
JOIN bills b ON b.session_id = s.id AND b.bill_number = p.bill_id
JOIN policy_topics t ON t.name = p.policy_topic
LEFT JOIN policy_directions d ON d.name = p.policy_direction
ORDER BY b.id, t.id;

-- LEGISLATOR COUPLE SCORES - the stored scores the JavaScript ETL calculated (staging.policy_score, the
-- older per-direction scores, isn't carried over)
INSERT INTO legislator_couple_scores (legislator_id, policy_couple_id, year, included_votes, score)
SELECT l.id, c.id, ls.year::integer, ls.all_included_votes, ls.score
FROM staging.leg_scores_policy_topic_couples ls
JOIN legislators l ON l.code = ls.legislator_id
JOIN policy_couples c ON c.name = ls.policy_topic_couple_name
ORDER BY l.id, c.id, ls.year;
