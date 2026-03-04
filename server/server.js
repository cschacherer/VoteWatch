import express from "express";
import cors from "cors";
import { billRouter } from "./billRouter.js";
import { legislatorRouter } from "./legislatorRouter.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    }),
);

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Enable __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../client")));

app.use("/bills", billRouter);
app.use("/legislators", legislatorRouter);

const PORT = process.env.PORT || "3005";
app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});
