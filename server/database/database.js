import fs from "fs";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import path from "path";

class Database {
    constructor() {
        this.sqlite = sqlite3.verbose();

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        this._dbName = path.join(__dirname, "voteWatch.db");
    }

    // #region GENERAL DATABASE METHODS
    async createNewDatabase() {
        try {
            // this._dbName = name;
            if (fs.existsSync(this._dbName)) {
                fs.unlinkSync(this._dbName);
            }
            await this.openDatabase(this._dbName);
            await this._createTables();
        } catch (err) {
            console.log(`Error creating new database: ${err.stack}`);
        }
    }

    async openDatabase() {
        try {
            // if (fs.existsSync(this._dbName)) {
            //     console.log("db exists");
            // }
            this._db = new this.sqlite.Database(this._dbName, (err) => {
                if (err) {
                    console.log(err.message);
                    return;
                }
            });
            await this._execute("PRAGMA foreign_keys = ON");
        } catch (err) {
            console.log(`Error opening database: ${err.stack}`);
        }
    }

    closeDatabase() {
        try {
            this._db.close();
        } catch (err) {
            console.log(`Error closing database. ${err.stack}`);
        }
    }

    async _createTables() {
        try {
            const createLegislatorsTable = await this
                ._execute(`CREATE TABLE IF NOT EXISTS legislators (
                                            id TEXT PRIMARY KEY, 
                                            full_name TEXT NOT NULL, 
                                            format_name TEXT NOT NULL, 
                                            image TEXT, 
                                            house TEXT, 
                                            party TEXT, 
                                            district INTEGER, 
                                            counties TEXT, 
                                            email TEXT, 
                                            phone TEXT, 
                                            service_start TEXT, 
                                            link TEXT)`);

            const createBillsTable = await this
                ._execute(`CREATE TABLE IF NOT EXISTS bills (
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
                                        date_passed DATE,
                                        effective_date DATE,
                                        last_action TEXT,
                                        last_action_date DATE, 
                                        subjects TEXT, 
                                        bill_sponsor TEXT, 
                                        floor_sponsor TEXT,
                                        tracking_id TEXT,
                                        house_vote_url TEXT, 
                                        senate_vote_url TEXT,  
                                        link TEXT,
                                        measure_type TEXT, 
                                        is_substantive TEXT,
                                        needs_review BOOLEAN,
                                        review_reason TEXT,
                                        PRIMARY KEY(session_id, id))`);

            const createVotesTable = await this
                ._execute(`CREATE TABLE IF NOT EXISTS votes (
                                                    session_id TEXT,
                                                    bill_id TEXT, 
                                                    legislator_id TEXT, 
                                                    vote TEXT NOT NULL,
                                                    PRIMARY KEY(session_id, bill_id, legislator_id))`);

            const createPolicyTable = await this
                ._execute(`CREATE TABLE IF NOT EXISTS policy (
                                                    session_id TEXT,
                                                    bill_id TEXT, 
                                                    policy_topic TEXT, 
                                                    policy_topic_strength TEXT,
                                                    policy_direction TEXT,
                                                    impact_level TEXT, 
                                                    confidence TEXT,
                                                    neutral_summary TEXT, 
                                                    include_in_scorecard TEXT,
                                                    PRIMARY KEY(session_id, bill_id, policy_topic))`);

            const createPolicyScoreTable = await this
                ._execute(`CREATE TABLE IF NOT EXISTS policy_score (
                                                    legislator_id TEXT,
                                                    year TEXT,
                                                    policy_topic TEXT, 
                                                    policy_direction TEXT,
                                                    score DECIMAL,
                                                    PRIMARY KEY(session_id, bill_id, policy_topic))`);
        } catch (err) {
            console.log(`Error creating tables: ${err.stack}`);
        }
    }

    // #endregion

