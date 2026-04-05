import { useState, useEffect } from "react";
import { getAllLegislators } from "../../services/legislatorService";
import type { Legislator } from "../../models/Legislator";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import Badge from "../../components/Badge/Badge";

import "../../styles/global.css";
import style from "./LegislatorsPage.module.css";

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
            id: "name",
            name: "Name",
            selector: (row: Legislator) => row.fullName,
            sortable: true,
            wrap: true,
            grow: 1,
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
        },
        {
            id: "chamber",
            name: "Chamber",
            selector: (row: Legislator) => row.house,
            sortable: true,
            wrap: true,
            grow: 1,
            minWidth: "120px",
        },
        {
            id: "party",
            name: "Party",
            selector: (row: Legislator) => row.party,
            sortable: true,
            grow: 1,
            minWidth: "180px",
            cell: (row: Legislator) => <Badge type="party" value={row.party} />,
        },
        {
            id: "district",
            name: "District",
            selector: (row: Legislator) => row.district,
            sortable: true,
            wrap: true,
            grow: 1,
            minWidth: "120px",
        },
        {
            id: "counties",
            name: "Counties",
            selector: (row: Legislator) => row.counties,
            sortable: true,
            wrap: true,
            grow: 1,
            minWidth: "180px",
        },
        {
            id: "email",
            name: "Email",
            selector: (row: Legislator) => row.email,
            sortable: true,
            wrap: true,
            grow: 1,
            minWidth: "220px",
            cell: (row: Legislator) => (
                <a href={`mailto:${row.email}`}>{row.email}</a>
            ),
        },
        {
            id: "phone",
            name: "Phone",
            selector: (row: Legislator) => row.cell,
            sortable: true,
            wrap: true,
            grow: 1,
            minWidth: "150px",
        },
        {
            id: "serviceStart",
            name: "Service Start",
            selector: (row: Legislator) => row.serviceStart,
            sortable: true,
            grow: 1,
            minWidth: "150px",
            wrap: true,
        },
        {
            id: "link",
            name: "Link",
            selector: (row: Legislator) => row.link,
            sortable: false,
            wrap: true,
            width: "150px",
            cell: (row: Legislator) => (
                <a
                    href={row.link}
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                    Government Page
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
            label: "Chamber",
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
                defaultSortId="name"
            ></GeneralTable>
        </div>
    );
};

export default LegislatorsPage;
