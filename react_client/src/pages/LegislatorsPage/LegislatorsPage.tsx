import { useState, useEffect } from "react";
import { getAllLegislators } from "../../services/legislatorService";
import type { Legislator } from "../../models/Legislator";

import style from "./LegislatorsPage.module.css";
import GeneralTable from "../../components/GeneralTable/GeneralTable";

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

    //Set up columns
    const columns = [
        {
            name: "Name",
            selector: (row: Legislator) => row.fullName,
            sortable: true,
            grow: 1,
            minWidth: "180px",
            cell: (row: Legislator) => (
                <div className={style.legislators__nameCell}>
                    <img
                        src={row.image}
                        alt={row.fullName}
                        style={{ width: "100", borderRadius: "10px" }}
                    />
                    <a
                        href={`legislators/${row.id}`}
                        style={{
                            color: "#2563eb",
                            textDecoration: "underline",
                        }}
                    >
                        {row.fullName}
                    </a>
                </div>
            ),
        },
        {
            name: "House",
            selector: (row: Legislator) => row.house,
            sortable: true,
            grow: 1,
            minWidth: "120px",
        },
        {
            name: "Party",
            selector: (row: Legislator) => row.party,
            sortable: true,
            grow: 1,
            minWidth: "120px",
        },
        {
            name: "District",
            selector: (row: Legislator) => row.district,
            sortable: true,
            grow: 1,
            minWidth: "120px",
        },
        {
            name: "Counties",
            selector: (row: Legislator) => row.counties,
            sortable: true,
            grow: 1,
            minWidth: "180px",
            wrap: true,
        },
        {
            name: "Email",
            selector: (row: Legislator) => row.email,
            sortable: true,
            grow: 1,
            minWidth: "220px",
            cell: (row: Legislator) => (
                <a href={`mailto:${row.email}`}>{row.email}</a>
            ),
        },
        {
            name: "Cell Phone",
            selector: (row: Legislator) => row.cell,
            sortable: true,
            grow: 1,
            minWidth: "150px",
        },
        {
            name: "Service Start",
            selector: (row: Legislator) => row.serviceStart,
            sortable: true,
            grow: 1,
            minWidth: "150px",
        },
        {
            name: "Link",
            selector: (row: Legislator) => row.link,
            sortable: false,
            width: "150px",
            cell: (row: Legislator) => (
                <a
                    href={row.link}
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                    Government Link
                </a>
            ),
        },
    ];

    const filters = [
        {
            key: "fullName",
            label: "Name",
            type: "text",
        },
        {
            key: "house",
            label: "House",
            type: "select",
            options: ["House", "Senate"], // adjust to your data
        },
        {
            key: "party",
            label: "Party",
            type: "select",
            options: ["Republican", "Democrat", "Independent"], // adjust
        },
        {
            key: "district",
            label: "District",
            type: "number", // 🔥 allows > < =
        },
        {
            key: "counties",
            label: "Counties",
            type: "text",
        },
        {
            key: "email",
            label: "Email",
            type: "text",
        },
        {
            key: "cell",
            label: "Cell Phone",
            type: "text",
        },
        {
            key: "serviceStart",
            label: "Service Start",
            type: "text", // can upgrade to date later
        },
    ];

    return (
        <div className={style.legislators__pageContainer}>
            <div>
                <h1 className={style.legislators__header}>Legislators!</h1>
            </div>

            <GeneralTable
                columns={columns}
                data={legislators}
                filters={filters}
            ></GeneralTable>
        </div>
    );
};

export default LegislatorsPage;
