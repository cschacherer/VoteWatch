import { useState, useEffect } from "react";
import { getAllBills } from "../../services/billService";
import { type Bill, normalizeSessionId } from "../../models/Bill";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import Badge from "../../components/Badge/Badge";
import { BadgeType } from "../../components/Badge/Badge";
import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";

//set all column tables here
// 🔥 Column factory
function createBillColumns({
    filterBadgeClick,
}: {
    filterBadgeClick: (key: string, value: any) => void;
}) {
    return [
        createDataTableColumn<Bill>({
            id: "sessionId",
            name: "Session Id",
            selector: (row: Bill) => normalizeSessionId(row.sessionId),
            width: "150px",
            cell: (row) => (
                <Badge
                    type="sessionId"
                    value={row.sessionId}
                    onClick={(value) => filterBadgeClick("sessionId", value)}
                ></Badge>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "billId",
            name: "Bill Id",
            selector: (row) => row.id,
            width: "120px",
            cell: (row) => (
                <a
                    href={`/bills/${row.sessionId}/${row.id}`}
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
            width: "150px",
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
            grow: 1,
            minWidth: "300px",
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
            grow: 1.5,
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
            selector: (row) => (row.passed ? "passed" : "failed"),
            sortable: true,
            width: "135px",
            cell: (row) => (
                <Badge
                    type={BadgeType.Passed}
                    value={row.passed}
                    onClick={(value) => filterBadgeClick("passed", value)}
                />
            ),
            filterConfig: {
                type: FilterType.Select,
                options: ["PASSED", "FAILED"],
            },
        }),
        //need this column for filtering, but it is redundant with the session id
        createDataTableColumn<Bill>({
            id: "year",
            name: "Year",
            selector: (row) => row.year,
            sortable: true,
            width: "0px",
            filterConfig: {
                type: FilterType.Number,
            },
        }),
        createDataTableColumn<Bill>({
            id: "subjects",
            name: "Subjects",
            selector: (row: Bill) => row.subjects,
            sortable: true,
            grow: 1,
            minWidth: "300px",
            wrap: true,
            cell: (row: Bill) => (
                <CollapsibleCell
                    items={row.subjects}
                    onBadgeClick={(value) =>
                        filterBadgeClick("subjects", value.toLowerCase())
                    }
                />
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
    ];
}

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

    return (
        <div className="page">
            <div className="pageTitle">Bills Bills Bills!</div>
            <GeneralTable
                columns={(helpers) => createBillColumns(helpers)}
                data={bills}
                defaultSortId="sessionId"
                defaultSortAscending={false}
            ></GeneralTable>
        </div>
    );
};

export default BillsPage;
