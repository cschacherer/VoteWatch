import pg from "pg";
import { requireEnv } from "../env.js";

//COUNT and SUM return bigint, which pg hands back as a string by default - every count here fits in a
//JavaScript number, so parse them (OID 20 = int8)
pg.types.setTypeParser(20, (value) => Number(value));

//a connection pool to the Postgres database in DATABASE_URL, ie postgres://USER:PASSWORD@localhost:5432/votewatch.
//Connects once up front, so a wrong DATABASE_URL fails right away instead of on the first query
export async function createPool(): Promise<pg.Pool> {
    const pool = new pg.Pool({ connectionString: requireEnv("DATABASE_URL") });
    await pool.query("SELECT 1");
    return pool;
}
