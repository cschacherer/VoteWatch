import { Database } from "../database/database.js";
import { createPolicyTopics } from "../taxonomy/policyTopics.js";
import type { EtlStore, StoredBill } from "./store.js";
import * as govApi from "./govApi.js";
import { baseBillNumber, parseBill, parseLegislator } from "./parse.js";
import { billTextPathYear, getBillText } from "./billText.js";
import { scrapeBillVotes } from "./votes.js";
import { getBillSummary } from "./ai/summaries.js";
import { getPolicyClassification } from "./ai/policies.js";
import type { AiBill } from "./ai/client.js";

//the ETL stages, in the order they run. Each one reads what earlier stages stored and is safe to re-run.
//The stages that scrape or call the LLM skip bills that already have their data unless --redo is passed

export type StageOptions = {
    sessions: string[];
    //scores: the years to score (default: every year with bills)
    years?: number[];
    //summaries/policies: stop after this many LLM calls per session
    limit?: number;
    //text/votes/summaries/policies: redo bills that already have their data
    redo: boolean;
};

export type StageContext = { store: EtlStore; db: Database };

//runs fn over items a few at a time - the Legislature's sites don't like hundreds of requests at once
async function inBatches<T>(
    items: T[],
    size: number,
    fn: (item: T) => Promise<void>,
) {
    for (let start = 0; start < items.length; start += size) {
        await Promise.all(items.slice(start, start + size).map(fn));
    }
}

const toAiBill = (bill: StoredBill): AiBill => ({
    bill_number: bill.bill_number,
    year: bill.year,
    session_code: bill.session_code,
    short_title: bill.short_title,
    full_text: bill.full_text,
    subjects: bill.subjects,
    summary_text: bill.summary_text,
});

//the policy_* tables from taxonomy/policyTopics.ts (replaces createPolicyScore.js's generatePolicyTopicTable)
async function taxonomy({ store }: StageContext) {
    const topics = createPolicyTopics();
    await store.seedTaxonomy(topics);
    console.log(
        `taxonomy: ${topics.length} topics, ${topics.flatMap((t) => t.policyDirections).length} directions, ${topics.flatMap((t) => t.policyCouples).length} couples`,
    );
}

//every current legislator from the Legislature API
async function legislators({ store }: StageContext) {
    const raw = await govApi.getAllLegislators();
    let stored = 0;
    for (const record of raw) {
        const legislator = parseLegislator(record);
        if (!legislator) continue;
        await store.upsertLegislator(legislator);
        stored++;
    }
    console.log(`legislators: ${stored} of ${raw.length} stored`);
}

//every bill's details from the Legislature API (titles, provisions, sponsors, subjects, vote page links)
async function bills({ store }: StageContext, options: StageOptions) {
    for (const session of options.sessions) {
        const list = await govApi.getBillList(session);
        let stored = 0;
        await inBatches(list, 10, async (item) => {
            const number = item.number ? String(item.number) : null;
            if (!number) return;
            const raw = await govApi.getBill(session, number);
            const bill = raw && parseBill(raw, session);
            if (!bill) return;
            await store.upsertBill(bill);
            stored++;
        });
        console.log(`bills ${session}: ${stored} of ${list.length} stored`);
    }
}

//which bills passed, with their passed and effective dates
async function passed({ store }: StageContext, options: StageOptions) {
    for (const session of options.sessions) {
        const passedBills = await govApi.getPassedBills(session);
        let marked = 0;
        for (const item of passedBills) {
            //the passed list names the version that passed (HB0005S01) - the bill is HB0005
            const number = baseBillNumber(String(item.number ?? ""));
            const found = await store.markPassed(
                session,
                number,
                item.datepassed ? String(item.datepassed) : null,
                item.effectivedate ? String(item.effectivedate) : null,
            );
            if (found) marked++;
            else console.log(`passed ${session}: no bill ${item.number}`);
        }
        console.log(
            `passed ${session}: ${marked} of ${passedBills.length} marked`,
        );
    }
}

//each bill's PDF link and full text, scraped from le.utah.gov (the summaries are made from the full text)
async function text({ store }: StageContext, options: StageOptions) {
    for (const session of options.sessions) {
        const todo = (await store.billsForSession(session)).filter(
            (bill) => options.redo || !bill.full_text,
        );
        let stored = 0;
        await inBatches(todo, 5, async (bill) => {
            const result = await getBillText(
                billTextPathYear(bill.session_code),
                bill.bill_number,
            );
            if (!result) return;
            await store.setFullText(bill.id, result.fullText, result.pdfUrl);
            stored++;
        });
        console.log(`text ${session}: ${stored} of ${todo.length} scraped`);
    }
}

