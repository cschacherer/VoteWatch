import { Router } from "express";
import type { Database } from "../database/database.js";
import { handle, param } from "./handle.js";

// /bills
export const createBillRouter = (db: Database) => {
    const router = Router();

    router.get(
        "/",
        handle("get all bills", "Error fetching all bills:", () =>
            db.getAllBillsWithPolicies(),
        ),
    );

    router.get(
        "/:sessionId",
        handle("get all bills", "Error fetching bills for session id:", (req) =>
            db.getAllBillsWithPoliciesForSession(param(req, "sessionId")),
        ),
    );

    router.get(
        "/:sessionId/:id",
        handle("get bill with id", "Error fetching bill details:", (req) =>
            db.getBillDetailsWithPolicies(
                param(req, "sessionId"),
                param(req, "id"),
            ),
        ),
    );

    router.get(
        "/:sessionId/:id/votes",
        handle(
            "get votes on bill",
            "Error fetching bill votes details:",
            (req) =>
                db.getAllVotesOnBill(param(req, "id"), param(req, "sessionId")),
        ),
    );

    return router;
};
