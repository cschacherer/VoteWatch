export type Bill = {
    id: string;
    shortTitle: string;
    generalProvisions: string;
    highlightedProvisions: string;
    moneyAppropriated: string;
    fullText: string;
    pdfLink: string;
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
    summary: BillSummary;
    billPolicies: BillPolicy[];
};

export type BillSummary = {
    oneSentence: string;
    overview: string;
    keyChanges: string[];
    groupsAffected: string[];
    money: string;
    effectiveDate: string;
    unclearItems: string;
};

export type BillPolicy = {
    sessionId: string;
    billId: string;
    policyTopic: string;
    policyTopicStrength: string;
    policyDirection: string;
    impactLevel: string;
    confidence: number;
    neutralSummary: string;
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
        moneyAppropriated: String(raw.money_appropriated ?? ""),
        fullText: String(raw.full_text ?? ""),
        pdfLink: String(raw.pdf_link ?? ""),

        summary: createBillSummary(raw.summary_text) ?? null,

        year: Number(raw.year ?? 0),
        sessionId: String(raw.session_id ?? ""),

        passed: Boolean(raw.passed ?? false),
        datePassed: String(raw.date_passed ?? ""),
        effectiveDate: String(raw.effective_date ?? ""),

        lastAction: String(raw.last_action ?? ""),
        lastActionDate: String(raw.last_action_date ?? ""),

        subjects: raw.subjects?.split(",").map((s: string) => s.trim()),

        billSponsor: String(raw.bill_sponsor ?? ""),
        floorSponsor: String(raw.floor_sponsor ?? ""),
        trackingId: String(raw.tracking_id ?? ""),

        houseVoteUrl: String(raw.house_vote_url ?? ""),
        senateVoteUrl: String(raw.senate_vote_url ?? ""),

        link: String(raw.link ?? ""),

        billPolicies: raw.bill_policies ? createAllBillPolicies(raw) : [],
    };
};

export const createBillFromVote = (raw: any): Bill => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid bill payload");
    }

    return {
        id: String(raw.bill_id ?? raw.id ?? ""),
        shortTitle: String(raw.short_title ?? ""),

        generalProvisions: String(raw.general_provisions ?? ""),
        highlightedProvisions: normalizeBillText(raw.highlighted_provisions),
        moneyAppropriated: String(raw.money_appropriations ?? ""),
        fullText: String(raw.full_text ?? ""),
        pdfLink: String(raw.pdf_link ?? ""),
        summary: createBillSummary(raw.summary_text) ?? null,

        year: Number(raw.year ?? 0),
        sessionId: String(raw.session_id ?? ""),

        passed: Boolean(raw.passed ?? false),
        datePassed: String(raw.date_passed ?? ""),
        effectiveDate: String(raw.effective_date ?? ""),

        lastAction: String(raw.last_action ?? ""),
        lastActionDate: String(raw.last_action_date ?? ""),

        subjects: raw.subjects?.split(",").map((s: string) => s.trim()),

        billSponsor: String(raw.bill_sponsor ?? ""),
        floorSponsor: String(raw.floor_sponsor ?? ""),
        trackingId: String(raw.tracking_id ?? ""),

        houseVoteUrl: String(raw.house_vote_url ?? ""),
        senateVoteUrl: String(raw.senate_vote_url ?? ""),

        link: String(raw.link ?? ""),
        billPolicies: raw.bill_policies ? createAllBillPolicies(raw) : [],
    };
};

export const normalizeSessionId = (sessionId: string): String => {
    sessionId = sessionId.toUpperCase();
    if (sessionId.includes("GS")) {
        return sessionId.replace("GS", " General Session");
    } else if (sessionId.includes("S1")) {
        return sessionId.replace("S1", " Special Session 1");
    } else if (sessionId.includes("S2")) {
        return sessionId.replace("S2", " Special Session 2");
    } else if (sessionId.includes("S3")) {
        return sessionId.replace("S3", " Special Session 3");
    } else if (sessionId.includes("S4")) {
        return sessionId.replace("S4", " Special Session 4");
    }
    return sessionId;
};

export const createBillSummary = (raw: any): BillSummary => {
    try {
        const summaryJson = JSON.parse(raw);

        let groupsArray = [];
        if (Array.isArray(summaryJson.who_is_affected)) {
            groupsArray = summaryJson.who_is_affected;
        } else {
            groupsArray = [String(summaryJson.who_is_affected)];
        }
        return {
            oneSentence: String(summaryJson.one_sentence_summary ?? ""),
            overview: String(summaryJson.plain_english_overview ?? ""),
            keyChanges: summaryJson.key_changes ?? [],
            groupsAffected: groupsArray,
            money: String(summaryJson.money_or_funding_impact ?? ""),
            effectiveDate: String(summaryJson.effective_date ?? ""),
            unclearItems: String(summaryJson.unclear_items ?? ""),
        };
    } catch (e) {
        return {
            oneSentence: "",
            overview: "",
            keyChanges: [],
            groupsAffected: [],
            money: "",
            effectiveDate: "",
            unclearItems: "",
        };
    }
};

export const createBillPolicy = (raw: any): BillPolicy => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid policy topic payload");
    }

    return {
        sessionId: raw.session_id,
        billId: raw.bill_id,
        policyTopic: raw.policy_topic,
        policyTopicStrength: String(raw.policy_topic_strength ?? ""),
        policyDirection: String(raw.policy_direction ?? ""),
        impactLevel: String(raw.impact_level ?? ""),
        confidence: Number(raw.confidence ?? null),
        neutralSummary: String(raw.nuetral_summary ?? ""),
    };
};

export const createAllBillPolicies = (raw: any): BillPolicy[] => {
    if (!Array.isArray(raw.bill_policies) || raw === null) {
        throw new Error("Invalid policy topic payload");
    }

    let policyList = [];
    for (const policy of raw.bill_policies) {
        const p = createBillPolicy(policy);
        policyList.push(p);
    }

    return policyList;
};
