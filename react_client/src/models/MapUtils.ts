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

    const buildingNumber = String(
        raw.housenumber ?? raw.house_number ?? raw.building ?? "",
    );

    const road = String(raw.street ?? raw.road ?? raw.name ?? "");

    const city = String(
        raw.city ?? raw.town ?? raw.village ?? raw.municipality ?? "",
    );

    const zipCode = String(raw.postcode ?? "");
    const state = String(raw.state ?? "");
    const country = String(raw.country ?? "");

    const displayStreetName = [buildingNumber, road].filter(Boolean).join(" ");

    const displayFull =
        raw.formatted ??
        [
            displayStreetName,
            [city, state, zipCode].filter(Boolean).join(" "),
            country,
        ]
            .filter(Boolean)
            .join(", ");

    return {
        buildingNumber,
        road,
        city,
        zipCode,
        state,
        country,
        displayStreetName,
        displayFull,
    };
};

//an ArcGIS geocoder suggestion is one line of text: "350 N State St, Salt Lake City, UT, 84114, USA" -
//street, city, state, zip, country. A suggestion without a zip or city still gives the street
export const createAddressFromSuggestion = (text: string): Address => {
    const parts = text.split(",").map((part) => part.trim());
    const zipIndex = parts.findIndex((part) => /^\d{5}(-\d{4})?$/.test(part));
    const zipCode = zipIndex >= 0 ? parts[zipIndex].slice(0, 5) : "";
    const displayStreetName = parts[0] ?? "";
    const [, buildingNumber = "", road = displayStreetName] =
        displayStreetName.match(/^(\d+\S*)\s+(.*)$/) ?? [];

    return {
        buildingNumber,
        road,
        city: parts.length > 2 ? parts[1] : "",
        zipCode,
        state: zipIndex > 0 ? parts[zipIndex - 1] : "",
        country: parts.at(-1) === "USA" ? "USA" : "",
        displayStreetName,
        //"USA" is the same for every suggestion, so it's left off
        displayFull: parts.filter((part) => part !== "USA").join(", "),
    };
};
