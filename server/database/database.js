import fs from 'fs';
import sqlite3 from 'sqlite3'

const sqlite = sqlite3.verbose();

let dbName = './server/database/voteWatch.db';
let db;

const execute = async (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

const run = async (sql, params) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}

const createNewDatabase = async () => {
    try {
        if (fs.existsSync(dbName)) {
            fs.unlinkSync(dbName);
        }
        await openDatabase();
        await createTables();
    } catch (err) {
        console.log(`Error creating new database: ${err.stack}`);
    }
};

const openDatabase = async () => {
    try {
        db = new sqlite.Database(dbName, (err) => {
            if (err) {
                console.log(err.message);
                return;
            }

        });
        await execute('PRAGMA foreign_keys = ON');
    } catch (err) {
        console.log(`Error opening database: ${err.stack}`);
    }
};

const createTables = async () => {
    try {
        const createBillsTable = await execute(`CREATE TABLE IF NOT EXISTS bills (
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

        const createLegislatorsTable = await execute(`CREATE TABLE IF NOT EXISTS legislators (
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

        const createVotesTable = await execute(`CREATE TABLE IF NOT EXISTS votes (
                                            billId TEXT NOT NULL, 
                                            legId TEXT NOT NULL, 
                                            vote TEXT NOT NULL,
                                            FOREIGN KEY(billId) REFERENCES bills(id), 
                                            FOREIGN KEY(legId) REFERENCES legislators(id))`);



    } catch (err) {
        console.log(`Error creating tables: ${err.stack}`);
    }
}

const closeDatabase = () => {
    try {
        db.close();
    }
    catch (err) {
        console.log(`Error closing database. ${err.stack}`);
    }
}

const addToBills = async (bill) => {
    try {
        const insertSql = `INSERT INTO bills (
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

        const result = await run(insertSql, values);
    } catch (err) {
        console.log(`Error adding information to bills table: ${err.stack}`);
    }
};

const addToLegislators = async (legislator) => {
    try {
        const insertSql = `INSERT INTO legislators (
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

        const result = await run(insertSql, values);
    } catch (err) {
        console.log(`Error adding information to legislators table: ${err.stack}`);
    }
};

const addToVotes = async (billId, legId, vote) => {
    try {
        const insertSql = `INSERT INTO votes(billId, legId, vote) VALUES (?, ?, ?)`;
        const result = await execute(insertSql, [billId, legId, vote]);
    } catch (err) {
        console.log(`Error adding information to votes table: ${err.stack}`);
    }
};

export {
    createNewDatabase,
    openDatabase,
    closeDatabase,
    addToBills,
    addToLegislators,
    addToVotes
}; 
