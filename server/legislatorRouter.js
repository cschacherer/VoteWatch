import express from "express";
import Database from "./database/database.js";

const legislatorRouter = express.Router();

const _db = new Database();
await _db.openDatabase();

legislatorRouter.get("/", async (req, res) => {
    //send back the legislator id information        console.log('get all bills');
    try {
        console.log("get all legislators");

        const allLegislators = await _db.getAllLegislators();
        res.json(allLegislators);
    } catch (err) {
        console.error("Error fetching legislator details:", err);
        res.status(500).send("Internal Server Error");
    }
});

legislatorRouter.get("/:id", async (req, res) => {
    //send back the legislator id information
    try {
        console.log("get legislator with id");

        const id = req.params.id;
        const legislatorData = await _db.getLegislator(id);
        res.json(legislatorData);
    } catch (err) {
        console.error("Error fetching legislator details:", err);
        res.status(500).send("Internal Server Error");
    }
});

legislatorRouter.get("/:id/votes", async (req, res) => {
    try {
        console.log("get all votes for legislator");

        const id = req.params.id;
        const allLegislatorVotes =
            await _db.getAllBillsAndVotesForLegislator(id);
        res.json(allLegislatorVotes);
    } catch (err) {
        console.error("Error fetching votes for legislator:", err);
        res.status(500).send("Internal Server Error");
    }
});

legislatorRouter.get("/:chamber/:district", async (req, res) => {
    //send back the legislator id information
    try {
        console.log("get legislator for chamber and district");

        const chamber = req.params.chamber;
        const district = req.params.district;
        const legislatorData = await _db.getLegislatorFromDistrict(
            chamber,
            district,
        );
        res.json(legislatorData);
    } catch (err) {
        console.error("Error fetching legislator details:", err);
        res.status(500).send("Internal Server Error");
    }
});

export { legislatorRouter };
