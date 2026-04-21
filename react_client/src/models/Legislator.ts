export type Legislator = {
    id: string;
    fullName: string;
    formatName: string;
    image: string;
    house: string;
    party: string;
    district: number;
    counties: string;
    email: string;
    phone: string;
    serviceStart: string;
    link: string;
};

export const createLegislator = (raw: any): Legislator => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid legislator payload");
    }

    return {
        id: String(raw.id ?? ""),
        fullName: String(raw.full_name ?? ""),
        formatName: String(raw.format_name ?? ""),
        image: String(raw.image ?? ""),
        house: normalizeHouse(raw.house),
        party: normalizeParty(raw.party),
        district: Number(raw.district ?? 0),
        counties: String(raw.counties ?? ""),
        email: String(raw.email ?? ""),
        phone: String(raw.phone ?? ""),
        serviceStart: String(raw.service_start ?? ""),
        link: String(raw.link ?? ""),
    };
};

const normalizeHouse = (text?: string): string => {
    if (!text) return "";
    if (text.toUpperCase() == "H") {
        return "House";
    } else if (text.toUpperCase() == "S") return "Senate";
    else return "";
};

const normalizeParty = (text?: string): string => {
    if (!text) return "";
    if (text.toUpperCase() == "R") {
        return "Republican";
    } else if (text.toUpperCase() == "D") return "Democrat";
    else if (text.toUpperCase() == "I") return "Independent";
    else return "";
};
