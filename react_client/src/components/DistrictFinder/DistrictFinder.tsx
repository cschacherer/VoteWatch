import {
    MapContainer,
    TileLayer,
    Marker,
    useMap,
    GeoJSON,
} from "react-leaflet";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
    searchAddresses,
    getCoordinatesFromAddress,
    getDistrictsFromCoordinates,
    getHouseDistrictGeometry,
    getSenateDistrictGeometry,
} from "../../services/mapService";
import { getLegislatorByDistrict } from "../../services/legislatorService.ts";
import { type Address } from "../../models/MapUtils.ts";
import { type Legislator } from "../../models/Legislator.ts";
import Badge from "../Badge/Badge";

import style from "./DistrictFinder.module.css";

const UTAH_CENTER: [number, number] = [39.32, -111.09];

//district outline colors - blue and amber so chambers don't read as party colors (red/blue)
const HOUSE_COLOR = "#2563eb";
const SENATE_COLOR = "#d97706";

//zooms the map to fit both district outlines - separate props (not an array) so it only
//re-fits when a district changes, not on every render while typing
function FitBounds({ house, senate }: { house: any; senate: any }) {
    const map = useMap();

    useEffect(() => {
        try {
            const loaded = [house, senate].filter(Boolean);
            if (loaded.length === 0) return;

            const bounds = L.featureGroup(
                loaded.map((geojson) => L.geoJSON(geojson)),
            ).getBounds();

            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [24, 24] });
            }
        } catch (e) {
            console.log(e);
        }
    }, [house, senate, map]);

    return null;
}

//outline of one district with a label in the middle
const DistrictOutline = ({
    geojson,
    color,
    chamber,
}: {
    geojson: any;
    color: string;
    chamber: string;
}) => (
    <GeoJSON
        key={JSON.stringify(geojson)}
        data={geojson}
        style={{ color, weight: 3, fillColor: color, fillOpacity: 0.12 }}
        onEachFeature={(feature, layer) => {
            const district: number = feature.properties?.DIST;
            if (district) {
                layer.bindTooltip(`${chamber} District ${district}`, {
                    permanent: true, // always visible
                    direction: "center",
                    className: style.mapLabel,
                });
            }
        }}
    />
);

