import { Router } from "express";
import type { Database } from "../database/database.js";
import { handle, param } from "./handle.js";

// /legislators
//not ported from the JavaScript server: "analysis/:legislatorId/..." (no leading "/", so it never matched -
///analysis has the working version) and "/:legislatorId/:year/analysis" (the older policy_score table,
//which isn't carried into the Postgres schema, and the React app never called it)
export const createLegislatorRouter = (db: Database) => {
    const router = Router();

    router.get(
        "/",
        handle(
            "get all legislators",
            "Error fetching legislator details:",
            () => db.getAllLegislators(),
        ),
    );

    router.get(
        "/:id",
        handle(
            "get legislator with id",
            "Error fetching legislator details:",
            (req) => db.getLegislator(param(req, "id")),
        ),
    );

    router.get(
        "/:id/votes",
        handle(
            "get all votes for legislator",
            "Error fetching votes for legislator:",
            (req) => db.getAllBillsAndVotesForLegislator(param(req, "id")),
        ),
    );

    //registered before /:chamber/:district, or "sponsored" would be read as a district
    router.get(
        "/:legislatorId/sponsored",
        handle(
            "get legislator sponsored bills",
            "Error fetching legislator details:",
            (req) => db.getLegislatorSponsoredBills(param(req, "legislatorId")),
        ),
    );

    //chamber is "H" or "S"
    router.get(
        "/:chamber/:district",
        handle(
            "get legislator for chamber and district",
            "Error fetching legislator details:",
            (req) =>
                db.getLegislatorFromDistrict(
                    param(req, "chamber"),
                    param(req, "district"),
                ),
        ),
    );

    return router;
};
