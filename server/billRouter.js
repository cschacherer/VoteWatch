import express from "express";
import Database from "./database/database.js";

const billRouter = express.Router();

const _db = new Database();
await _db.openDatabase();

billRouter.get("/", async (req, res) => {
    try {
        console.log("get all bills");

        //send back the bill id information
        const allBills = await _db.getAllBills();
        res.json(allBills);
    } catch (err) {
        console.error("Error fetching bill details:", err);
        res.status(500).send("Internal Server Error");
    }
});

billRouter.get("/:sessionId", async (req, res) => {
    try {
        console.log("get all bills");

        //send back the bill id information
        const allBills = await _db.getAllBillsForSession();
        res.json(allBills);
    } catch (err) {
        console.error("Error fetching bill details:", err);
        res.status(500).send("Internal Server Error");
    }
});

//next is when you need to handoff to another function.  You don't need it for everything
billRouter.get("/:sessionId/:id", async (req, res) => {
    try {
        //send back the bill id information
        console.log("get bill with id");

        const sessionId = req.params.sessionId;
        const id = req.params.id;
        console.log(id);
        const billDetails = await _db.getBill(id, sessionId);
        const policies = await _db.getBillPolicies(sessionId, id);
        billDetails["bill_policies"] = policies;
        res.json(billDetails);
    } catch (err) {
        console.error("Error fetching bill details:", err);
        res.status(500).send("Internal Server Error");
    }
});

billRouter.get("/:sessionId/:id/votes", async (req, res) => {
    try {
        //send back the bill id information
        const sessionId = req.params.sessionId;
        const id = req.params.id;
        const allVotes = await _db.getAllVotesOnBill(id, sessionId);
        res.json(allVotes);
    } catch (err) {
        console.error("Error fetching bill details:", err);
        res.status(500).send("Internal Server Error");
    }
});

export { billRouter };
