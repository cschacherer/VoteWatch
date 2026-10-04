//rebuilds the Postgres database (the project's final database) from the SQLite one (voteWatch.db).
//SQLite is opened read-only, so voteWatch.db is never changed. Run with: npm run copyToPostgres
//
//needs DATABASE_URL in server/.env, ie DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/votewatch
//- creates that database if it doesn't exist yet (the user needs permission to create databases)
//- everything else happens in ONE transaction, so a failure leaves the previous data untouched:
//    1. loads every SQLite table as-is into a "staging" schema (staging.sql)
//    2. drops and recreates the real tables (schema.sql) - integer identity ids and foreign keys
//    3. fills them from staging (transform.sql), looking up the new ids by the old text keys
//    4. checks row counts and totals against SQLite, and only commits if they all match
//- each run REPLACES everything in Postgres with SQLite's data. The ETL now writes Postgres directly
//  (server_ts: npm run etl), so SQLite is out of date and this would wipe anything the ETL has written
//  since - it refuses to run without --force. Pass --keep-staging to leave the staging schema behind
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env"), quiet: true });

const SQLITE_PATH = path.join(__dirname, "../voteWatch.db");
const STAGING_PATH = path.join(__dirname, "staging.sql");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");
const TRANSFORM_PATH = path.join(__dirname, "transform.sql");
const BATCH_SIZE = 500;
const KEEP_STAGING = process.argv.includes("--keep-staging");

//every SQLite table, loaded as-is into staging
const SQLITE_TABLES = [
    "legislators",
    "bills",
    "votes",
    "policy",
    "policy_topics",
    "policy_score",
    "policy_topic_couples",
    "policy_topic_singles",
    "leg_scores_policy_topic_couples",
];

//the real tables in schema.sql, plus the first copy's table names - all dropped before schema.sql runs
const PUBLIC_TABLES = [
    "legislator_couple_scores",
    "bill_policies",
    "votes",
    "bills",
    "legislators",
    "policy_singles",
    "policy_couples",
    "policy_directions",
    "policy_topics",
    "sessions",
    //the first copy (before identity ids)
    "leg_scores_policy_topic_couples",
    "policy_topic_couples",
    "policy_topic_singles",
    "policy_score",
    "policy",
];

//SQLite doesn't enforce types - these columns need converting to match staging.sql
const toBoolean = (value) => {
    if (value === null || value === undefined || value === "") return null;
    return (
        value === true || value === 1 || String(value).toLowerCase() === "true"
    );
};
const toNumber = (value) =>
    value === null || value === undefined || value === ""
        ? null
        : Number(value);
const CONVERSIONS = {
    bills: { passed: toBoolean },
    policy: { confidence: toNumber },
    policy_score: { score: toNumber },
    leg_scores_policy_topic_couples: { score: toNumber },
};

const sqliteAll = (db, sql, params = []) =>
    new Promise((resolve, reject) =>
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))),
    );

const readSql = (file) => fs.readFileSync(file, "utf8");

//makes sure the target database exists, by connecting to the server's default "postgres" database
async function createDatabaseIfMissing(databaseUrl) {
    const url = new URL(databaseUrl);
    const databaseName = decodeURIComponent(url.pathname.slice(1));
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(databaseName)) {
        throw new Error(
            `Database name "${databaseName}" should be letters, numbers, and underscores`,
        );
    }

    url.pathname = "/postgres";
    const admin = new pg.Client({ connectionString: url.toString() });
    await admin.connect();
    try {
        const { rowCount } = await admin.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [databaseName],
        );
        if (rowCount === 0) {
            await admin.query(`CREATE DATABASE "${databaseName}"`);
            console.log(`Created database ${databaseName}`);
        } else {
            console.log(`Database ${databaseName} already exists`);
        }
    } finally {
        await admin.end();
    }
}

