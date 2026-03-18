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
    cell: string;
    serviceStart: string;
    link: string;
};

export const createLegislator = (raw: any): Legislator => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid legislator payload");
    }

    return {
        id: String(raw.id ?? ""),
        fullName: String(raw.fullName ?? ""),
        formatName: String(raw.formatName ?? ""),
        image: String(raw.image ?? ""),
        house: String(raw.house ?? ""),
        party: String(raw.party ?? ""),
        district: Number(raw.district ?? 0),
        counties: String(raw.counties ?? ""),
        email: String(raw.email ?? ""),
        cell: String(raw.cell ?? ""),
        serviceStart: String(raw.serviceStart ?? ""),
        link: String(raw.link ?? ""),
    };
};
