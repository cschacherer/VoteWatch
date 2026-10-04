import { createPool } from "../database/connection.js";
import { Database } from "../database/database.js";
import { EtlStore } from "./store.js";
import { SESSION_LIST } from "./config.js";
import { STAGES, type StageName, type StageOptions } from "./stages.js";

//the ETL command line - replaces uncommenting await lines in server/database/fillDatabase.js. Stages always
//run in their fixed order (see STAGES), whatever order they're named in.
//
//  npm run etl -- legislators bills passed text votes scores
//  npm run etl -- votes --sessions=2026GS --redo
//  npm run etl -- summaries policies --paid --sessions=2026GS --limit=50
//
//summaries and policies make PAID LLM calls, so they refuse to run without --paid

const USAGE = `
usage: npm run etl -- <stage...> [--sessions=2026GS,2025S2] [--years=2026] [--limit=N] [--redo] [--paid]

stages (run in this order):
${Object.entries(STAGES)
    .map(([name, stage]) => `  ${name.padEnd(12)} ${stage.about}`)
    .join("\n")}

options:
  --sessions=A,B  sessions to fill (default: ${SESSION_LIST.join(",")})
  --years=Y,Z     years to score (default: every year with bills)
  --limit=N       summaries/policies: at most N LLM calls per session
  --redo          text/votes/summaries/policies: redo bills that already have their data
  --paid          allow the paid LLM stages (summaries, policies)
`;

function parseArgs(argv: string[]) {
    const stages: StageName[] = [];
    const flags = new Map<string, string>();
    //VS Code's "Debug ETL" prompt can hand everything over as one string - stage names and flags never
    //contain spaces, so splitting on them is safe
    for (const arg of argv.flatMap((a) => a.split(/\s+/).filter(Boolean))) {
        if (arg.startsWith("--")) {
            const [key, value = "true"] = arg.slice(2).split("=");
            flags.set(key, value);
        } else if (arg in STAGES) {
            stages.push(arg as StageName);
        } else {
            throw new Error(`unknown stage "${arg}"`);
        }
    }
    const list = (key: string) =>
        flags
            .get(key)
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean);

    const options: StageOptions = {
        sessions: list("sessions") ?? SESSION_LIST,
        years: list("years")?.map(Number),
        limit: flags.has("limit") ? Number(flags.get("limit")) : undefined,
        redo: flags.has("redo"),
    };
    return {
        stages,
        options,
        paid: flags.has("paid"),
        help: flags.has("help"),
    };
}

async function main() {
    const { stages, options, paid, help } = parseArgs(process.argv.slice(2));
    if (help || stages.length === 0) {
        console.log(USAGE);
        return;
    }

    const paidStages = stages.filter((name) => STAGES[name].paid);
    if (paidStages.length > 0 && !paid) {
        throw new Error(
            `${paidStages.join(" and ")} make paid LLM calls - add --paid to run them`,
        );
    }

    const pool = await createPool();
    const context = { store: new EtlStore(pool), db: Database.fromPool(pool) };
    try {
        //fixed order, whatever order the stages were named in
        for (const name of Object.keys(STAGES) as StageName[]) {
            if (!stages.includes(name)) continue;
            const started = Date.now();
            console.log(`--- ${name}`);
            await STAGES[name].run(context, options);
            console.log(
                `--- ${name} done in ${((Date.now() - started) / 1000).toFixed(1)}s`,
            );
        }
    } finally {
        await pool.end();
    }
}

main().catch((err) => {
    //error messages never include tokens or the connection string
    console.error("ETL failed:", (err as Error).message);
    process.exitCode = 1;
});