//copies one SQLite table into its staging table (search_path points at staging), in batches
async function copyToStaging(sqlite, client, table) {
    const columns = (
        await sqliteAll(sqlite, `PRAGMA table_info("${table}")`)
    ).map((c) => c.name);
    const rows = await sqliteAll(sqlite, `SELECT * FROM "${table}"`);
    const conversions = CONVERSIONS[table] ?? {};
    const columnList = columns.map((c) => `"${c}"`).join(", ");

    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
        const batch = rows.slice(start, start + BATCH_SIZE);
        const values = [];
        const placeholders = batch.map((row) => {
            const rowPlaceholders = columns.map((column) => {
                const convert = conversions[column];
                values.push(convert ? convert(row[column]) : row[column]);
                return `$${values.length}`;
            });
            return `(${rowPlaceholders.join(", ")})`;
        });
        await client.query(
            `INSERT INTO "${table}" (${columnList}) VALUES ${placeholders.join(", ")}`,
            values,
        );
    }
    console.log(`  ${table}: ${rows.length} rows`);
}

//what the real tables should hold, worked out from SQLite itself, next to what they do hold - covers every
//row count plus totals that would catch a bad id lookup or type conversion
async function verify(sqlite, client) {
    //SQLite rows that belong to a real bill (the 105 old policy rows with no bill don't)
    const POLICY_WITH_BILL = `FROM policy p WHERE EXISTS (SELECT 1 FROM bills b WHERE b.session_id = p.session_id AND b.id = p.bill_id)`;
    const checks = [
        [
            "sessions",
            `SELECT COUNT(DISTINCT session_id) v FROM bills`,
            `SELECT COUNT(*) v FROM sessions`,
        ],
        [
            "policy topics",
            `SELECT COUNT(*) v FROM (SELECT policy_topic FROM policy_topics UNION SELECT policy_topic FROM policy_topic_couples UNION SELECT policy_topic FROM policy_topic_singles UNION SELECT policy_topic FROM policy WHERE bill_id IS NOT NULL)`,
            `SELECT COUNT(*) v FROM policy_topics`,
        ],
        [
            "policy directions",
            `SELECT COUNT(*) v FROM policy_topics`,
            `SELECT COUNT(*) v FROM policy_directions`,
        ],
        [
            "policy couples",
            `SELECT COUNT(*) v FROM policy_topic_couples`,
            `SELECT COUNT(*) v FROM policy_couples`,
        ],
        [
            "policy singles",
            `SELECT COUNT(*) v FROM policy_topic_singles`,
            `SELECT COUNT(*) v FROM policy_singles`,
        ],
        [
            "legislators",
            `SELECT COUNT(*) v FROM legislators`,
            `SELECT COUNT(*) v FROM legislators`,
        ],
        [
            "bills",
            `SELECT COUNT(*) v FROM bills`,
            `SELECT COUNT(*) v FROM bills`,
        ],
        [
            "passed bills",
            `SELECT COUNT(*) v FROM bills WHERE passed = 'true' OR passed = 1`,
            `SELECT COUNT(*) v FROM bills WHERE passed`,
        ],
        [
            "bills with a linked sponsor",
            `SELECT COUNT(*) v FROM bills WHERE bill_sponsor IN (SELECT id FROM legislators)`,
            `SELECT COUNT(*) v FROM bills WHERE sponsor_id IS NOT NULL`,
        ],
        [
            "bills with a linked floor sponsor",
            `SELECT COUNT(*) v FROM bills WHERE floor_sponsor IN (SELECT id FROM legislators)`,
            `SELECT COUNT(*) v FROM bills WHERE floor_sponsor_id IS NOT NULL`,
        ],
        [
            "votes",
            `SELECT COUNT(*) v FROM votes`,
            `SELECT COUNT(*) v FROM votes`,
        ],
        [
            "yes votes",
            `SELECT COUNT(*) v FROM votes WHERE vote = 'yes'`,
            `SELECT COUNT(*) v FROM votes WHERE vote = 'yes'`,
        ],
        [
            "bill policies (rows with a bill)",
            `SELECT COUNT(*) v ${POLICY_WITH_BILL}`,
            `SELECT COUNT(*) v FROM bill_policies`,
        ],
        [
            "bill policies without a known direction",
            `SELECT COUNT(*) v ${POLICY_WITH_BILL} AND p.policy_direction NOT IN (SELECT policy_direction FROM policy_topics)`,
            `SELECT COUNT(*) v FROM bill_policies WHERE direction_id IS NULL`,
        ],
        [
            "sum of policy confidence",
            `SELECT ROUND(SUM(CAST(p.confidence AS REAL)), 4) v ${POLICY_WITH_BILL}`,
            `SELECT ROUND(SUM(confidence), 4) v FROM bill_policies`,
        ],
        [
            "legislator couple scores",
            `SELECT COUNT(*) v FROM leg_scores_policy_topic_couples`,
            `SELECT COUNT(*) v FROM legislator_couple_scores`,
        ],
        [
            "sum of couple scores",
            `SELECT ROUND(SUM(score), 4) v FROM leg_scores_policy_topic_couples`,
            `SELECT ROUND(SUM(score)::numeric, 4) v FROM legislator_couple_scores`,
        ],
    ];

    let allMatch = true;
    for (const [label, sqliteSql, postgresSql] of checks) {
        const [sqliteRow] = await sqliteAll(sqlite, sqliteSql);
        const { rows } = await client.query(postgresSql);
        const expected = Number(sqliteRow.v);
        const actual = Number(rows[0].v);
        const match = Math.abs(expected - actual) < 1e-6;
        allMatch &&= match;
        console.log(
            `  ${match ? "ok  " : "DIFF"} ${label}: sqlite ${expected}, postgres ${actual}`,
        );
    }
    return allMatch;
}

