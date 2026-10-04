import { Router } from "express";
import { ALL_YEARS, type Database } from "../database/database.js";
import { NotFound, handle, param, sessionQuery } from "./handle.js";

// /analysis
//the fixed paths (years, outcomes, scores, overview) are registered before /:legislatorId/:year, or
//"years" would be read as a legislator id
export const createAnalysisRouter = (db: Database) => {
    const router = Router();

    router.get(
        "/years",
        handle("get analysis years", "Error fetching analysis years:", () =>
            db.getAnalysisYears(),
        ),
    );

    //the Analysis page's outcome cards for a year (or "all"), or one session with ?session=2025S1
    router.get(
        "/outcomes/:year",
        handle(
            "get legislature policy outcomes",
            "Error fetching policy outcomes:",
            (req) =>
                db.getPolicyOutcomes(param(req, "year"), sessionQuery(req)),
        ),
    );

    router.get(
        "/outcomes/:year/:policyCoupleName",
        handle(
            "get legislature outcome for a policy couple",
            "Error fetching policy couple outcome:",
            async (req) =>
                (await db.getPolicyCoupleOutcome(
                    param(req, "policyCoupleName"),
                    param(req, "year"),
                    sessionQuery(req),
                )) ?? new NotFound("Policy couple not found"),
        ),
    );

    //every legislator's couple scores with their party - for comparing one legislator with the medians
    router.get(
        "/scores/:year",
        handle(
            "get every legislator's policy couple scores",
            "Error fetching legislature couple scores:",
            (req) =>
                db.getLegislatureCoupleScores(
                    param(req, "year"),
                    sessionQuery(req),
                ),
        ),
    );

    router.get(
        "/overview/:year",
        handle(
            "get legislature overview",
            "Error fetching legislature overview:",
            (req) => db.getLegislatureOverview(param(req, "year")),
        ),
    );

    //stored scores for a year when there are any - a session, "all" years, or an unscored year is
    //computed live
    router.get(
        "/:legislatorId/:year",
        handle(
            "get legislator policy couple scores",
            "Error fetching legislator details:",
            async (req) => {
                const legislatorId = param(req, "legislatorId");
                const year = param(req, "year");
                const session = sessionQuery(req);

                if (!session && year !== ALL_YEARS) {
                    const stored =
                        await db.getPolicyCouplesFromLegislatorAndYear(
                            legislatorId,
                            year,
                        );
                    if (stored.length > 0) return stored;
                }
                return db.getLiveCoupleScoresForLegislator(
                    legislatorId,
                    year,
                    session,
                );
            },
        ),
    );

    //registered before /:legislatorId/:year/:policyTopic/:policyDirection, or "couple" would be read as
    //a policy topic
    router.get(
        "/:legislatorId/:year/couple/:policyCoupleName",
        handle(
            "get bills and legislator votes for a policy couple",
            "Error fetching policy couple votes:",
            (req) =>
                db.getAllBillsAndVotesForLegislatorByPolicyCouple(
                    param(req, "legislatorId"),
                    param(req, "policyCoupleName"),
                    param(req, "year"),
                    sessionQuery(req),
                ),
        ),
    );

    router.get(
        "/:legislatorId/:year/:policyTopic/:policyDirection",
        handle(
            "get bills for a certain policy direction and legislator votes",
            "Error fetching legislator details:",
            (req) =>
                db.getAllBillsAndVotesForLegislatorByPolicyDirection(
                    param(req, "legislatorId"),
                    param(req, "policyTopic"),
                    param(req, "policyDirection"),
                    param(req, "year"),
                ),
        ),
    );

    return router;
};
