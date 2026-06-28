import { useState, useEffect } from "react";
import { getAllBills } from "../../services/billService";
import { type Bill, normalizeSessionId } from "../../models/Bill";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import Badge from "../../components/Badge/Badge";
import { BadgeType } from "../../components/Badge/Badge";
import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";
import PolicyChip from "../../components/PolicyChip/PolicyChip";
import { formatPolicyName } from "../../utils/stringFormat";

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
            omit: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "billId",
            name: "Bill Id",
            selector: (row) => row.id,
            omit: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "shortTitle",
            name: "Title",
            selector: (row) => row.shortTitle,
            sortable: true,
            wrap: true,
            omit: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "fullId",
            name: "Bill",
            selector: (row) => row.id + row.shortTitle,
            sortable: true,
            width: "300px",
            wrap: true,
            cell: (row) => (
                <div className="verticalStack defaultGap centerHorizontally flexFillSpace">
                    <a
                        className="noTextDecoration"
                        href={`/bills/${row.sessionId}/${row.id}`}
                    >
                        <Badge type="billId" value={row.id}></Badge>
                    </a>
                    <div className="bold centerText">{row.shortTitle}</div>
                    <Badge
                        type="sessionId"
                        value={row.sessionId}
                        onClick={(value) =>
                            filterBadgeClick("sessionId", value)
                        }
                    ></Badge>
                </div>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        // createDataTableColumn<Bill>({
        //     id: "generalProvisions",
        //     name: "General Provisions",
        //     selector: (row) => row.generalProvisions,
        //     sortable: true,
        //     grow: 1,
        //     minWidth: "300px",
        //     wrap: true,
        //     filterConfig: {
        //         type: FilterType.Text,
        //     },
        // }),
        createDataTableColumn<Bill>({
            id: "summary",
            name: "Summary",
            selector: (row) => row.summary.oneSentence,
            sortable: true,
            grow: 2,
            minWidth: "300px",
            wrap: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        // createDataTableColumn<Bill>({
        //     id: "highlightedProvisions",
        //     name: "Highlighted Provisions",
        //     selector: (row) => row.highlightedProvisions,
        //     sortable: true,
        //     grow: 1.5,
        //     minWidth: "350px",
        //     wrap: true,
        //     cell: (row) => <CollapsibleCell text={row.highlightedProvisions} />,
        //     filterConfig: {
        //         type: FilterType.Text,
        //     },
        // }),
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
        //need this column for filtering, but it is redundant with the session id so we hide it by setting
        //width to zero
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
            id: "policy",
            name: "Policies",
            selector: (row: Bill) => row.policies,
            minWidth: "250px",
            grow: 1,
            cell: (row: Bill) => {
                return (
                    <div>
                        {row.policies.map((policy) => {
                            return <PolicyChip policy={policy}></PolicyChip>;
                        })}
                    </div>
                );
            },
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "policyTopic",
            name: "Policy Topics",
            selector: (row: Bill) =>
                row.policies
                    .map((policy) => formatPolicyName(policy.policyTopic))
                    .join(", "),
            omit: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "policyDirection",
            name: "Policy Directions",
            selector: (row: Bill) =>
                row.policies
                    .map((policy) => formatPolicyName(policy.policyDirection))
                    .join(", "),
            omit: true,
            filterConfig: {
                type: FilterType.Text,
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
                        filterBadgeClick("subjects", value)
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