async function main() {
    if (!process.argv.includes("--force")) {
        console.log(
            "This replaces ALL Postgres data with SQLite's (voteWatch.db). The ETL now writes Postgres directly\n" +
                "(cd server_ts && npm run etl), so anything it has written since would be lost.\n" +
                "Only run it to rebuild Postgres from SQLite on purpose: npm run copyToPostgres -- --force",
        );
        process.exitCode = 1;
        return;
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error(
            "DATABASE_URL is not set - add it to server/.env, ie DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/votewatch",
        );
    }

    await createDatabaseIfMissing(databaseUrl);

    const sqlite = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY);
    const client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    const started = Date.now();

    try {
        await client.query("BEGIN");

        //1. staging - a straight copy of SQLite
        await client.query("DROP SCHEMA IF EXISTS staging CASCADE");
        await client.query("CREATE SCHEMA staging");
        await client.query("SET LOCAL search_path TO staging");
        await client.query(readSql(STAGING_PATH));
        console.log("Loading SQLite into staging:");
        for (const table of SQLITE_TABLES) {
            await copyToStaging(sqlite, client, table);
        }

        //2. the real tables, recreated from scratch
        await client.query("SET LOCAL search_path TO public");
        await client.query(
            `DROP TABLE IF EXISTS ${PUBLIC_TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`,
        );
        await client.query(readSql(SCHEMA_PATH));

        //3. filled from staging
        await client.query(readSql(TRANSFORM_PATH));
        console.log(
            "Built the tables with identity ids and foreign keys\nChecking:",
        );

        //4. only commit a rebuild that matches SQLite
        if (!(await verify(sqlite, client))) {
            await client.query("ROLLBACK");
            console.log(
                "Some checks differ (DIFF lines above) - rolled back, the previous data is unchanged.",
            );
            process.exitCode = 1;
            return;
        }

        if (!KEEP_STAGING) await client.query("DROP SCHEMA staging CASCADE");
        await client.query("COMMIT");
        console.log(
            `Everything matches - committed in ${((Date.now() - started) / 1000).toFixed(1)}s.`,
        );
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
    } finally {
        await client.end();
        sqlite.close();
    }
}

main().catch((error) => {
    //never print the connection string - it holds the password
    console.error(
        "Rebuild failed (nothing was changed):",
        error.message,
        error.detail ?? "",
    );
    process.exitCode = 1;
});
