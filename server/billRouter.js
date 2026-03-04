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
        console.error("Error fetching bill details:", error);
        res.status(500).send("Internal Server Error");
    }
});

//next is when you need to handoff to another function.  You don't need it for everything
billRouter.get("/:id", async (req, res) => {
    try {
        //send back the bill id information
        console.log("get bill with id");

        const id = req.params.id;
        console.log(id);
        const billDetails = await _db.getBill(id);
        res.json(billDetails);
    } catch (err) {
        console.error("Error fetching bill details:", error);
        res.status(500).send("Internal Server Error");
    }
});

billRouter.get("/:id/votes", async (req, res) => {
    try {
        //send back the bill id information
        const id = req.params.id;
        const allVotes = await _db.getAllVotesOnBill(id);
        res.json(allVotes);
    } catch (err) {
        console.error("Error fetching bill details:", error);
        res.status(500).send("Internal Server Error");
    }
});

export { billRouter };
