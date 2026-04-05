import { useState, useEffect } from "react";
import { getAllBills } from "../../services/billService";
import type { Bill } from "../../models/Bill";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import Badge from "../../components/Badge/Badge";

import style from "./BillsPage.module.css";

const BillsPage = () => {
    const [bills, setBills] = useState<Bill[]>([]);

    useEffect(() => {
        const fetchBills = async () => {
            try {
                const response = await getAllBills();
                console.log(response);
                setBills(response);
            } catch (e) {
                if (e instanceof Error) {
                    console.error(`Error getting all bills: ${e.message}`);
                } else {
                    console.error("Unknown error getting all bills", e);
                }
            }
        };

        fetchBills();
    }, []);

    //set all column tables here
    const columns = [
        {
            id: "id",
            name: "Bill Id",
            selector: (row: Bill) => row.id,
            sortable: true,
            width: "120px",
            cell: (row: Bill) => (
                <a
                    href={`/bills/${row.id}`}
                    style={{ color: "#2563eb", textDecoration: "none" }}
                >
                    <Badge type="billId" value={row.id}></Badge>
                </a>
            ),
        },
        {
            id: "title",
            name: "Title",
            selector: (row: Bill) => row.shortTitle,
            sortable: true,
            grow: 1,
            minWidth: "170px",
            maxWidth: "250px",
            wrap: true,
        },
        {
            id: "generalProvisions",
            name: "General Provisions",
            selector: (row: Bill) => row.generalProvisions,
            sortable: true,
            grow: 2,
            minWidth: "250px",
            wrap: true,
        },
        {
            id: "highlightedProvisions",
            name: "Highlighted Provisions",
            selector: (row: Bill) => row.highlightedProvisions,
            sortable: true,
            grow: 2,
            minWidth: "350px",
            wrap: true,
            cell: (row: Bill) => (
                <CollapsibleCell text={row.highlightedProvisions} />
            ),
        },
        {
            name: "Passed",
            selector: (row: Bill) => row.passed,
            sortable: true,
            width: "150px",
            cell: (row: Bill) => <Badge type="passed" value={row.passed} />,
        },
        {
            id: "lastAction",
            name: "Last Action",
            selector: (row: Bill) => row.lastAction,
            sortable: true,
            width: "150px",
            wrap: true,
            cell: (row: Bill) => (
                <div className={style.bills__lastActionCell}>
                    <div>{row.lastAction}</div>
                    <div>{row.lastActionDate}</div>
                </div>
            ),
        },
        {
            id: "year",
            name: "Year",
            selector: (row: Bill) => row.year,
            sortable: true,
            width: "100px",
        },
        {
            id: "sessionId",
            name: "Session Id",
            selector: (row: Bill) => row.sessionId,
            sortable: true,
            width: "130px",
        },
        {
            id: "subjects",
            name: "Subjects",
            selector: (row: Bill) => row.subjects,
            sortable: true,
            grow: 2,
            minWidth: "200px",
            wrap: true,
            cell: (row: Bill) => <CollapsibleCell items={row.subjects} />,
        },
        {
            id: "officialLinks",
            name: "Official Links",
            selector: (row: Bill) => row.houseVoteUrl,
            sortable: false,
            width: "150px",
            cell: (row: Bill) => (
                <div className={style.bills__lastActionCell}>
                    <div>
                        <a
                            href={row.houseVoteUrl}
                            style={{
                                color: "#2563eb",
                                textDecoration: "underline",
                            }}
                        >
                            House Vote
                        </a>
                    </div>
                    <div>
                        <a
                            href={row.senateVoteUrl}
                            style={{
                                color: "#2563eb",
                                textDecoration: "underline",
                            }}
                        >
                            Senate Vote
                        </a>
                    </div>
                    <div>
                        <a
                            href={row.link}
                            style={{
                                color: "#2563eb",
                                textDecoration: "underline",
                            }}
                        >
                            Government Bill
                        </a>
                    </div>
                </div>
            ),
        },
    ];

    const filters = [
        {
            key: "id",
            label: "Bill Id",
            type: "text",
        },
        {
            key: "shortTitle",
            label: "Title",
            type: "text",
        },
        {
            key: "generalProvisions",
            label: "General Provisions",
            type: "text",
        },
        {
            key: "highlightedProvisions",
            label: "Highlighted Provisions",
            type: "text",
        },
        {
            key: "lastAction",
            label: "Last Action",
            type: "text",
        },
        {
            key: "lastActionDate",
            label: "Last Action Date",
            type: "text", // could upgrade to date later
        },
        {
            key: "year",
            label: "Year",
            type: "number", // 🔥 numeric filter enabled
        },
        {
            key: "sessionId",
            label: "Session Id",
            type: "text",
        },
        {
            key: "subjects",
            label: "Subjects",
            type: "text",
        },
    ];

    return (
        <div className={style.bills__pageContainer}>
            <div>
                <h1 className={style.bills__header}>Bills Bills Bills!</h1>
            </div>
            <GeneralTable
                columns={columns}
                data={bills}
                filters={filters}
                defaultSortId="id"
            ></GeneralTable>
        </div>
    );
};

export default BillsPage;
