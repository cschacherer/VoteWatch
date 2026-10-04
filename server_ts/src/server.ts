import express from "express";
import cors from "cors";
import { Database } from "./database/database.js";
import { createBillRouter } from "./routes/billRouter.js";
import { createLegislatorRouter } from "./routes/legislatorRouter.js";
import { createAnalysisRouter } from "./routes/analysisRouter.js";

//the TypeScript version of server/server.js - the same routes and JSON, but reading the Postgres copy of
//the data (DATABASE_URL in server_ts/.env) instead of the SQLite file
//const PORT = process.env.PORT || "3006";
const PORT = "3005";

//one Postgres connection pool shared by every router (the JavaScript server opens one SQLite connection per router)
const db = await Database.open();

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    }),
);

app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use("/bills", createBillRouter(db));
app.use("/legislators", createLegislatorRouter(db));
app.use("/analysis", createAnalysisRouter(db));

app.listen(PORT, () => {
    console.log(`TypeScript server is listening on ${PORT}`);
});