//one of the two legislators for the address
const RepresentativeCard = ({
    legislator,
    chamber,
    color,
}: {
    legislator: Legislator;
    chamber: string;
    color: string;
}) => (
    <div className={style.rep} style={{ borderLeftColor: color }}>
        <img className={style.rep__photo} src={legislator.image} alt="" />
        <div className={style.rep__info}>
            <span className={style.rep__chamber} style={{ color }}>
                {chamber} · District {legislator.district}
            </span>
            <Link
                className={style.rep__name}
                to={`/legislators/${legislator.id}`}
            >
                {legislator.formatName}
            </Link>
            <div className={style.rep__actions}>
                <Badge type="party" value={legislator.party} />
                {legislator.email && (
                    <a
                        className={style.rep__link}
                        href={`mailto:${legislator.email}`}
                    >
                        Email
                    </a>
                )}
                <Link
                    className={style.rep__link}
                    to={`/legislators/${legislator.id}`}
                >
                    Profile →
                </Link>
            </div>
        </div>
    </div>
);

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

    const streetInputRef = useRef<HTMLInputElement>(null);

    // AUTOCOMPLETE (debounced)
    useEffect(() => {
        //set when the street changes again before this lookup finishes, so a slow, older lookup
        //can't overwrite newer suggestions
        let stale = false;

        const timeout = setTimeout(async () => {
            if (streetName === selectedStreetName) {
                setSuggestions([]);
                return;
            }

            const results = await searchAddresses(streetName, zipCode);

            //the lookup can take a few seconds - don't pop the list open if the user has since moved
            //on (left the street box or pressed Escape), or it covers the zip code field
            if (stale || document.activeElement !== streetInputRef.current) {
                return;
            }
            setSuggestions(results);
        }, 200);

        return () => {
            stale = true;
            clearTimeout(timeout);
        };
    }, [streetName, selectedStreetName]);

    const handleSearch = async () => {
        if (!streetName.trim()) {
            setError("Enter a street address to search.");
            return;
        }

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

            const [houseLeg, senateLeg, houseGeometry, senateGeometry] =
                await Promise.all([
                    getLegislatorByDistrict("H", districtResults.house),
                    getLegislatorByDistrict("S", districtResults.senate),
                    getHouseDistrictGeometry(districtResults.house),
                    getSenateDistrictGeometry(districtResults.senate),
                ]);

            setHouseLegislator(houseLeg);
            setSenateLegislator(senateLeg);
            setHouseDistrictPolygon(houseGeometry);
            setSenateDistrictPolygon(senateGeometry);
        } catch (e: any) {
            setError(
                e.message === "Address not found"
                    ? "We couldn't find that address. Check the street and zip code and try again."
                    : e.message,
            );
        } finally {
            setLoading(false);
        }
    };

    const hasResults = houseLegislator || senateLegislator;

    return (
        <div className={style.finder}>
            {/* Address + results */}
            <aside className={style.panel}>
                <form
                    className={style.form}
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSearch();
                    }}
                >
                    <h2 className={style.panel__title}>Your address</h2>

                    <label className={style.field}>
                        <span className={style.field__label}>
                            Street address
                        </span>
                        <div className={style.autocomplete}>
                            <input
                                ref={streetInputRef}
                                className={style.input}
                                value={streetName}
                                placeholder="350 N State St"
                                autoComplete="off"
                                onChange={(e) => {
                                    setStreetName(e.target.value);
                                    setSelectedStreetName("");
                                }}
                                onBlur={() => {
                                    setTimeout(() => setSuggestions([]), 150);
                                }}
                                onKeyDown={(e) => {
                                    //marking the current text as chosen stops the pending lookup from reopening the list
                                    if (e.key === "Escape") {
                                        setSuggestions([]);
                                        setSelectedStreetName(streetName);
                                    }
                                }}
                            />
                            {suggestions.length > 0 && (
                                <ul className={style.suggestions}>
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
                                        >
                                            {s.displayFull}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </label>

                    <label className={style.field}>
                        <span className={style.field__label}>Zip code</span>
                        <input
                            className={style.input}
                            value={zipCode}
                            placeholder="84103"
                            inputMode="numeric"
                            //the street suggestions list covers this field, so close it when it gets focus
                            onFocus={() => setSuggestions([])}
                            onChange={(e) => setZipCode(e.target.value)}
                        />
                    </label>

                    {error && <p className={style.error}>{error}</p>}

                    <button
                        className={style.searchButton}
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Searching..." : "Find my legislators"}
                    </button>
                </form>

                <div className={style.results}>
                    <h2 className={style.panel__title}>Your legislators</h2>
                    {hasResults ? (
                        <>
                            {houseLegislator && (
                                <RepresentativeCard
                                    legislator={houseLegislator}
                                    chamber="House"
                                    color={HOUSE_COLOR}
                                />
                            )}
                            {senateLegislator && (
                                <RepresentativeCard
                                    legislator={senateLegislator}
                                    chamber="Senate"
                                    color={SENATE_COLOR}
                                />
                            )}
                        </>
                    ) : (
                        <p className={style.results__empty}>
                            Enter your address to see your Utah House
                            representative and Senator.
                        </p>
                    )}
                </div>
            </aside>

            {/* Map */}
            <div className={style.mapCard}>
                <MapContainer
                    center={coords ?? UTAH_CENTER}
                    zoom={6}
                    className={style.map}
                >
                    {/* Esri light gray basemap - free with attribution, no API key (CARTO's tiles now require one) */}
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                        attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors"
                        maxZoom={16}
                    />

                    {coords && <Marker position={coords} />}

                    {houseDistrictPolygon && (
                        <DistrictOutline
                            geojson={houseDistrictPolygon}
                            color={HOUSE_COLOR}
                            chamber="House"
                        />
                    )}
                    {senateDistrictPolygon && (
                        <DistrictOutline
                            geojson={senateDistrictPolygon}
                            color={SENATE_COLOR}
                            chamber="Senate"
                        />
                    )}
                    <FitBounds
                        house={houseDistrictPolygon}
                        senate={senateDistrictPolygon}
                    />
                </MapContainer>

                {hasResults && (
                    <div className={style.legend}>
                        <span>
                            <span
                                className={style.legend__swatch}
                                style={{ borderColor: HOUSE_COLOR }}
                            />
                            House district
                        </span>
                        <span>
                            <span
                                className={style.legend__swatch}
                                style={{ borderColor: SENATE_COLOR }}
                            />
                            Senate district
                        </span>
                    </div>
                )}

                {loading && (
                    <div className={style.mapOverlay}>
                        Finding your districts...
                    </div>
                )}
            </div>
        </div>
    );
};

export default DistrictFinder;
