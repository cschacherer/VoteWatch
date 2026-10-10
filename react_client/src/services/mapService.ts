import { getErrorMessage } from "./errorHandling";
import {
    createAddress,
    createAddressFromSuggestion,
    type Address,
} from "../models/MapUtils";

const UGRC_API_KEY = import.meta.env.VITE_UGRC_APIKEY;
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
const ARCGIS_API_KEY = import.meta.env.VITE_ARCGIS_API_KEY;

//address suggestions already looked up this visit, by "street|zip", so going back to text that was
//already typed (ie backspacing) doesn't wait again
const addressSearchCache = new Map<string, Address[]>();

//street address suggestions as the user types. Uses the ArcGIS Location Platform geocoder (about 0.15s)
//when VITE_ARCGIS_API_KEY is set, otherwise Geoapify (2-12s). signal cancels the request when the text
//changes before it answers, so older lookups don't pile up behind the newest one - an aborted lookup
//throws an AbortError for the caller to ignore
export const searchAddresses = async (
    streetName: string,
    zipCode: string,
    signal?: AbortSignal,
): Promise<Address[]> => {
    if (!streetName || streetName.length < 3) return [];

    const cacheKey = `${streetName.trim().toLowerCase()}|${zipCode.trim()}`;
    const cached = addressSearchCache.get(cacheKey);
    if (cached) return cached;

    const addresses = ARCGIS_API_KEY
        ? await searchAddressesArcGis(streetName, zipCode, signal)
        : await searchAddressesGeoapify(streetName, zipCode, signal);
    //failed lookups return null and aren't cached, so typing the same text again retries
    if (!addresses) return [];
    addressSearchCache.set(cacheKey, addresses);
    return addresses;
};

//ArcGIS World Geocoder "suggest": only addresses, only inside Utah, ranked nearest Salt Lake City first
//(most Utahns live on the Wasatch Front - without it, the middle of the state ranks first). Suggest
//requests don't use the key's geocode credits
const searchAddressesArcGis = async (
    streetName: string,
    zipCode: string,
    signal?: AbortSignal,
): Promise<Address[] | null> => {
    const params = new URLSearchParams({
        f: "json",
        text: zipCode ? `${streetName}, ${zipCode}` : streetName,
        category: "Address",
        countryCode: "USA",
        searchExtent: "-114.1,36.9,-109.0,42.1",
        location: "-111.89,40.76",
        maxSuggestions: "5",
        token: ARCGIS_API_KEY ?? "",
    });

    let res: Response;
    try {
        res = await fetch(
            `https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?${params.toString()}`,
            { signal },
        );
    } catch (error) {
        //a cancelled lookup isn't a failure - let the caller see it and ignore it
        if (signal?.aborted) throw error;
        console.error("ArcGIS address search failed", error);
        return null;
    }

    //ArcGIS reports errors (ie a bad or expired key) as a 200 with an error object
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.error) {
        console.error("ArcGIS address search failed", data?.error ?? res.status);
        return null;
    }

    const suggestions: { text?: string; isCollection?: boolean }[] =
        data.suggestions ?? [];
    return suggestions
        .filter((s) => !s.isCollection)
        .map((s) => createAddressFromSuggestion(String(s.text ?? "")));
};

const searchAddressesGeoapify = async (
    streetName: string,
    zipCode: string,
    signal?: AbortSignal,
): Promise<Address[] | null> => {

    // Utah bounding box:
    // Geoapify rect format is: lon1,lat1,lon2,lat2
    const utahRect = "-114.1,36.9,-109.0,42.1";

    const text = zipCode
        ? `${streetName}, ${zipCode}, Utah, USA`
        : `${streetName}, Utah, USA`;

    const params = new URLSearchParams({
        text,
        format: "json",
        limit: "5",
        filter: `rect:${utahRect}|countrycode:us`,
        apiKey: GEOAPIFY_API_KEY ?? "",
    });

    let res: Response;
    try {
        res = await fetch(
            `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`,
            { signal },
        );
    } catch (error) {
        //a cancelled lookup isn't a failure - let the caller see it and ignore it
        if (signal?.aborted) throw error;
        console.error("Geoapify address search failed", error);
        return null;
    }

    if (!res.ok) {
        console.error("Geoapify address search failed", await res.text());
        return null;
    }

    const data = await res.json();
    const addressArray: Address[] = data.results.map((x: any) =>
        createAddress(x),
    );
    return addressArray;

    // //nominatim - don't need an api key
    // //address details - return address as seperate components
    // //viewbox - represents the state of utah to find the addresses in
    // //bounded - 1 means that the address has to be in the viewbox
    // const res = await fetch(
    //     `https://nominatim.openstreetmap.org/search?street=${encodeURIComponent(streetName)}&format=json&addressdetails=1&limit=5&viewbox=-114.1,42.1,-109.0,36.9&bounded=1&countrycodes=us`,
    // );

    // // const res = await fetch(
    // //     `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=us&q=${encodeURIComponent(streetName)}, Utah, USA"`,
    // // );

    // // const res = await fetch(
    // //     `https://nominatim.openstreetmap.org/search?street=${encodeURIComponent(streetName)}&postalCode=${zipCode}&format=json&addressdetails=1&limit=5&viewbox=-114.1,42.1,-109.0,36.9&bounded=1&countrycodes=us`,
    // // );

    // const data = await res.json();

    // const addressArray = data.map((x: any) => createAddress(x.address));

    // return addressArray;
};

