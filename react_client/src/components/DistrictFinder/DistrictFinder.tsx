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
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { type Address } from "../../models/MapUtils.ts";
import { Polygon } from "react-leaflet";
import { useMap, GeoJSON } from "react-leaflet";

import style from "./DistrictFinder.module.css";
import PropertyGroup from "../PropertyGroup/PropertyGroup.tsx";

const DistrictFinder = () => {
    const [streetName, setStreetName] = useState<string>("1962 E Redondo Ave");
    const [zipCode, setZipCode] = useState<string>("84108");

    const [suggestions, setSuggestions] = useState<Address[]>([]);
    const [coords, setCoords] = useState<LatLngTuple | null>(null);
    const [districts, setDistricts] = useState<{
        house: number;
        senate: number;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [housePolygon, setHousePolygon] = useState<any>(null);
    const [senatePolygon, setSenatePolygon] = useState<any>(null);

    const UTAH_CENTER: [number, number] = [39.32, -111.09];
    const UTAH_ZOOM = 6;

    // // 🔍 AUTOCOMPLETE EFFECT (debounced)
    // useEffect(() => {
    //     const timeout = setTimeout(async () => {
    //         const results = await searchAddresses(streetName, zipCode);
    //         setSuggestions(results);
    //     }, 200);

    //     return () => clearTimeout(timeout);
    // }, [streetName]);

    const convertRings = (rings: number[][][]) => {
        return rings.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
    };

    function FitBounds({ polygon }: { polygon: any }) {
        const map = useMap();

        useEffect(() => {
            if (!polygon) return;

            const flat = polygon.flat(); // flatten rings
            map.fitBounds(flat);
        }, [polygon]);

        return null;
    }

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
            let x = await getHouseDistrictGeometry(districtResults.house);
            setHousePolygon(x);
            let y = await getSenateDistrictGeometry(districtResults.senate);
            setSenatePolygon(y);
            setDistricts(districtResults);

            // if (result.houseGeometry?.rings) {
            //     let converted = convertRings(result.houseGeometry.rings);
            //     setHousePolygon(converted);
            // } else {
            //     console.log("No house geometry returned", result.houseGeometry);
            // }

            // if (result.senateGeometry?.rings) {
            //     let converted = convertRings(result.senateGeometry.rings);
            //     setSenatePolygon(converted);
            // } else {
            //     console.log(
            //         "No senate geometry returned",
            //         result.senateGeometry,
            //     );
            // }
            //setDistricts(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="outline section verticalStack defaultGap defaultPadding">
            <div className="pageTitle">Find Your Utah Representatives</div>

            {/* Address input + autocomplete */}
            <div className="horizontalRow defaultGap">
                <label className="bold">Street Name:</label>
                <div className="relativePosition flexFillSpace">
                    <input
                        className="width100 flexFillSpace"
                        value={streetName}
                        onChange={(e) => setStreetName(e.target.value)}
                        onBlur={() => {
                            setTimeout(() => setSuggestions([]), 150);
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
                                        setStreetName(s.displayStreetName);
                                        setZipCode(s.zipCode);
                                        setSuggestions([]);
                                        handleSearch();
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
                <label className="bold">Zipcode: </label>
                <input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                />

                <button
                    className="defaultButton"
                    onClick={() => handleSearch()}
                    disabled={loading}
                >
                    {loading ? "Searching..." : "Find"}
                </button>
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Map */}
            <div style={{ height: 400, marginTop: 20 }}>
                <MapContainer
                    center={coords ?? UTAH_CENTER}
                    zoom={10}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution="&copy; OpenStreetMap"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {coords && <Marker position={coords} />}

                    {housePolygon && (
                        <GeoJSON
                            data={housePolygon}
                            style={{
                                color: "blue",
                                weight: 2,
                                fillOpacity: 0.2,
                            }}
                        />
                    )}
                    {senatePolygon && (
                        <GeoJSON
                            data={senatePolygon}
                            style={{
                                color: "red",
                                weight: 2,
                                fillOpacity: 0.2,
                            }}
                        />
                    )}
                </MapContainer>
            </div>

            <PropertyGroup title="House District" value="23"></PropertyGroup>
            <PropertyGroup title="Senate District" value="14"></PropertyGroup>
        </div>
    );
};

export default DistrictFinder;
