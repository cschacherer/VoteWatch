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
    passed: boolean;
    datePassed: string;
    effectiveDate: string;
    billSponsor: string;
    floorSponsor: string;
    trackingId: string;
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
        shortTitle: String(raw.short_title ?? ""),

        generalProvisions: String(raw.general_provisions ?? ""),
        highlightedProvisions: normalizeBillText(raw.highlighted_provisions),

        year: Number(raw.year ?? 0),
        sessionId: String(raw.session_id ?? ""),

        passed: Boolean(raw.passed ?? false),
        datePassed: String(raw.date_passed ?? ""),
        effectiveDate: String(raw.effective_date ?? ""),

        lastAction: String(raw.last_action ?? ""),
        lastActionDate: String(raw.lastActionDate ?? ""),

        subjects: raw.subjects?.split(",").map((s: string) => s.trim()),

        billSponsor: String(raw.bill_sponsor ?? ""),
        floorSponsor: String(raw.floor_sponsor ?? ""),
        trackingId: String(raw.tracking_id ?? ""),

        houseVoteUrl: String(raw.house_vote_url ?? ""),
        senateVoteUrl: String(raw.senate_vote_url ?? ""),

        link: String(raw.link ?? ""),
    };
};

export const createBillFromVote = (raw: any): Bill => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid bill payload");
    }

    return {
        id: String(raw.id ?? ""),
        shortTitle: String(raw.short_title ?? ""),

        generalProvisions: String(raw.general_provisions ?? ""),
        highlightedProvisions: normalizeBillText(raw.highlighted_provisions),

        year: Number(raw.year ?? 0),
        sessionId: String(raw.session_id ?? ""),

        passed: Boolean(raw.passed ?? false),
        datePassed: String(raw.date_passed ?? ""),
        effectiveDate: String(raw.effective_date ?? ""),

        lastAction: String(raw.last_action ?? ""),
        lastActionDate: String(raw.lastActionDate ?? ""),

        subjects: raw.subjects?.split(",").map((s: string) => s.trim()),

        billSponsor: String(raw.bill_sponsor ?? ""),
        floorSponsor: String(raw.floor_sponsor ?? ""),
        trackingId: String(raw.tracking_id ?? ""),

        houseVoteUrl: String(raw.house_vote_url ?? ""),
        senateVoteUrl: String(raw.senate_vote_url ?? ""),

        link: String(raw.link ?? ""),
    };
};
