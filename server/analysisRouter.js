import express from "express";
import Database from "./database/database.js";

const analysisRouter = express.Router();

const _db = new Database();
await _db.openDatabase();

analysisRouter.get("/:legislatorId/:year", async (req, res) => {
    //send back the legislator id information
    try {
        console.log("get legislator sponsored bills");

        const legislatorId = req.params.legislatorId;
        const year = req.params.year;
        const legislatorData = await _db.getPolicyAnalysisForLegislatorByYear(
            legislatorId,
            year,
        );
        res.json(legislatorData);
    } catch (err) {
        console.error("Error fetching legislator details:", err);
        res.status(500).send("Internal Server Error");
    }
});

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
