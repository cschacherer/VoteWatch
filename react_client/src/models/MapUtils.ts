export type Address = {
    buildingNumber: string;
    road: string;
    city: string;
    zipCode: string;
    state: string;
    country: string;
    displayStreetName: string;
    displayFull: string;
};

export const createAddress = (raw: any): Address => {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Invalid address payload");
    }

    const buildingNumber = String(raw.building ?? raw.house_humber ?? "");
    const road = String(raw.road ?? "");
    const city = String(raw.city ?? "");
    const zipCode = String(raw.postcode ?? "");
    const state = String(raw.state ?? "");
    const country = String(raw.country ?? "");

    return {
        buildingNumber,
        road,
        city,
        zipCode,
        state,
        country,
        displayStreetName: `${buildingNumber} ${road}`,
        displayFull: `${buildingNumber} ${road}, ${city} ${zipCode}, ${country}`,
    };
};
