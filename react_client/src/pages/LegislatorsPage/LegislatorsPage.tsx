import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllLegislators } from "../../services/legislatorService";
import type { Legislator } from "../../models/Legislator";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import { createDataTableColumn } from "../../models/DataTableUtils";
import Badge from "../../components/Badge/Badge";
import ListPage from "../../components/ListPage/ListPage";
import PageHeader from "../../components/PageHeader/PageHeader";
import FilterCard, {
    ClearFiltersButton,
    FilterRow,
} from "../../components/FilterCard/FilterCard";
import FilterChip from "../../components/FilterChip/FilterChip";
import SearchableDropdown, {
    type DropdownOption,
} from "../../components/SearchableDropdown/SearchableDropdown";

import style from "./LegislatorsPage.module.css";

//counties are stored as one comma separated string, ie "Davis, Morgan"
const legislatorCounties = (legislator: Legislator) =>
    legislator.counties
        .split(",")
        .map((county) => county.trim())
        .filter(Boolean);

//set all column tables here
//clicking a chamber, district, party, or county in a row selects that filter at the top of the page
function createLegislatorColumns({
    onChamberSelect,
    onDistrictSelect,
    onPartySelect,
    onCountySelect,
}: {
    onChamberSelect: (chamber: string) => void;
    onDistrictSelect: (chamber: string, district: number) => void;
    onPartySelect: (party: string) => void;
    onCountySelect: (county: string) => void;
}) {
    return [
        createDataTableColumn<Legislator>({
            id: "fullName",
            name: "Name",
            selector: (row) => row.fullName,
            //the cell shows the name plus the chamber and district
            searchText: (row: Legislator) => [
                row.formatName,
                row.fullName,
                `${row.house} · District ${row.district}`,
            ],
            minWidth: "280px",
            grow: 1.5,
            //the photo and name link to the legislator, the chamber and district are filter buttons
            cell: (row: Legislator) => (
                <div className={style.nameCell}>
                    <Link to={`/legislators/${row.id}`} tabIndex={-1}>
                        <img
                            className={style.nameCell__photo}
                            src={row.image}
                            alt=""
                        />
                    </Link>
                    <div>
                        <Link
                            className={style.nameCell__name}
                            to={`/legislators/${row.id}`}
                        >
                            {row.formatName}
                        </Link>
                        <div className={style.nameCell__district}>
                            <button
                                className={style.nameCell__filterButton}
                                title={`Show only ${row.house} members`}
                                onClick={() => onChamberSelect(row.house)}
                            >
                                {row.house}
                            </button>
                            {" · "}
                            <button
                                className={style.nameCell__filterButton}
                                title={`Show only ${row.house} District ${row.district}`}
                                onClick={() =>
                                    onDistrictSelect(row.house, row.district)
                                }
                            >
                                {`District ${row.district}`}
                            </button>
                        </div>
                    </div>
                </div>
            ),
        }),
        createDataTableColumn<Legislator>({
            id: "party",
            name: "Party",
            selector: (row: Legislator) => row.party,
            width: "170px",
            cell: (row: Legislator) => (
                <Badge
                    type="party"
                    value={row.party}
                    onClick={(value) => onPartySelect(value)}
                />
            ),
        }),
        createDataTableColumn<Legislator>({
            id: "district",
            name: "District",
            selector: (row: Legislator) => row.district,
            width: "140px",
        }),
        createDataTableColumn<Legislator>({
            id: "counties",
            name: "Counties",
            selector: (row: Legislator) => row.counties,
            minWidth: "200px",
            cell: (row: Legislator) => (
                <div className={style.countyList}>
                    {legislatorCounties(row).map((county) => (
                        <Badge
                            key={county}
                            type="subjects"
                            value={county}
                            onClick={(value) => onCountySelect(value)}
                        />
                    ))}
                </div>
            ),
        }),
        createDataTableColumn<Legislator>({
            id: "contact",
            name: "Contact",
            selector: (row: Legislator) => `${row.email} ${row.phone}`,
            minWidth: "240px",
            sortable: false,
            cell: (row: Legislator) => (
                <div className={style.contactCell}>
                    {row.email && (
                        <a href={`mailto:${row.email}`}>{row.email}</a>
                    )}
                    {row.phone && (
                        <a href={`tel:+1${row.phone}`}>{row.phone}</a>
                    )}
                </div>
            ),
        }),
        createDataTableColumn<Legislator>({
            id: "serviceStart",
            name: "Service Start",
            selector: (row: Legislator) => row.serviceStart,
            minWidth: "160px",
        }),
    ];
}