    // #region BILL FUNCTIONS
    async addToBills(bill) {
        try {
            const sqlCommand = `INSERT OR IGNORE INTO bills (
                session_id, 
                id, 
                short_title, 
                general_provisions,
                highlighted_provisions,
                money_appropriated,
                full_text,
                pdf_link,
                summary_text,
                year, 
                passed, 
                date_passed, 
                effective_date,
                last_action,
                last_action_date, 
                subjects, 
                bill_sponsor, 
                floor_sponsor,
                tracking_id,
                house_vote_url, 
                senate_vote_url,
                link,
                measure_type, 
                is_substantive,
                needs_review,
                review_reason
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = [
                bill.session_id,
                bill.id,
                bill.short_title,
                bill.general_provisions,
                bill.highlighted_provisions,
                bill.money_appropriated,
                bill.full_text,
                bill.pdf_link,
                bill.summary_text,
                bill.year,
                bill.passed,
                bill.date_passed,
                bill.effective_date,
                bill.last_action,
                bill.last_action_date,
                bill.subjects,
                bill.bill_sponsor,
                bill.floor_sponsor,
                bill.tracking_id,
                bill.house_vote_url,
                bill.senate_vote_url,
                bill.link,
                bill.policy_topics,
                bill.measure_type,
                bill.is_substantive,
                bill.needs_review,
                bill.review_reason,
            ];

            const result = await this._execute(sqlCommand, values);
        } catch (err) {
            console.log(
                `Error adding information to bills table: ${err.stack}`,
            );
        }
    }

    async addPassedDataToBill(
        session_id,
        bill_id,
        date_passed,
        effective_date,
    ) {
        const sqlCommand = `UPDATE bills SET passed = 'true', date_passed = ?, effective_date = ? WHERE session_id = ? AND id = ?`;
        const values = [date_passed, effective_date, session_id, bill_id];
        return await this._getAllRows(sqlCommand, values);
    }

    async addFullTextToBill(session_id, bill_id, full_text, pdf_link) {
        const sqlCommand = `UPDATE bills SET full_text = ?, pdf_link = ? WHERE session_id = ? AND id = ?`;
        const values = [full_text, pdf_link, session_id, bill_id];
        return await this._getAllRows(sqlCommand, values);
    }

    async addTextSummaryToBill(session_id, bill_id, summary_text) {
        const sqlCommand = `UPDATE bills SET summary_text = ? WHERE session_id = ? AND id = ?`;
        const values = [summary_text, session_id, bill_id];
        return await this._getAllRows(sqlCommand, values);
    }

    async addPolicyPropertiesToBill(
        session_id,
        bill_id,
        measure_type,
        is_substantive,
        needs_review,
        review_reason,
    ) {
        const sqlCommand = `UPDATE bills SET measure_type = ?, is_substantive = ?, needs_review = ?, review_reason = ? WHERE session_id = ? AND id = ?`;
        const values = [
            measure_type,
            is_substantive,
            needs_review,
            review_reason,
            session_id,
            bill_id,
        ];
        return await this._getAllRows(sqlCommand, values);
    }

    async getPolicyTopicsFromBill(session_id, bill_id) {
        const sqlCommand = `SELECT policy_topics FROM bills WHERE session_id = ? AND id = ?`;
        const values = [session_id, bill_id];
        return await this._getFirstRow(sqlCommand, values);
    }

    async getTextSummaryFromBill(session_id, bill_id) {
        const sqlCommand = `SELECT summary_text FROM bills WHERE session_id = ? AND id = ?`;
        const values = [session_id, bill_id];
        return await this._getFirstRow(sqlCommand, values);
    }

    async getBillWithPolicies(id, session_id) {
        // const sqlCommand = `SELECT * FROM bills JOIN policy ON bills.id = policy.bill_id AND bills.session_id = policy.session_id WHERE bill.session_id = ? AND bill.id = ?`;
        // const values = [id, session_id];
        // return await this._getAllRows(sqlCommand, values);
        //         const sqlCommand = `SELECT
        //     b.*,
        //     COALESCE(
        //         json_agg(
        //         json_build_object(
        //             'session_id', bp.session_id,
        //             'bill_id', bp.bill_id,
        //             'policy_topic', bp.policy_topic,
        //             'policy_topic_strength', bp.policy_topic_strength,
        //             'policy_direction', bp.policy_direction,
        //             'impact_level', bp.impact_level,
        //             'confidence', bp.confidence,
        //             'neutral_summary', bp.neutral_summary
        //         )
        //         ) FILTER (WHERE bp.bill_id IS NOT NULL),
        //         '[]'
        //     ) AS bill_policies
        //     FROM bills b
        //     LEFT JOIN policy bp
        //     ON bp.bill_id = b.bill_id
        //     GROUP BY b.bill_id;`;
    }

    async getBill(id, session_id) {
        const sqlCommand = `SELECT * FROM bills WHERE (id = ? AND session_id = ?)`;
        const values = [id, session_id];
        return await this._getFirstRow(sqlCommand, values);
    }

    async getAllBills() {
        const sqlCommand = `SELECT * FROM bills`;

        return await this._getAllRows(sqlCommand);
    }

    async getAllBillsForSession(session_id) {
        const sqlCommand = `SELECT * FROM bills WHERE session_id = ?`;
        const values = [session_id];
        return await this._getAllRows(sqlCommand, values);
    }

    async getAllBillsAndPolicies(session_id) {
        try {
            const sqlCommand = `SELECT bills.*, policy.* 
                            FROM bills JOIN policy ON policy.bill_id = bills.id WHERE bills.session_id = ?`;
            const values = [session_id];
            return await this._getAllRows(sqlCommand, values);
        } catch (e) {
            console.log(e);
        }
    }

    // #endregion

    // #region POLICY FUNCTIONS
    async createPolicyScoreTable() {
        try {
            const createPolicyScoreTable = await this
                ._execute(`CREATE TABLE policy_score (
                                                    legislator_id TEXT,
                                                    year TEXT,
                                                    policy_topic TEXT,
                                                    policy_direction TEXT,
                                                    score DECIMAL,
                                                    all_votes INT, 
                                                    included_votes INT,
                                                    yes_votes INT,
                                                    PRIMARY KEY(legislator_id, year, policy_direction))`);
        } catch (e) {
            console.log(e);
        }
    }

    async createPolicyTopicTable() {
        try {
            const createPolicyScoreTable = await this
                ._execute(`CREATE TABLE IF NOT EXISTS policy_topics (
                                                    policy_direction TEXT,
                                                    policy_topic TEXT,
                                                    PRIMARY KEY(policy_direction))`);
        } catch (e) {
            console.log(e);
        }
    }

    // async addToPolicyTopic(policy_topic, policy_direction) {
    //     try {
    //         const sqlCommand = `INSERT OR IGNORE INTO policy (
    //             policy_topic,
    //             policy_direction
    //           ) VALUES (?, ?)`;

    //         const values = [policy_topic, policy_direction];

    //         return await this._execute(sqlCommand, values);
    //     } catch (err) {
    //         console.log(
    //             `Error adding information to policy table: ${err.stack}`,
    //         );
    //     }
    // }

    async addToPolicyTopic(policy_topic, policy_direction) {
        try {
            const sqlCommand = `INSERT INTO policy_topics (
                policy_direction,
                policy_topic
              ) VALUES (?, ?)
                ON CONFLICT (policy_direction) 
                DO UPDATE SET policy_direction = EXCLUDED.policy_direction, policy_topic = EXCLUDED.policy_topic`;

            const values = [policy_direction, policy_topic];

            return await this._execute(sqlCommand, values);
        } catch (err) {
            console.log(
                `Error adding information to policy table: ${err.stack}`,
            );
        }
    }

    async addToPolicy(session_id, bill_id, policy) {
        try {
            const sqlCommand = `INSERT OR IGNORE INTO policy (
                session_id, 
                bill_id, 
                policy_topic, 
                policy_topic_strength,
                policy_direction,
                impact_level,
                confidence,
                neutral_summary
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = [
                session_id,
                bill_id,
                policy.topic,
                policy.topic_strength,
                policy.policy_direction,
                policy.impact_level,
                policy.confidence,
                policy.neutral_summary_for_scorecard,
            ];

            return await this._execute(sqlCommand, values);
        } catch (err) {
            console.log(
                `Error adding information to policy table: ${err.stack}`,
            );
        }
    }

    async addToPolicyScore(
        legislator_id,
        year,
        policy_topic,
        policy_direction,
        score,
        all_votes,
        included_votes,
        yes_votes,
    ) {
        try {
            const sqlCommand = `INSERT OR IGNORE INTO policy_score (
                legislator_id, 
                year, 
                policy_topic,
                policy_direction, 
                score,
                all_votes,
                included_votes,
                yes_votes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = [
                legislator_id,
                year,
                policy_topic,
                policy_direction,
                score,
                all_votes,
                included_votes,
                yes_votes,
            ];

            return await this._execute(sqlCommand, values);
        } catch (err) {
            console.log(
                `Error adding information to policy score table: ${err.stack}`,
            );
        }
    }

    async getBillPolicies(session_id, bill_id) {
        const sqlCommand = `SELECT * FROM policy WHERE session_id = ? AND bill_id = ?`;
        const values = [session_id, bill_id];
        return await this._getAllRows(sqlCommand, values);
    }

    async getBillsForPolicyTopic(session_id, policy_topic) {
        const sqlCommand = `SELECT * FROM policy WHERE session_id = ? AND policy_topic = ?`;
        const values = [session_id, policy_topic];
        return await this._getAllRows(sqlCommand, values);
    }

    async getBillsForPolicyDirection(
        session_id,
        policy_topic,
        policy_direction,
    ) {
        const sqlCommand = `SELECT * FROM policy WHERE session_id = ? AND policy_topic = ? AND policy_direction = ?`;
        const values = [session_id, policy_topic, policy_direction];
        return await this._getAllRows(sqlCommand, values);
    }

    // #endregion

    // #region LEGISLATURE FUNCTIONS
    async addToLegislators(legislator) {
        try {
            const sqlCommand = `INSERT OR IGNORE INTO legislators (
                id, full_name, format_name, image, house,
                party, district, counties, email, phone,
                service_start, link
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = [
                legislator.id,
                legislator.full_name,
                legislator.format_name,
                legislator.image,
                legislator.house,
                legislator.party,
                legislator.district,
                legislator.counties,
                legislator.email,
                legislator.cell,
                legislator.service_start,
                legislator.link,
            ];

            return await this._execute(sqlCommand, values);
        } catch (err) {
            console.log(
                `Error adding information to legislators table: ${err.stack}`,
            );
        }
    }

    async getAllLegislators() {
        const sqlCommand = `SELECT * FROM legislators`;
        return await this._getAllRows(sqlCommand);
    }

    async getLegislator(id) {
        const sqlCommand = `SELECT * FROM legislators WHERE id = ?`;
        const values = [id];
        return await this._getFirstRow(sqlCommand, values);
    }

    async getLegislatorFromDistrict(chamber, district) {
        const sqlCommand = `SELECT * FROM legislators WHERE house = ? AND district = ?`;
        const values = [chamber, district];
        return await this._getFirstRow(sqlCommand, values);
    }

    async getLegislatorSponsoredBills(legislator_id) {
        const sqlCommand = `SELECT * FROM bills WHERE bill_sponsor = ? OR floor_sponsor = ?`;
        const values = [legislator_id, legislator_id];
        return await this._getAllRows(sqlCommand, values);
    }

    async getAllBillsAndVotesForLegislator(legislatorId) {
        const joinCommand = `SELECT 
                                votes.legislator_id,
                                votes.bill_id, 
                                votes.session_id,
                                votes.vote, 
                                bills.short_title,
                                bills.summary_text,
                                bills.general_provisions, 
                                bills.highlighted_provisions, 
                                bills.year,
                                bills.passed,
                                bills.date_passed,
                                bills.effective_date, 
                                bills.last_action,
                                bills.last_action_date, 
                                bills.subjects,
                                bills.link
                            FROM legislators 
                            INNER JOIN votes 
                                ON votes.legislator_id = legislators.id 
                            INNER JOIN bills 
                                ON (bills.id = votes.bill_id AND bills.session_id = votes.session_id)
                            WHERE legislators.id = ?`;

        const values = [legislatorId];

        return await this._getAllRows(joinCommand, values);
    }

    async getAllBillsAndVotesForLegislatorBySession(legislatorId, sessionId) {
        const joinCommand = `SELECT 
                                votes.legislator_id,
                                votes.bill_id, 
                                votes.session_id,
                                votes.vote, 
                                bills.short_title,
                                bills.summary_text,
                                bills.general_provisions, 
                                bills.highlighted_provisions, 
                                bills.year,
                                bills.passed,
                                bills.date_passed,
                                bills.effective_date, 
                                bills.last_action,
                                bills.last_action_date, 
                                bills.subjects,
                                bills.link
                            FROM legislators 
                            INNER JOIN votes 
                                ON votes.legislator_id = legislators.id 
                            INNER JOIN bills 
                                ON (bills.id = votes.bill_id AND bills.session_id = votes.session_id)
                            WHERE legislators.id = ? AND votes.session_id = ?`;

        const values = [legislatorId, sessionId];

        return await this._getAllRows(joinCommand, values);
    }

    async getAllBillsAndVotesForLegislatorByPolicyDirection(
        legislatorId,
        policyTopic,
        policyDirection,
        year,
    ) {
        const sqlCommand = `
        SELECT 
            bills.*,
            votes.vote,
            votes.legislator_id,
            policy.policy_topic,
            policy.policy_direction
        FROM votes
        JOIN bills 
            ON bills.id = votes.bill_id
        JOIN policy 
            ON policy.bill_id = bills.id
        WHERE votes.legislator_id = ?
          AND policy.policy_topic = ?
          AND policy.policy_direction = ?
          AND bills.year = ?
    `;

        const values = [legislatorId, policyTopic, policyDirection, year];

        return await this._getAllRows(sqlCommand, values);
    }

    async getPolicyAnalysisForLegislatorByYear(legislatorId, year) {
        const sqlCommand = `SELECT *
                            FROM policy_score
                            WHERE legislator_id = ? AND year = ?`;
        const values = [legislatorId, year];

        return await this._getAllRows(sqlCommand, values);
    }

    // #endregion

    // #region VOTE FUNCTIONS
    async addToVotes(vote) {
        try {
            const insertSql = `INSERT OR IGNORE INTO votes (
                session_id, bill_id, legislator_id, vote
              )  VALUES (?, ?, ?, ?)`;
            const values = [
                vote.session_id,
                vote.bill_id,
                vote.legislator_id,
                vote.vote,
            ];

            return await this._execute(insertSql, values);
        } catch (err) {
            console.log(
                `Error adding information to votes table: ${err.stack}. ${Object.values(vote)}`,
            );
        }
    }

    async getAllVotesOnBill(bill_id, session_id) {
        const sqlCommand = `SELECT session_id, bill_id, legislator_id, full_name, vote, house FROM votes JOIN legislators ON votes.legislator_id = legislators.id AND votes.bill_id = ? AND votes.session_id = ?`;
        const values = [bill_id, session_id];
        return await this._getAllRows(sqlCommand, values);
    }

    async getVotesForAllBills(session_id) {
        const allBillsForSessionId =
            await this.getAllBillsForSession(session_id);

        const joinCommand = `SELECT * FROM bills JOIN votes ON bills.id = votes.bill_id AND bills.session_id = votes.session_id AND (bills.session_id = ?)`;
        const values = [session_id];

        return await this._getAllRows(joinCommand, values);
    }

    // #endregion

    // #region INTERNAL METHODS
    async _execute(sql, params = []) {
        if (params && params.length !== 0) {
            return new Promise((resolve, reject) => {
                //use db.run if you want to add in parameter values
                this._db.run(sql, params, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } else {
            return new Promise((resolve, reject) => {
                //use db.exec if you do not need any parameter values
                this._db.exec(sql, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        }
    }

    //get MULTIPLE rows matching sql query
    async _getAllRows(sql, params) {
        return new Promise((resolve, reject) => {
            this._db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    //get first row matching sql query
    async _getFirstRow(sql, params) {
        return new Promise((resolve, reject) => {
            this._db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // #endregion
}

export default Database;
