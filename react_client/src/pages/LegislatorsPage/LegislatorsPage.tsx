import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllLegislators } from "../../services/legislatorService";
import type { Legislator } from "../../models/Legislator";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";
import Badge from "../../components/Badge/Badge";
import ListPage from "../../components/ListPage/ListPage";
import PageHeader from "../../components/PageHeader/PageHeader";
import PillTabs from "../../components/PillTabs/PillTabs";
import FilterCard, { FilterRow } from "../../components/FilterCard/FilterCard";
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
//party and county clicks go to the page-level filters, so GeneralTable's helpers aren't needed here
function createLegislatorColumns(
    _helpers: {
        filterBadgeClick: (key: string, value: string) => void;
    },
    {
        onPartySelect,
        onCountySelect,
    }: {
        onPartySelect: (party: string) => void;
        onCountySelect: (county: string) => void;
    },
) {
    return [
        createDataTableColumn<Legislator>({
            id: "fullName",
            name: "Name",
            selector: (row) => row.fullName,
            minWidth: "280px",
            grow: 1.5,
            cell: (row: Legislator) => (
                <Link className={style.nameCell} to={`/legislators/${row.id}`}>
                    <img
                        className={style.nameCell__photo}
                        src={row.image}
                        alt=""
                    />
                    <div>
                        <div className={style.nameCell__name}>
                            {row.formatName}
                        </div>
                        <div className={style.nameCell__district}>
                            {row.house} · District {row.district}
                        </div>
                    </div>
                </Link>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        //hidden - the chamber tabs and the name cell cover it, but it stays available in the Filters panel
        createDataTableColumn<Legislator>({
            id: "house",
            name: "Chamber",
            selector: (row: Legislator) => row.house,
            omit: true,
            filterConfig: {
                type: FilterType.Select,
                options: ["House", "Senate"],
            },
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
            filterConfig: {
                type: FilterType.Select,
                options: ["Republican", "Democrat", "Forward Party"],
            },
        }),
        createDataTableColumn<Legislator>({
            id: "district",
            name: "District",
            selector: (row: Legislator) => row.district,
            width: "110px",
            filterConfig: {
                type: FilterType.Number,
            },
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
            filterConfig: {
                type: FilterType.Text,
            },
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
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Legislator>({
            id: "serviceStart",
            name: "Service Start",
            selector: (row: Legislator) => row.serviceStart,
            minWidth: "160px",
            filterConfig: {
                type: FilterType.Text,
            },
        }),
    ];
}

const LegislatorsPage = () => {
    const [legislators, setLegislators] = useState<Legislator[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChamber, setSelectedChamber] = useState("all");
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

    const chamberLegislators =
        selectedChamber === "all"
            ? legislators
            : legislators.filter(
                  (legislator) => legislator.house === selectedChamber,
              );

    const matchesParty = (legislator: Legislator) =>
        !selectedParty || legislator.party === selectedParty;

    const matchesCounty = (legislator: Legislator) =>
        !selectedCounty ||
        legislatorCounties(legislator).includes(selectedCounty);

    const tableLegislators = chamberLegislators.filter(
        (legislator) => matchesParty(legislator) && matchesCounty(legislator),
    );

    //each filter's counts apply the chamber and the OTHER filter but not its own,
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

    const partyCounts = countBy(
        chamberLegislators.filter(matchesCounty),
        (l) => (l.party ? [l.party] : []),
    );
    //most members first
    const partyOptions = [...partyCounts.keys()].sort(
        (a, b) => (partyCounts.get(b) ?? 0) - (partyCounts.get(a) ?? 0),
    );
    if (selectedParty && !partyCounts.has(selectedParty)) {
        partyOptions.push(selectedParty);
    }

    const countyCounts = countBy(
        chamberLegislators.filter(matchesParty),
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

            <PillTabs
                options={[
                    { value: "all", label: "All Legislators" },
                    { value: "House", label: "House" },
                    { value: "Senate", label: "Senate" },
                ]}
                selectedValue={selectedChamber}
                onSelect={setSelectedChamber}
            />

            <FilterCard title="Filter legislators">
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
                columns={(helpers) =>
                    createLegislatorColumns(helpers, {
                        onPartySelect: setSelectedParty,
                        onCountySelect: setSelectedCounty,
                    })
                }
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
