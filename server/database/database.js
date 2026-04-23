import fs from "fs";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import path from "path";

class Database {
    constructor() {
        //need to fix database name

        this.sqlite = sqlite3.verbose();

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        this._dbName = path.join(__dirname, "voteWatch.db");
        //this._dbName = `C:/Users/Conner Schacherer/Desktop/VoteWatch/server/database/voteWatch.db`;
    }

    //external methods
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

    async addToBills(bill) {
        try {
            const sqlCommand = `INSERT OR IGNORE INTO bills (
                id, 
                short_title, 
                general_provisions,
                highlighted_provisions,
                year, 
                session_id, 
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
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = [
                bill.id,
                bill.shortTitle,
                bill.generalProvisions,
                bill.highlightedProvisions,
                bill.year,
                bill.sessionId,
                bill.passed,
                bill.datePassed,
                bill.effectiveDate,
                bill.lastAction,
                bill.lastActionDate,
                bill.subjects,
                bill.billSponsor,
                bill.floorSponsor,
                bill.trackingId,
                bill.houseVoteUrl,
                bill.senateVoteUrl,
                bill.link,
            ];

            const result = await this._execute(sqlCommand, values);
        } catch (err) {
            console.log(
                `Error adding information to bills table: ${err.stack}`,
            );
        }
    }

    async addToLegislators(legislator) {
        try {
            const sqlCommand = `INSERT OR IGNORE INTO legislators (
                id, full_name, format_name, image, house,
                party, district, counties, email, phone,
                service_start, link
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = [
                legislator.id,
                legislator.fullName,
                legislator.formatName,
                legislator.image,
                legislator.house,
                legislator.party,
                legislator.district,
                legislator.counties,
                legislator.email,
                legislator.cell,
                legislator.serviceStart,
                legislator.link,
            ];

            return await this._execute(sqlCommand, values);
        } catch (err) {
            console.log(
                `Error adding information to legislators table: ${err.stack}`,
            );
        }
    }

    async addToVotes(vote) {
        try {
            const insertSql = `INSERT OR IGNORE INTO votes (
                session_id, bill_id, legislator_id, vote
              )  VALUES (?, ?, ?, ?)`;
            const values = [
                vote.sessionId,
                vote.billId,
                vote.legislatorId,
                vote.vote,
            ];

            return await this._execute(insertSql, values);
        } catch (err) {
            console.log(
                `Error adding information to votes table: ${err.stack}. ${Object.values(vote)}`,
            );
        }
    }

    async getAllBills() {
        const sqlCommand = `SELECT * FROM bills`;
        return await this._getAllRows(sqlCommand);
    }

    async getAllBillsForSession(sessionId) {
        const sqlCommand = `SELECT * FROM bills WHERE session_id = ?`;
        const values = [sessionId];
        return await this._getAllRows(sqlCommand, values);
    }

    async getAllLegislators() {
        const sqlCommand = `SELECT * FROM legislators`;
        return await this._getAllRows(sqlCommand);
    }

    async getBill(id, sessionId) {
        const sqlCommand = `SELECT * FROM bills WHERE (id = ? AND session_id = ?)`;
        const values = [id, sessionId];
        return await this._getFirstRow(sqlCommand, values);
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

    async getAllVotesOnBill(billId, sessionId) {
        const sqlCommand = `SELECT session_id, bill_id, legislator_id, full_name, vote, house FROM votes JOIN legislators ON votes.legislator_id = legislators.id AND votes.bill_id = ? AND votes.session_id = ?`;
        const values = [billId, sessionId];
        return await this._getAllRows(sqlCommand, values);
    }

    // async getAllHouseVotesOnBill(billId, sessionId) {
    //     const sqlCommand = `SELECT * FROM votes WHERE (billId = ? AND sessionId = ? AND house = ?)`;
    //     const values = [billId, sessionId, "H"];
    //     return await this._getAllRows(sqlCommand, values);
    // }

    // async getAllSenateVotesOnBill(billId, sessionId) {
    //     const sqlCommand = `SELECT * FROM votes WHERE (billId = ? AND sessionId = ? AND house = ?)`;
    //     const values = [billId, sessionId, "S"];
    //     return await this._getAllRows(sqlCommand, values);
    // }

    async getVotesForAllBills(sessionId) {
        const allBillsForSessionId =
            await this.getAllBillsForSession(sessionId);

        const joinCommand = `SELECT * FROM bills JOIN votes ON bills.id = votes.bill_id AND bills.session_id = votes.session_id AND (bills.session_id = ?)`;
        const values = [sessionId];

        return await this._getAllRows(joinCommand, values);
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

    //internal methods
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
                                        id TEXT, 
                                        short_title TEXT, 
                                        general_provisions TEXT, 
                                        highlighted_provisions TEXT, 
                                        year TEXT, 
                                        session_id TEXT, 
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
                                        PRIMARY KEY(id, session_id))`);

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
}

export default Database;

//wait openDatabase('./server/database/voteWatch.db');
//const x = await getAllBillsAndVotesForLegislator('PETERT');
// // await getVotingHistoryForLegislator('PETERT');
// // await getAllBills(2025);
// //await getBill('HB0020', 2025);
// const all = await getAllVotesOnBill('HB0020', 2025)
// const house = await getAllHouseVotesOnBill('HB0020', 2025)
// const senate = await getAllSenateVotesOnBill('HB0020', 2025)