//each bill's House and Senate 3rd-reading roll calls, scraped from le.utah.gov
async function votes({ store }: StageContext, options: StageOptions) {
    const lookup = (chamber: string, district: string) =>
        store.legislatorCodeForDistrict(chamber, district);

    for (const session of options.sessions) {
        const todo = (await store.billsForSession(session)).filter(
            (bill) =>
                (bill.house_vote_url || bill.senate_vote_url) &&
                (options.redo || bill.vote_count === 0),
        );
        const totals = {
            bills: 0,
            stored: 0,
            notInLegislators: 0,
            unresolved: 0,
        };
        for (const bill of todo) {
            for (const url of [bill.house_vote_url, bill.senate_vote_url]) {
                if (!url) continue;
                const scraped = await scrapeBillVotes(url, lookup);
                if (!scraped) continue;
                const { stored, skipped } = await store.upsertVotes(
                    bill.id,
                    scraped.votes,
                );
                totals.stored += stored;
                totals.notInLegislators += skipped;
                totals.unresolved += scraped.unresolved;
            }
            totals.bills++;
        }
        console.log(
            `votes ${session}: ${totals.stored} votes on ${totals.bills} bills (skipped ${totals.notInLegislators} by legislators not in the table, ${totals.unresolved} with no legislator link)`,
        );
    }
}

//PAID - a plain-English summary of each bill's full text
async function summaries({ store }: StageContext, options: StageOptions) {
    for (const session of options.sessions) {
        const todo = (await store.billsForSession(session))
            .filter(
                (bill) =>
                    bill.full_text && (options.redo || !bill.summary_text),
            )
            .slice(0, options.limit);
        let stored = 0;
        for (const bill of todo) {
            const summary = await getBillSummary(toAiBill(bill));
            if (!summary) continue;
            await store.setSummary(bill.id, summary);
            stored++;
            console.log(`summary ${bill.session_code} ${bill.bill_number}`);
        }
        console.log(
            `summaries ${session}: ${stored} of ${todo.length} written`,
        );
    }
}

//PAID - each bill's policy topics and directions, classified from its summary
async function policies({ store }: StageContext, options: StageOptions) {
    for (const session of options.sessions) {
        const todo = (await store.billsForSession(session))
            .filter(
                (bill) =>
                    bill.summary_text && (options.redo || !bill.measure_type),
            )
            .slice(0, options.limit);
        let classified = 0;
        for (const bill of todo) {
            const classification = await getPolicyClassification(
                toAiBill(bill),
            );
            if (!classification) continue;
            const added = await store.replaceBillPolicies(
                bill.id,
                classification,
            );
            classified++;
            console.log(
                `policies ${bill.session_code} ${bill.bill_number}: ${added}`,
            );
        }
        console.log(
            `policies ${session}: ${classified} of ${todo.length} classified`,
        );
    }
}

//every legislator's couple scores per year - the same live scoring the API uses, stored so years with
//stored scores load fast (replaces createPolicyScore.js, which only scored 2026)
async function scores({ store, db }: StageContext, options: StageOptions) {
    const years = options.years ?? (await store.yearsWithBills());
    const codes = await store.legislatorCodes();
    for (const year of years) {
        let stored = 0;
        for (const code of codes) {
            const rows = await db.getLiveCoupleScoresForLegislator(
                code,
                String(year),
            );
            stored += await store.upsertCoupleScores(year, rows);
        }
        console.log(
            `scores ${year}: ${stored} couple scores for ${codes.length} legislators`,
        );
    }
}

export const STAGES = {
    taxonomy: {
        run: taxonomy,
        paid: false,
        about: "seed the policy_* tables from the taxonomy",
    },
    legislators: {
        run: legislators,
        paid: false,
        about: "current legislators (Legislature API)",
    },
    bills: { run: bills, paid: false, about: "bill details (Legislature API)" },
    passed: {
        run: passed,
        paid: false,
        about: "which bills passed (Legislature API)",
    },
    text: {
        run: text,
        paid: false,
        about: "PDF links and full text (scrapes le.utah.gov)",
    },
    votes: {
        run: votes,
        paid: false,
        about: "roll-call votes (scrapes le.utah.gov)",
    },
    summaries: {
        run: summaries,
        paid: true,
        about: "AI summaries of the full text (PAID LLM calls)",
    },
    policies: {
        run: policies,
        paid: true,
        about: "AI policy classification (PAID LLM calls)",
    },
    scores: {
        run: scores,
        paid: false,
        about: "legislator couple scores (local, from Postgres)",
    },
} satisfies Record<
    string,
    {
        run: (context: StageContext, options: StageOptions) => Promise<void>;
        paid: boolean;
        about: string;
    }
>;

export type StageName = keyof typeof STAGES;
