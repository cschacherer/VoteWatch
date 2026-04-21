import { useState, useEffect } from "react";
import { getAllLegislators } from "../../services/legislatorService";
import type { Legislator } from "../../models/Legislator";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";
import Badge from "../../components/Badge/Badge";

import style from "./LegislatorsPage.module.css";

//set all column tables here
// 🔥 Column factory
function createLegislatorColumns({
    filterBadgeClick,
}: {
    filterBadgeClick: (key: string, value: string) => void;
}) {
    return [
        createDataTableColumn<Legislator>({
            id: "fullName",
            name: "Name",
            selector: (row) => row.fullName,
            minWidth: "250px",
            cell: (row: Legislator) => (
                <a
                    href={`legislators/${row.id}`}
                    className={style.legislators__nameCell}
                >
                    <img
                        src={row.image}
                        alt={row.fullName}
                        className={style.legislators__image}
                    />

                    <div className={style.legislators__name}>
                        {row.fullName}
                    </div>
                </a>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Legislator>({
            id: "house",
            name: "Chamber",
            selector: (row: Legislator) => row.house,
            minWidth: "120px",
            filterConfig: {
                type: FilterType.Select,
                options: ["House", "Senate"],
            },
        }),
        createDataTableColumn<Legislator>({
            id: "party",
            name: "Party",
            selector: (row: Legislator) => row.party,
            minWidth: "180px",
            cell: (row: Legislator) => (
                <Badge
                    type="party"
                    value={row.party}
                    onClick={(value) =>
                        filterBadgeClick("party", value.toLowerCase())
                    }
                />
            ),
            filterConfig: {
                type: FilterType.Select,
                options: ["Republican", "Democrat", "Independent"],
            },
        }),
        createDataTableColumn<Legislator>({
            id: "district",
            name: "District",
            selector: (row: Legislator) => row.district,
            minWidth: "120px",
            filterConfig: {
                type: FilterType.Number,
            },
        }),
        createDataTableColumn<Legislator>({
            id: "counties",
            name: "Counties",
            selector: (row: Legislator) => row.counties,
            minWidth: "180px",
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Legislator>({
            id: "email",
            name: "Email",
            selector: (row: Legislator) => row.email,
            minWidth: "220px",
            cell: (row: Legislator) => (
                <a href={`mailto:${row.email}`}>{row.email}</a>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Legislator>({
            id: "phone",
            name: "Phone",
            selector: (row: Legislator) => row.phone,
            minWidth: "150px",
            cell: (row: Legislator) => (
                <a href={`tel:+1${row.phone}`}>{row.phone}</a>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Legislator>({
            id: "serviceStart",
            name: "Service Start",
            selector: (row: Legislator) => row.serviceStart,
            minWidth: "150px",
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Legislator>({
            id: "link",
            name: "Official Links",
            selector: (row: Legislator) => row.link,
            sortable: false,
            width: "150px",
            cell: (row: Legislator) => (
                <a
                    href={row.link}
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                    Government Bio
                </a>
            ),
        }),
    ];
}

const LegislatorsPage = () => {
    const [legislators, setLegislators] = useState<Legislator[]>([]);

    useEffect(() => {
        const fetchBills = async () => {
            try {
                const response = await getAllLegislators();
                console.log(response);
                setLegislators(response);
            } catch (e) {
                if (e instanceof Error) {
                    console.error(
                        `Error getting all legislators: ${e.message}`,
                    );
                } else {
                    console.error("Unknown error getting all legislators", e);
                }
            }
        };

        fetchBills();
    }, []);

    return (
        <div className="page">
            <div className="pageTitle">Current Legislators</div>
            <GeneralTable
                columns={(helpers) => createLegislatorColumns(helpers)}
                data={legislators}
                defaultSortId="fullName"
            ></GeneralTable>
        </div>
    );
};

export default LegislatorsPage;
