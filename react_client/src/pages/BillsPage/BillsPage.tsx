import { useState, useEffect } from "react";
import { getAllBills } from "../../services/billService";
import type { Bill } from "../../models/Bill";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import Badge from "../../components/Badge/Badge";
import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";

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
        createDataTableColumn<Bill>({
            id: "id",
            name: "Bill Id",
            selector: (row) => row.id,
            width: "120px",
            cell: (row) => (
                <a
                    href={`/bills/${row.id}`}
                    style={{ color: "#2563eb", textDecoration: "none" }}
                >
                    <Badge type="billId" value={row.id}></Badge>
                </a>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "shortTitle",
            name: "Title",
            selector: (row) => row.shortTitle,
            sortable: true,
            grow: 1,
            minWidth: "170px",
            maxWidth: "250px",
            wrap: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "generalProvisions",
            name: "General Provisions",
            selector: (row) => row.generalProvisions,
            sortable: true,
            grow: 2,
            minWidth: "250px",
            wrap: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "highlightedProvisions",
            name: "Highlighted Provisions",
            selector: (row) => row.highlightedProvisions,
            sortable: true,
            grow: 2,
            minWidth: "350px",
            wrap: true,
            cell: (row) => <CollapsibleCell text={row.highlightedProvisions} />,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "passed",
            name: "Passed",
            selector: (row) => row.passed,
            sortable: true,
            width: "150px",
            cell: (row) => <Badge type="passed" value={row.passed} />,
            filterConfig: {
                type: FilterType.Select,
                options: ["Passed", "Failed"],
            },
        }),
        createDataTableColumn<Bill>({
            id: "lastAction",
            name: "Last Action",
            selector: (row) => `${row.lastAction} ${row.lastActionDate}`,
            sortable: true,
            width: "150px",
            wrap: true,
            cell: (row) => (
                <div className={style.bills__lastActionCell}>
                    <div>{row.lastAction}</div>
                    <div>{row.lastActionDate}</div>
                </div>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "year",
            name: "Year",
            selector: (row) => row.year,
            sortable: true,
            width: "100px",
            filterConfig: {
                type: FilterType.Number,
            },
        }),
        createDataTableColumn<Bill>({
            id: "sessionId",
            name: "Session Id",
            selector: (row) => row.sessionId,
            sortable: true,
            width: "130px",
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "subjects",
            name: "Subjects",
            selector: (row: Bill) => row.subjects,
            sortable: true,
            grow: 2,
            minWidth: "200px",
            wrap: true,
            cell: (row: Bill) => <CollapsibleCell items={row.subjects} />,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "houseVoteUrl",
            name: "Official Links",
            selector: (row) => row.houseVoteUrl,
            sortable: false,
            width: "150px",
            cell: (row) => (
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
        }),
    ];

    return (
        <div className={style.bills__pageContainer}>
            <div>
                <h1 className={style.bills__header}>Bills Bills Bills!</h1>
            </div>
            <GeneralTable
                columns={columns}
                data={bills}
                defaultSortId="id"
            ></GeneralTable>
        </div>
    );
};

export default BillsPage;
