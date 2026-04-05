export type Bill = {
    id: string;
    shortTitle: string;
    generalProvisions: string;
    highlightedProvisions: string;
    lastAction: string;
    lastActionDate: string;
    year: number;
    sessionId: string;
    link: string;
    subjects: string[];
    houseVoteUrl: string;
    senateVoteUrl: string;
    passed: string;
};

export const normalizeBillText = (text?: string): string => {
    if (!text) return "";

    return text
        .replace(/<hr>/gi, "\n")
        .replace(/<ltbullet>/gi, "\n - ")
        .replace(/<ltbullet1>/gi, "\n - ")
        .trim();
};

export const createBill = (raw: any): Bill => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid bill payload");
    }

    return {
        id: String(raw.id ?? ""),
        shortTitle: String(raw.shortTitle ?? ""),

        generalProvisions: String(raw.generalProvisions ?? ""),
        highlightedProvisions: normalizeBillText(raw.highlightedProvisions),

        lastAction: String(raw.lastAction ?? ""),
        lastActionDate: String(raw.lastActionDate ?? ""),

        year: Number(raw.year ?? 0),
        sessionId: String(raw.sessionId ?? ""),

        link: String(raw.link ?? ""),
        subjects: raw.subjects?.split(",").map((s: string) => s.trim()),

        houseVoteUrl: String(raw.houseVoteUrl ?? ""),
        senateVoteUrl: String(raw.senateVoteUrl ?? ""),

        passed: String(raw.passed ?? "yes"),
    };
};

export const createBillFromVote = (raw: any): Bill => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid bill payload");
    }

    return {
        id: String(raw.billId ?? ""),
        shortTitle: String(raw.shortTitle ?? ""),

        generalProvisions: String(raw.generalProvisions ?? ""),
        highlightedProvisions: normalizeBillText(raw.highlightedProvisions),

        lastAction: String(raw.lastAction ?? ""),
        lastActionDate: String(raw.lastActionDate ?? ""),

        year: Number(raw.year ?? 0),
        sessionId: String(raw.sessionId ?? ""),

        link: String(raw.link ?? ""),
        subjects: raw.subjects?.split(",").map((s: string) => s.trim()),

        houseVoteUrl: String(raw.houseVoteUrl ?? ""),
        senateVoteUrl: String(raw.senateVoteUrl ?? ""),

        passed: String(raw.passed ?? ""),
    };
};
