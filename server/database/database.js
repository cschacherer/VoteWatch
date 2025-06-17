import fs from 'fs';
import sqlite3 from 'sqlite3'

const sqlite = sqlite3.verbose();

let dbName;
let db;

const execute = async (sql, params = []) => {
    if (params && params.length !== 0) {
        return new Promise((resolve, reject) => {
            //use db.run if you want to add in parameter values
            db.run(sql, params, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        })
    } else {
        return new Promise((resolve, reject) => {
            //use db.exec if you do not need any parameter values 
            db.exec(sql, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
};

//get MULTIPLE rows 
const getAll = async (sql, params) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            };
        })
    })
}

//get ONE row 
const getFirst = async (sql, params) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            };
        })
    })
}

const createNewDatabase = async (name) => {
    try {
        dbName = name;
        if (fs.existsSync(dbName)) {
            fs.unlinkSync(dbName);
        }
        await openDatabase(dbName);
        await createTables();
    } catch (err) {
        console.log(`Error creating new database: ${err.stack}`);
    }
};

const openDatabase = async (name) => {
    try {
        dbName = name;
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
                                                legislatorId TEXT NOT NULL, 
                                                legislatorName TEXT NOT NULL,
                                                vote TEXT NOT NULL,
                                                year INTEGER,
                                                house TEXT,
                                                FOREIGN KEY(billId) REFERENCES bills(id), 
                                                PRIMARY KEY (billId, legislatorId, legislatorName))`);



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

        const result = await execute(sqlCommand, values);
    } catch (err) {
        console.log(`Error adding information to bills table: ${err.stack}`);
    }
};

const addToLegislators = async (legislator) => {
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

        const result = await execute(sqlCommand, values);
    } catch (err) {
        console.log(`Error adding information to legislators table: ${err.stack}`);
    }
};

const addToVotes = async (vote) => {
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

        const result = await execute(insertSql, values);
    } catch (err) {
        console.log(`Error adding information to votes table: ${err.stack}. ${Object.values(vote)}`);
    }
};

const getVotingHistoryForLegislator = async (legislatorId) => {
    const sqlCommand = `SELECT * FROM votes WHERE legislatorId = ?`;
    const values = [
        legislatorId,
    ]
    const result = await getAll(sqlCommand, values);
    console.log(result);
}

const getAllBills = async (year) => {
    const sqlCommand = `SELECT * FROM bills WHERE year = ?`;
    const values = [
        year,
    ]
    const result = await getAll(sqlCommand, values);
    console.log(result);
}

const getBill = async (id, year) => {
    const sqlCommand = `SELECT * FROM bills WHERE (id = ? AND year = ?)`;
    const values = [
        id,
        year,
    ]
    const result = await getAll(sqlCommand, values);
    console.log(result);
}

const getAllVotesOnBill = async (billId, year) => {
    const sqlCommand = `SELECT * FROM votes WHERE (billId = ? AND year = ?)`;
    const values = [
        billId,
        year,
    ]
    const result = await getAll(sqlCommand, values);
    console.log(result);
}

const getAllHouseVotesOnBill = async (billId, year) => {
    const sqlCommand = `SELECT * FROM votes WHERE (billId = ? AND year = ? AND house = ?)`;
    const values = [
        billId,
        year,
        'H',
    ]
    const result = await getAll(sqlCommand, values);
    console.log(result);
}

const getAllSenateVotesOnBill = async (billId, year) => {
    const sqlCommand = `SELECT * FROM votes WHERE (billId = ? AND year = ? AND house = ?)`;
    const values = [
        billId,
        year,
        'S',
    ]
    const result = await getAll(sqlCommand, values);
    console.log(result);
}

export {
    createNewDatabase,
    openDatabase,
    closeDatabase,
    addToBills,
    addToLegislators,
    addToVotes
};

// await openDatabase('./server/database/voteWatch.db');
// // await getVotingHistoryForLegislator('PETERT');
// // await getAllBills(2025);
// //await getBill('HB0020', 2025);
// const all = await getAllVotesOnBill('HB0020', 2025)
// const house = await getAllHouseVotesOnBill('HB0020', 2025)
// const senate = await getAllSenateVotesOnBill('HB0020', 2025)