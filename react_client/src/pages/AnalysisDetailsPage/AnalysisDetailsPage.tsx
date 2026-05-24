import { useState, useEffect } from "react";
import {
    getLegislatorDetails,
    getLegislatorVotes,
    getLegislatorSponsoredBills,
} from "../../services/legislatorService";
import type { Legislator } from "../../models/Legislator";
import type { LegislatorVote } from "../../models/LegislatorVote";
import { useParams } from "react-router-dom";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";
import Badge from "../../components/Badge/Badge";
import PropertyGroup from "../../components/PropertyGroup/PropertyGroup";
import { type Bill, normalizeSessionId } from "../../models/Bill";

import { type PolicyTopic, createPolicyTopics } from "../../models/PolicyTopic";
import {
    type LegislatorPolicyScore,
    createLegislatorPolicyScore,
} from "../../models/LegislatorPolicyScore";
import {
    getLegislatorAnalysisByYear,
    getLegislatorPolicyDirectionAnalysisByYear,
} from "../../services/analysisService";

//Create all columns for VOTE TABLE
function createAnalysisDetailsColumns({
    filterBadgeClick,
}: {
    filterBadgeClick: (key: string, value: string) => void;
}) {
    return [
        createDataTableColumn<LegislatorVote>({
            id: "sessionId",
            name: "Session Id",
            selector: (row: LegislatorVote) =>
                normalizeSessionId(row.bill.sessionId),
            width: "150px",
            cell: (row) => (
                <Badge
                    type="sessionId"
                    value={row.bill.sessionId}
                    onClick={(value) => filterBadgeClick("sessionId", value)}
                ></Badge>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "id",
            name: "Bill Id",
            selector: (row: LegislatorVote) => row.bill.id,
            width: "120px",
            cell: (row: LegislatorVote) => (
                <a
                    className="noTextDecoration"
                    href={`/bills/${row.bill.sessionId}/${row.bill.id}`}
                >
                    <Badge type="billId" value={row.bill.id}></Badge>
                </a>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "shortTitle",
            name: "Title",
            selector: (row: LegislatorVote) => row.bill.shortTitle,
            width: "170px",
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "vote",
            name: "Vote",
            selector: (row: LegislatorVote) => row.vote,
            width: "120px",
            cell: (row: LegislatorVote) => (
                <Badge
                    type="vote"
                    value={row.vote}
                    onClick={(value) =>
                        filterBadgeClick("vote", value.toLowerCase())
                    }
                />
            ),
            filterConfig: {
                type: FilterType.Select,
                options: ["Yes", "No", "Absent"],
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "passed",
            name: "Passed",
            selector: (row: LegislatorVote) =>
                row.bill.passed ? "passed" : "false",
            width: "120px",
            cell: (row: LegislatorVote) => (
                <Badge
                    type="passed"
                    value={row.bill.passed}
                    onClick={(value) =>
                        filterBadgeClick("passed", value.toLowerCase())
                    }
                />
            ),
            filterConfig: {
                type: FilterType.Select,
                options: ["PASSED", "FAILED"],
            },
        }),
        // createDataTableColumn<LegislatorVote>({
        //     id: "summary",
        //     name: "Summary",
        //     selector: (row: LegislatorVote) => row.bill.summary.oneSentence,
        //     sortable: true,
        //     grow: 2,
        //     minWidth: "300px",
        //     wrap: true,
        //     filterConfig: {
        //         type: FilterType.Text,
        //     },
        // }),
        createDataTableColumn<LegislatorVote>({
            id: "summary",
            name: "Summary",
            selector: (row: LegislatorVote) =>
                row.bill?.summary?.oneSentence ?? "",
            grow: 2,
            minWidth: "250px",
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        // createDataTableColumn<LegislatorVote>({
        //     id: "generalProvisions",
        //     name: "General Provisions",
        //     selector: (row: LegislatorVote) => row.bill.generalProvisions,
        //     grow: 1,
        //     minWidth: "250px",
        //     filterConfig: {
        //         type: FilterType.Text,
        //     },
        // }),
        // createDataTableColumn<LegislatorVote>({
        //     id: "highlightedProvisions",
        //     name: "Highlighted Provisions",
        //     selector: (row: LegislatorVote) => row.bill.highlightedProvisions,
        //     grow: 2,
        //     minWidth: "350px",
        //     cell: (row: LegislatorVote) => (
        //         <CollapsibleCell text={row.bill.highlightedProvisions} />
        //     ),
        //     filterConfig: {
        //         type: FilterType.Text,
        //     },
        // }),
        createDataTableColumn<LegislatorVote>({
            id: "year",
            name: "Year",
            selector: (row: LegislatorVote) => row.bill.year,
            width: "0px",
            filterConfig: {
                type: FilterType.Number,
            },
        }),

        createDataTableColumn<LegislatorVote>({
            id: "subjects",
            name: "Subjects",
            selector: (row: LegislatorVote) => row.bill.subjects,
            minWidth: "250px",
            grow: 1,
            cell: (row: LegislatorVote) => (
                <CollapsibleCell
                    items={row.bill.subjects}
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

const AnalysisDetailsPage = () => {
    const [legislatorDetails, setLegislatorDetails] = useState<Legislator>();
    const [legislatorPolicyScores, setlegislatorPolicyScores] = useState<
        LegislatorPolicyScore[]
    >([]);
    const [legislatorVotes, setLegislatorVotes] = useState<LegislatorVote[]>(
        [],
    );

    // let legislatorId = "ARTHUJ";
    let { legislatorId, year, policyTopic, policyDirection } =
        useParams<string>();
    if (!legislatorId) {
        legislatorId = "";
    }
    if (!year) {
        year = "";
    }
    if (!policyTopic) {
        policyTopic = "";
    }
    if (!policyDirection) {
        policyDirection = "";
    }

    useEffect(() => {
        const fetchLegislatorInformation = async () => {
            try {
                const detailsResponse =
                    await getLegislatorDetails(legislatorId);
                setLegislatorDetails(detailsResponse);
            } catch (error) {
                console.log(error);
            }
        };

        const loadLegislatorPolicyAnalysis = async () => {
            try {
                const policyScores = await getLegislatorAnalysisByYear(
                    legislatorId,
                    "2026",
                );
                setlegislatorPolicyScores(policyScores);
            } catch (error) {
                console.log(error);
            }
        };

        const fetchVoteInformation = async () => {
            try {
                const response =
                    await getLegislatorPolicyDirectionAnalysisByYear(
                        legislatorId,
                        year,
                        policyTopic,
                        policyDirection,
                    );
                setLegislatorVotes(response);
            } catch (error) {
                console.log(error);
            }
        };

        fetchLegislatorInformation();
        loadLegislatorPolicyAnalysis();
        fetchVoteInformation();
    }, []);

    return (
        <>
            <div className="page pageScroll">
                {/* Legislator Details Container*/}
                <div className="verticalStack largeGap defaultPadding">
                    <div className="section outline">
                        <div className="filledHeader">Analysis Details</div>
                        <div className="defaultPadding">
                            <div className="defaultPadding horizontalRow defaultGap">
                                <PropertyGroup
                                    title="Legislator"
                                    value={legislatorDetails?.formatName}
                                ></PropertyGroup>
                                <PropertyGroup
                                    title="Year"
                                    value={year}
                                ></PropertyGroup>
                                <PropertyGroup
                                    title="Policy Topic"
                                    value={policyTopic}
                                ></PropertyGroup>
                                <PropertyGroup
                                    title="Policy Direction"
                                    value={policyDirection}
                                ></PropertyGroup>
                            </div>

                            {/* {legislatorPolicyScores.map((item) => (
                                <div className="horizontalRow defaultGap">
                                    <div>{item.policyDirection}</div>
                                    <div>{item.score}</div>
                                </div>
                            ))} */}
                            {/* {policyTopics.map((item) => (
                                <>
                                    <div className="bold">{item.topic}</div>
                                    <ul>
                                        {item.policyDirections.map((x) => (
                                            <li>{x}</li>
                                        ))}
                                    </ul>
                                </>
                            ))} */}
                            <div className="defaultPadding height800">
                                {
                                    <GeneralTable
                                        columns={(helpers) =>
                                            createAnalysisDetailsColumns(
                                                helpers,
                                            )
                                        }
                                        data={legislatorVotes}
                                        defaultSortId="sessionId"
                                        defaultSortAscending={false}
                                    />
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AnalysisDetailsPage;
