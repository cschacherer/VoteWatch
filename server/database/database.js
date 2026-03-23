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
    async createNewDatabase(name) {
        try {
            this._dbName = name;
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
            const sqlCommand = `INSERT INTO bills (
                id, shortTitle, generalProvisions, highlightedProvisions, lastAction,
                lastActionDate, year, sessionId, link, subjects, houseVoteUrl, senateVoteUrl
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const values = [
                bill.id,
                bill.shortTitle,
                bill.generalProvisions,
                bill.highlightedProvisions,
                bill.lastAction,
                bill.lastActionDate,
                bill.year,
                bill.sessionId,
                bill.link,
                bill.subjects,
                bill.houseVoteUrl,
                bill.senateVoteUrl,
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
            const sqlCommand = `INSERT INTO legislators (
                id, fullName, formatName, image, house,
                party, district, counties, email, cell,
                serviceStart, link
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
            const insertSql = `INSERT INTO votes (
                billId, legislatorId, legislatorName, vote, year, house
              )  VALUES (?, ?, ?, ?, ?, ?)`;
            const values = [
                vote.billId,
                vote.legislatorId,
                vote.legislatorName,
                vote.vote,
                vote.year,
                vote.house,
            ];

            return await this._execute(insertSql, values);
        } catch (err) {
            console.log(
                `Error adding information to votes table: ${err.stack}. ${Object.values(vote)}`,
            );
        }
    }

    async getAllBills(year = 2025) {
        const sqlCommand = `SELECT * FROM bills WHERE year = ?`;
        const values = [year];
        return await this._getAllRows(sqlCommand, values);
    }

    async getAllLegislators() {
        const sqlCommand = `SELECT * FROM legislators`;
        return await this._getAllRows(sqlCommand);
    }

    async getBill(id, year = 2025) {
        const sqlCommand = `SELECT * FROM bills WHERE (id = ? AND year = ?)`;
        const values = [id, year];
        return await this._getFirstRow(sqlCommand, values);
    }

    async getLegislator(id) {
        const sqlCommand = `SELECT * FROM legislators WHERE id = ?`;
        const values = [id];
        return await this._getFirstRow(sqlCommand, values);
    }

    async getAllVotesOnBill(billId, year) {
        const sqlCommand = `SELECT * FROM votes WHERE (billId = ? AND year = ?)`;
        const values = [billId, year];
        return await this._getAllRows(sqlCommand, values);
    }

    async getAllHouseVotesOnBill(billId, year) {
        const sqlCommand = `SELECT * FROM votes WHERE (billId = ? AND year = ? AND house = ?)`;
        const values = [billId, year, "H"];
        return await this._getAllRows(sqlCommand, values);
    }

    async getAllSenateVotesOnBill(billId, year) {
        const sqlCommand = `SELECT * FROM votes WHERE (billId = ? AND year = ? AND house = ?)`;
        const values = [billId, year, "S"];
        return await this._getAllRows(sqlCommand, values);
    }

    async getVotesForAllBills(year) {
        const allBillsForYear = await this.getAllBills(year);

        const joinCommand = `SELECT * FROM bills JOIN votes ON bills.id = votes.billId AND bills.year = votes.year AND (bills.year = ?)`;
        const values = [year];

        return await this._getAllRows(joinCommand, values);
    }

    async getAllBillsAndVotesForLegislator(legislatorId) {
        const joinCommand = `SELECT 
                                votes.legislatorId,
                                votes.legislatorName,
                                votes.billId, 
                                votes.house,
                                votes.year,
                                votes.vote, 
                                bills.generalProvisions, 
                                bills.highlightedProvisions, 
                                bills.lastAction, 
                                bills.lastActionDate, 
                                bills.sessionId, 
                                bills.shortTitle, 
                                bills.subjects
                            FROM legislators 
                            INNER JOIN votes 
                                ON votes.legislatorId = legislators.id 
                            INNER JOIN bills 
                                ON (bills.id = votes.billId AND bills.year = votes.year)
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
            const createBillsTable = await this
                ._execute(`CREATE TABLE IF NOT EXISTS bills (
                                        id TEXT PRIMARY KEY, 
                                        shortTitle TEXT, 
                                        generalProvisions TEXT, 
                                        highlightedProvisions TEXT, 
                                        lastAction TEXT,
                                        lastActionDate TEXT, 
                                        year TEXT, 
                                        sessionId TEXT, 
                                        subjects TEXT, 
                                        houseVoteUrl TEXT, 
                                        senateVoteURL TEXT,  
                                        link TEXT)`);

            const createLegislatorsTable = await this
                ._execute(`CREATE TABLE IF NOT EXISTS legislators (
                                            id TEXT PRIMARY KEY, 
                                            fullName TEXT NOT NULL, 
                                            formatName TEXT NOT NULL, 
                                            image TEXT, 
                                            house TEXT, 
                                            party TEXT, 
                                            district INTEGER, 
                                            counties TEXT, 
                                            email TEXT, 
                                            cell TEXT, 
                                            serviceStart TEXT, 
                                            link TEXT)`);

            const createVotesTable = await this
                ._execute(`CREATE TABLE IF NOT EXISTS votes (
                                                    voteId TEXT PRIMARY KEY,
                                                    billId TEXT NOT NULL, 
                                                    legislatorId TEXT NOT NULL, 
                                                    legislatorName TEXT NOT NULL,
                                                    vote TEXT NOT NULL,
                                                    year INTEGER,
                                                    house TEXT,
                                                    FOREIGN KEY(billId) REFERENCES bills(id))`);
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