//get latitude/longitude coordinates from street address
export const getCoordinatesFromAddress = async (
    street: string,
    zone: string,
) => {
    try {
        const url = `https://api.mapserv.utah.gov/api/v1/geocode/${encodeURIComponent(
            street.trim(),
        )}/${encodeURIComponent(zone.trim())}`;

        // const response = await fetch(
        //     `https://api.mapserv.utah.gov/api/v1/geocode?address=${encodeURIComponent(address)}&apiKey=UGRC-DF17C55D207308`,
        // );

        const response = await fetch(
            `${url}?apikey=${UGRC_API_KEY}&spatialReference=4326`, //spatial reference changes the type of lat/lng you get back
        );

        const json = await response.json();
        const match = json.result;

        if (!match) throw new Error("Address not found");

        return {
            lat: match.location.y,
            lng: match.location.x,
        };
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getDistrictsFromCoordinates = async (lat: number, lng: number) => {
    try {
        const url = `https://services1.arcgis.com/99lidPhWCzftIe9K/ArcGIS/rest/services/political_district_combination_areas_2026/FeatureServer/0/query
?geometry=${encodeURIComponent(`${lng},${lat}`)}
&geometryType=esriGeometryPoint
&inSR=4326
&spatialRel=esriSpatialRelIntersects
&outFields=*
&returnGeometry=true
&f=json`;
        const response = await fetch(url);
        const json = await response.json();

        const attrs = json.features?.[0]?.attributes;

        if (!attrs) throw new Error("No district found");

        return {
            house: attrs.House,
            senate: attrs.Senate,
        };
    } catch (error) {
        let msg = getErrorMessage(error);
        console.log(msg);
        throw new Error(msg);
    }
};

export const getHouseDistrictGeometry = async (districtNumber: number) => {
    const fullUrl =
        `https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahHouseDistricts2022to2032/FeatureServer/0/query?` +
        `where=${encodeURIComponent(`DIST=${districtNumber}`)}` +
        `&outFields=*` +
        `&returnGeometry=true` +
        `&f=geojson`;
    const res = await fetch(fullUrl);
    const json = await res.json();
    return json;
};

export const getSenateDistrictGeometry = async (districtNumber: number) => {
    const fullUrl =
        `https://services1.arcgis.com/99lidPhWCzftIe9K/ArcGIS/rest/services/UtahSenateDistricts2022to2032/FeatureServer/0/query?` +
        `where=${encodeURIComponent(`DIST=${districtNumber}`)}` +
        `&outFields=*` +
        `&returnGeometry=true` +
        `&f=geojson`;

    const res = await fetch(fullUrl);
    const json = await res.json();
    return json;
};

const queryLayer = async (url: string, lat: number, lng: number) => {
    const fullUrl =
        `${url}?` +
        `geometry=${lng},${lat}` +
        `&geometryType=esriGeometryPoint` +
        `&inSR=4326` +
        `&outSR=4326` + // ✅ ADD THIS
        `&spatialRel=esriSpatialRelIntersects` +
        `&outFields=*` +
        `&returnGeometry=true` +
        `&f=json`;

    const res = await fetch(fullUrl);
    const json = await res.json();

    const feature = json.features?.[0];
    if (!feature) throw new Error("No feature found");

    return feature;
};

export const getSeparateDistricts = async (lat: number, lng: number) => {
    const houseFeature = await queryLayer(
        "https://services1.arcgis.com/99lidPhWCzftIe9K/ArcGIS/rest/services/Utah_House_Districts_2022/FeatureServer/0/query?",
        lat,
        lng,
    );

    // const senateFeature = await queryLayer(
    //     "https://services1.arcgis.com/99lidPhWCzftIe9K/ArcGIS/rest/services/political_district_combination_areas_2026/FeatureServer/1/query",
    //     lat,
    //     lng,
    // );

    return {
        house: houseFeature.attributes,
        // senate: senateFeature.attributes,
        houseGeometry: houseFeature.geometry,
        // senateGeometry: senateFeature.geometry,
    };
};
