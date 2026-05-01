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
            if (fs.existsSync(this._dbName)) {
                console.log("db exists");
            }
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
                                        PRIMARY KEY(session_id, id))`);

            const createVotesTable = await this
                ._execute(`CREATE TABLE IF NOT EXISTS votes (
                                                    session_id TEXT,
                                                    bill_id TEXT, 
                                                    legislator_id TEXT, 
                                                    vote TEXT NOT NULL,
                                                    PRIMARY KEY(session_id, bill_id, legislator_id))`);
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
                link
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
        const sqlCommand = `UPDATE bills SET summary_text = ? WHERE session_id = ? AND bill_id = ?`;
        const values = [fullText, session_id, bill_id];
        return await this._getAllRows(sqlCommand, values);
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