const LegislatorsPage = () => {
    const [legislators, setLegislators] = useState<Legislator[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChamber, setSelectedChamber] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<number | null>(
        null,
    );
    const [selectedParty, setSelectedParty] = useState<string | null>(null);
    const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

    //counts of the rows currently shown in the table (after search + filters) - kept as numbers
    //so repeated reports from GeneralTable with the same counts don't cause re-renders
    const [shownCount, setShownCount] = useState(0);
    const [shownHouseCount, setShownHouseCount] = useState(0);

    const handleFilteredLegislators = (rows: Legislator[]) => {
        setShownCount(rows.length);
        setShownHouseCount(rows.filter((row) => row.house === "House").length);
    };

    useEffect(() => {
        const fetchLegislators = async () => {
            try {
                const response = await getAllLegislators();
                setLegislators(response);
            } catch (e) {
                if (e instanceof Error) {
                    console.error(
                        `Error getting all legislators: ${e.message}`,
                    );
                } else {
                    console.error("Unknown error getting all legislators", e);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLegislators();
    }, []);

    //clicking a district in a row also picks its chamber - House 12 and Senate 12 are different seats
    const selectDistrictFromRow = (chamber: string, district: number) => {
        setSelectedChamber(chamber);
        setSelectedDistrict(district);
    };

    const matchesChamber = (legislator: Legislator) =>
        !selectedChamber || legislator.house === selectedChamber;

    const matchesDistrict = (legislator: Legislator) =>
        selectedDistrict === null || legislator.district === selectedDistrict;

    const matchesParty = (legislator: Legislator) =>
        !selectedParty || legislator.party === selectedParty;

    const matchesCounty = (legislator: Legislator) =>
        !selectedCounty ||
        legislatorCounties(legislator).includes(selectedCounty);

    const filters = [
        matchesChamber,
        matchesDistrict,
        matchesParty,
        matchesCounty,
    ];

    //how many filters are on - drives the "Clear all filters" button
    const activeFilterCount = [
        selectedChamber !== null,
        selectedDistrict !== null,
        selectedParty !== null,
        selectedCounty !== null,
    ].filter(Boolean).length;

    const clearAllFilters = () => {
        setSelectedChamber(null);
        setSelectedDistrict(null);
        setSelectedParty(null);
        setSelectedCounty(null);
    };

    //clicking a value in a table row filters to just that value - every other filter goes back to
    //"All". The state updates are batched, so the clicked filter set after the clear wins
    const filterFromRow = (applyFilter: () => void) => {
        clearAllFilters();
        applyFilter();
    };

    //legislators passing every filter except skip - used for the faceted counts
    const legislatorsMatching = (skip?: (legislator: Legislator) => boolean) =>
        legislators.filter((legislator) =>
            filters.every((matches) => matches === skip || matches(legislator)),
        );

    const tableLegislators = legislatorsMatching();

    //each filter's counts apply every OTHER filter but not its own,
    //so every option shows how many legislators picking it would give
    const countBy = (
        list: Legislator[],
        getKeys: (legislator: Legislator) => string[],
    ): Map<string, number> => {
        const counts = new Map<string, number>();
        for (const legislator of list) {
            for (const key of new Set(getKeys(legislator))) {
                counts.set(key, (counts.get(key) ?? 0) + 1);
            }
        }
        return counts;
    };

    const chamberOptions = ["House", "Senate"];
    const chamberCounts = countBy(legislatorsMatching(matchesChamber), (l) =>
        l.house ? [l.house] : [],
    );

    const districtCounts = countBy(legislatorsMatching(matchesDistrict), (l) =>
        l.district ? [String(l.district)] : [],
    );
    const districtOptions: DropdownOption[] = [...districtCounts.keys()]
        .sort((a, b) => Number(a) - Number(b))
        .map((district) => ({
            value: district,
            label: `District ${district}`,
            count: districtCounts.get(district) ?? 0,
        }));
    //keep the selected district in the list even if the other filters leave it with no legislators
    if (
        selectedDistrict !== null &&
        !districtCounts.has(String(selectedDistrict))
    ) {
        districtOptions.unshift({
            value: String(selectedDistrict),
            label: `District ${selectedDistrict}`,
            count: 0,
        });
    }

    const partyCounts = countBy(legislatorsMatching(matchesParty), (l) =>
        l.party ? [l.party] : [],
    );
    //most members first
    const partyOptions = [...partyCounts.keys()].sort(
        (a, b) => (partyCounts.get(b) ?? 0) - (partyCounts.get(a) ?? 0),
    );
    if (selectedParty && !partyCounts.has(selectedParty)) {
        partyOptions.push(selectedParty);
    }

    const countyCounts = countBy(
        legislatorsMatching(matchesCounty),
        legislatorCounties,
    );
    const countyOptions: DropdownOption[] = [...countyCounts.keys()]
        .sort((a, b) => a.localeCompare(b))
        .map((county) => ({
            value: county,
            label: county,
            count: countyCounts.get(county) ?? 0,
        }));
    //keep the selected county in the list even if the other filters leave it with no legislators
    if (selectedCounty && !countyCounts.has(selectedCounty)) {
        countyOptions.unshift({
            value: selectedCounty,
            label: selectedCounty,
            count: 0,
        });
    }

    const stats = [
        { label: "Legislators", value: shownCount.toLocaleString() },
        { label: "House", value: shownHouseCount.toLocaleString() },
        {
            label: "Senate",
            value: (shownCount - shownHouseCount).toLocaleString(),
        },
    ];

    return (
        <ListPage>
            <PageHeader
                eyebrow="Utah State Legislature"
                title="Legislators"
                subtitle={
                    <>
                        Every current member of the Utah House and Senate.{" "}
                        <Link to="/maps">Find yours by address →</Link>
                    </>
                }
                stats={stats}
                loading={loading}
            />

            <FilterCard
                title="Filter legislators"
                action={
                    <ClearFiltersButton
                        count={activeFilterCount}
                        onClick={clearAllFilters}
                    />
                }
            >
                <FilterRow label="Chamber">
                    <FilterChip
                        label="All Chambers"
                        active={!selectedChamber}
                        onClick={() => setSelectedChamber(null)}
                    />
                    {chamberOptions.map((chamber) => (
                        <FilterChip
                            key={chamber}
                            label={chamber}
                            count={chamberCounts.get(chamber) ?? 0}
                            active={selectedChamber === chamber}
                            onClick={() =>
                                setSelectedChamber(
                                    selectedChamber === chamber
                                        ? null
                                        : chamber,
                                )
                            }
                        />
                    ))}
                </FilterRow>

                <FilterRow label="Party">
                    <FilterChip
                        label="All Parties"
                        active={!selectedParty}
                        onClick={() => setSelectedParty(null)}
                    />
                    {partyOptions.map((party) => (
                        <FilterChip
                            key={party}
                            label={party}
                            count={partyCounts.get(party) ?? 0}
                            active={selectedParty === party}
                            onClick={() =>
                                setSelectedParty(
                                    selectedParty === party ? null : party,
                                )
                            }
                        />
                    ))}
                </FilterRow>
                <FilterRow label="District">
                    <SearchableDropdown
                        options={districtOptions}
                        selectedValue={
                            selectedDistrict === null
                                ? null
                                : String(selectedDistrict)
                        }
                        onSelect={(value) =>
                            setSelectedDistrict(
                                value === null ? null : Number(value),
                            )
                        }
                        allLabel="All Districts"
                        searchPlaceholder={`Search ${districtOptions.length} districts...`}
                    />
                </FilterRow>
                <FilterRow label="County">
                    <SearchableDropdown
                        options={countyOptions}
                        selectedValue={selectedCounty}
                        onSelect={setSelectedCounty}
                        allLabel="All Counties"
                        searchPlaceholder={`Search ${countyOptions.length} counties...`}
                    />
                </FilterRow>
            </FilterCard>

            <GeneralTable
                columns={createLegislatorColumns({
                    onChamberSelect: (chamber) =>
                        filterFromRow(() => setSelectedChamber(chamber)),
                    onDistrictSelect: (chamber, district) =>
                        filterFromRow(() =>
                            selectDistrictFromRow(chamber, district),
                        ),
                    onPartySelect: (party) =>
                        filterFromRow(() => setSelectedParty(party)),
                    onCountySelect: (county) =>
                        filterFromRow(() => setSelectedCounty(county)),
                })}
                data={tableLegislators}
                defaultSortId="fullName"
                defaultSortAscending={true}
                loading={loading}
                onFilteredDataChange={handleFilteredLegislators}
            ></GeneralTable>
        </ListPage>
    );
};

export default LegislatorsPage;
