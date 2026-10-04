import type { Request, RequestHandler } from "express";

//return this from a handler to send a 404 with a message instead of JSON
export class NotFound {
    constructor(readonly message: string) {}
}

//wraps a route the way every route in the JavaScript server is written: log a label, send the handler's
//result as JSON, and on an error log it and send a plain 500
export const handle =
    (
        label: string,
        errorLabel: string,
        handler: (req: Request) => Promise<unknown>,
    ): RequestHandler =>
    async (req, res) => {
        try {
            console.log(label);
            const result = await handler(req);
            if (result instanceof NotFound) {
                res.status(404).send(result.message);
                return;
            }
            res.json(result);
        } catch (err) {
            console.error(errorLabel, err);
            res.status(500).send("Internal Server Error");
        }
    };

//a route parameter Express guarantees by the path (ie :year), typed as a string
export const param = (req: Request, name: string): string =>
    String(req.params[name]);

//the optional ?session=2026GS query - null when it's missing or empty
export const sessionQuery = (req: Request): string | null =>
    typeof req.query.session === "string" && req.query.session
        ? req.query.session
        : null;
