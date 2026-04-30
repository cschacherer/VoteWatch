import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useState, useEffect } from "react";
import {
    searchAddresses,
    getCoordinatesFromAddress,
    getDistrictsFromCoordinates,
    getSeparateDistricts,
    getHouseDistrictGeometry,
    getSenateDistrictGeometry,
} from "../../services/mapService";
import { getLegislatorByDistrict } from "../../services/legislatorService.ts";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { type Address } from "../../models/MapUtils.ts";
import { Polygon } from "react-leaflet";
import { useMap, GeoJSON } from "react-leaflet";
import { type Legislator } from "../../models/Legislator.ts";

import style from "./DistrictFinder.module.css";
import PropertyGroup from "../PropertyGroup/PropertyGroup.tsx";
import L from "leaflet";

function FitBounds({ geojson }: { geojson: any }) {
    const map = useMap();

    useEffect(() => {
        try {
            if (!geojson) return;

            const layer = L.geoJSON(geojson);
            const bounds = layer.getBounds();

            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [20, 20] });
            }
        } catch (e) {
            console.log(e);
        }
    }, [geojson, map]);

    return null;
}

const DistrictFinder = () => {
    const [streetName, setStreetName] = useState<string>("");
    const [selectedStreetName, setSelectedStreetName] = useState(""); //need to handle the user clicking a suggested street name
    const [zipCode, setZipCode] = useState<string>("");

    const [suggestions, setSuggestions] = useState<Address[]>([]);
    const [coords, setCoords] = useState<LatLngTuple | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [houseDistrictPolygon, setHouseDistrictPolygon] = useState<any>(null);
    const [senateDistrictPolygon, setSenateDistrictPolygon] =
        useState<any>(null);
    const [houseLegislator, setHouseLegislator] = useState<Legislator>();
    const [senateLegislator, setSenateLegislator] = useState<Legislator>();

    const UTAH_CENTER: [number, number] = [39.32, -111.09];

    // // 🔍 AUTOCOMPLETE EFFECT (debounced)
    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (streetName === selectedStreetName) {
                setSuggestions([]);
                return;
            }

            const results = await searchAddresses(streetName, zipCode);

            setSuggestions(results);
        }, 200);

        return () => clearTimeout(timeout);
    }, [streetName]);

    const handleSearch = async () => {
        setLoading(true);
        setError("");
        setSuggestions([]);

        try {
            const { lat, lng } = await getCoordinatesFromAddress(
                streetName.trim(),
                zipCode.trim(),
            );
            setCoords([lat, lng]);

            const districtResults = await getDistrictsFromCoordinates(lat, lng);
            const houseLeg = await getLegislatorByDistrict(
                "H",
                districtResults.house,
            );
            setHouseLegislator(houseLeg);
            const senateLeg = await getLegislatorByDistrict(
                "S",
                districtResults.senate,
            );
            setSenateLegislator(senateLeg);

            let houseGeometry = await getHouseDistrictGeometry(
                districtResults.house,
            );
            setHouseDistrictPolygon(houseGeometry);
            let senateGeometry = await getSenateDistrictGeometry(
                districtResults.senate,
            );
            setSenateDistrictPolygon(senateGeometry);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="outline section verticalStack">
            <div className="filledHeader">Find Your Utah Representatives</div>

            <div className="defaultPadding">
                {/* Map */}
                <div className="horizontalRow defaultGap">
                    {/* Need style because of cascading */}
                    <div style={{ height: 600, width: "60%" }}>
                        <MapContainer
                            center={coords ?? UTAH_CENTER}
                            zoom={6}
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                attribution="&copy; OpenStreetMap"
                                subdomains="abcd"
                            />

                            {coords && <Marker position={coords} />}

                            {houseDistrictPolygon && (
                                <>
                                    <GeoJSON
                                        key={JSON.stringify(
                                            houseDistrictPolygon,
                                        )}
                                        data={houseDistrictPolygon}
                                        style={{
                                            color: "var(--color-house)",
                                            weight: 2,
                                            fillOpacity: 0.2,
                                        }}
                                        onEachFeature={(feature, layer) => {
                                            const district: number =
                                                feature.properties?.DIST;

                                            if (district) {
                                                layer.bindTooltip(
                                                    `House District ${district}`,
                                                    {
                                                        permanent: true, // always visible
                                                        direction: "center",
                                                    },
                                                );
                                            }
                                        }}
                                    />
                                    <FitBounds geojson={houseDistrictPolygon} />
                                </>
                            )}
                            {senateDistrictPolygon && (
                                <>
                                    <GeoJSON
                                        key={JSON.stringify(
                                            senateDistrictPolygon,
                                        )}
                                        data={senateDistrictPolygon}
                                        style={{
                                            color: "var(--color-senate)",
                                            weight: 2,
                                            fillOpacity: 0.2,
                                        }}
                                        onEachFeature={(feature, layer) => {
                                            const district: number =
                                                feature.properties?.DIST;

                                            if (district) {
                                                layer.bindTooltip(
                                                    `Senate District ${district}`,
                                                    {
                                                        permanent: true, // always visible
                                                        direction: "center",
                                                    },
                                                );
                                            }
                                        }}
                                    />
                                    <FitBounds
                                        geojson={senateDistrictPolygon}
                                    />
                                </>
                            )}
                        </MapContainer>
                    </div>
                    <div className="verticalStack defaultGap mapLegislatislatorsContainer defaultPadding">
                        {/* Address input + autocomplete */}
                        <div className="section outlineThin verticalStack defaultGap defaultPadding">
                            <label className="subHeader bold">Address</label>
                            <div>
                                <label className="bold">Street Name:</label>
                                <input
                                    className="width100"
                                    value={streetName}
                                    onChange={(e) => {
                                        setStreetName(e.target.value);
                                        setSelectedStreetName("");
                                    }}
                                    onBlur={() => {
                                        setTimeout(
                                            () => setSuggestions([]),
                                            150,
                                        );
                                    }}
                                />
                                {suggestions.length > 0 && (
                                    <ul
                                        style={{
                                            position: "absolute",
                                            top: "100%",
                                            width: "100%",
                                            background: "white",
                                            border: "1px solid #ccc",
                                            listStyle: "none",
                                            margin: 0,
                                            padding: 0,
                                            zIndex: 1000,
                                            maxHeight: 200,
                                            overflowY: "auto",
                                        }}
                                    >
                                        {suggestions.map((s, i) => (
                                            <li
                                                key={i}
                                                onClick={() => {
                                                    setStreetName(
                                                        s.displayStreetName,
                                                    );
                                                    setSelectedStreetName(
                                                        s.displayStreetName,
                                                    );
                                                    setZipCode(s.zipCode);
                                                    setSuggestions([]);
                                                }}
                                                style={{
                                                    padding: 8,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {s.displayFull}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <label className="bold">Zipcode: </label>
                                <input
                                    className="width100"
                                    value={zipCode}
                                    onChange={(e) => setZipCode(e.target.value)}
                                />
                            </div>
                            {error && <p style={{ color: "red" }}>{error}</p>}

                            <div className="alignEnd">
                                <button
                                    className="defaultButton"
                                    onClick={() => handleSearch()}
                                    disabled={loading}
                                >
                                    {loading ? "Searching..." : "Find"}
                                </button>
                            </div>
                        </div>

                        <div className="verticalStack defaultGap width100 centerVertically centerHorizontally">
                            {houseLegislator && (
                                <div className="section outlineHouse verticalStack defaultGap width100">
                                    <PropertyGroup
                                        title={`House Representative - District ${houseLegislator?.district}`}
                                        value={
                                            <div className="horizontalRow defaultGap smallPadding">
                                                <img
                                                    className="legislatorIcons"
                                                    src={houseLegislator?.image}
                                                    alt={
                                                        houseLegislator?.fullName
                                                    }
                                                />
                                                <a
                                                    className="link"
                                                    href={`/legislators/${houseLegislator?.id}`}
                                                >
                                                    {
                                                        houseLegislator?.formatName
                                                    }
                                                </a>
                                            </div>
                                        }
                                    ></PropertyGroup>
                                </div>
                            )}
                            {senateLegislator && (
                                <div className="section outlineSenate verticalStack defaultGap width100">
                                    <PropertyGroup
                                        title={`Senate Representative - District ${senateLegislator?.district}`}
                                        value={
                                            <div className="horizontalRow defaultGap smallPadding">
                                                <img
                                                    className="legislatorIcons"
                                                    src={
                                                        senateLegislator?.image
                                                    }
                                                    alt={
                                                        senateLegislator?.fullName
                                                    }
                                                />
                                                <a
                                                    className="link"
                                                    href={`/legislators/${senateLegislator?.id}`}
                                                >
                                                    {
                                                        senateLegislator?.formatName
                                                    }
                                                </a>
                                            </div>
                                        }
                                    ></PropertyGroup>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DistrictFinder;
