import express from "express";
import Database from "./database/database.js";

const analysisRouter = express.Router();

const _db = new Database();
await _db.openDatabase();

//these must be registered before /:legislatorId/:year... or "years"/"overview"/"outcomes" is read as a legislator id
analysisRouter.get("/years", async (req, res) => {
    try {
        console.log("get analysis years");

        const years = await _db.getAnalysisYears();
        res.json(years);
    } catch (err) {
        console.error("Error fetching analysis years:", err);
        res.status(500).send("Internal Server Error");
    }
});

analysisRouter.get("/outcomes/:year/:policyCoupleName", async (req, res) => {
    try {
        console.log("get legislature outcome for a policy couple");

        const outcome = await _db.getPolicyCoupleOutcome(
            req.params.policyCoupleName,
            req.params.year,
        );
        if (!outcome) {
            res.status(404).send("Policy couple not found");
            return;
        }
        res.json(outcome);
    } catch (err) {
        console.error("Error fetching policy couple outcome:", err);
        res.status(500).send("Internal Server Error");
    }
});

analysisRouter.get("/overview/:year", async (req, res) => {
    try {
        console.log("get legislature overview");

        const year = req.params.year;
        const overview = await _db.getLegislatureOverview(year);
        res.json(overview);
    } catch (err) {
        console.error("Error fetching legislature overview:", err);
        res.status(500).send("Internal Server Error");
    }
});

analysisRouter.get("/:legislatorId/:year", async (req, res) => {
    //send back the legislator id information
    try {
        console.log("get legislator policy couple scores");

        const legislatorId = req.params.legislatorId;
        const year = req.params.year;
        //optional ?session=2026GS - scores are only stored per year, so a session is computed live
        const session = req.query.session || null;

        if (!session) {
            const storedScores =
                await _db.getPolicyCouplesFromLegislatorAndYear(
                    legislatorId,
                    year,
                );
            if (storedScores.length > 0) {
                res.json(storedScores);
                return;
            }
        }

        //a session, or a year that was never scored
        const liveScores = await _db.getLiveCoupleScoresForLegislator(
            legislatorId,
            year,
            session,
        );
        res.json(liveScores);
    } catch (err) {
        console.error("Error fetching legislator details:", err);
        res.status(500).send("Internal Server Error");
    }
});

//must be registered before /:legislatorId/:year/:policyTopic/:policyDirection or "couple" is read as a policy topic
analysisRouter.get(
    "/:legislatorId/:year/couple/:policyCoupleName",
    async (req, res) => {
        try {
            console.log("get bills and legislator votes for a policy couple");

            const legislatorId = req.params.legislatorId;
            const year = req.params.year;
            const policyCoupleName = req.params.policyCoupleName;
            //optional ?session=2026GS - only that session's bills
            const session = req.query.session || null;

            const legislatorData =
                await _db.getAllBillsAndVotesForLegislatorByPolicyCouple(
                    legislatorId,
                    policyCoupleName,
                    year,
                    session,
                );

            res.json(legislatorData);
        } catch (err) {
            console.error("Error fetching policy couple votes:", err);
            res.status(500).send("Internal Server Error");
        }
    },
);

analysisRouter.get(
    "/:legislatorId/:year/:policyTopic/:policyDirection",
    async (req, res) => {
        //send back the legislator id information
        try {
            console.log(
                "get bills for a certain policy direction and legislator votes",
            );

            const legislatorId = req.params.legislatorId;
            const year = req.params.year;
            const policyTopic = req.params.policyTopic;
            const policyDirection = req.params.policyDirection;

            const legislatorData =
                await _db.getAllBillsAndVotesForLegislatorByPolicyDirection(
                    legislatorId,
                    policyTopic,
                    policyDirection,
                    year,
                );

            res.json(legislatorData);
        } catch (err) {
            console.error("Error fetching legislator details:", err);
            res.status(500).send("Internal Server Error");
        }
    },
);

export { analysisRouter };
