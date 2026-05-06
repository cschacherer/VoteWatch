import { useState, useEffect } from "react";
import {
    getLegislatorDetails,
    getLegislatorVotes,
    getLegislatorSponsoredBills,
    getLegislatorAnalysisByYear,
} from "../../services/legislatorService";
import type { Legislator } from "../../models/Legislator";
import type { LegislatorVote } from "../../models/LegislatorVote";
import { Container, Col, Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";
import Badge from "../../components/Badge/Badge";
import PropertyGroup from "../../components/PropertyGroup/PropertyGroup";
import { type Bill, normalizeSessionId } from "../../models/Bill";
import ExpandableSection from "../../components/ExpandableSection/ExpandableSection";

import downIcon from "../../assets/icon_expand_down.svg";
import rightIcon from "../../assets/icon_expand_right.svg";
import { type PolicyTopic, createPolicyTopics } from "../../models/PolicyTopic";
import {
    type LegislatorPolicyScore,
    createLegislatorPolicyScore,
} from "../../models/LegislatorPolicyScore";

//Create all columns for SPONSORED BILLS TABLE
function createLegislatorPolicyScoreColumns({
    filterBadgeClick,
}: {
    filterBadgeClick: (key: string, value: string) => void;
}) {
    return [
        createDataTableColumn<LegislatorPolicyScore>({
            id: "policyTopic",
            name: "Policy Topic",
            selector: (row: LegislatorPolicyScore) => row.policyTopic,
            cell: (row) => (
                <Badge
                    type="basic"
                    value={row.policyTopic}
                    onClick={(value) => filterBadgeClick("policyTopic", value)}
                ></Badge>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorPolicyScore>({
            id: "policyDirection",
            name: "Policy Direction",
            selector: (row: LegislatorPolicyScore) => row.policyDirection,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorPolicyScore>({
            id: "score",
            name: "Score",
            selector: (row: LegislatorPolicyScore) => row.score,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorPolicyScore>({
            id: "totalVotes",
            name: "Total Yes Votes",
            selector: (row: LegislatorPolicyScore) =>
                `${row.yesVotes} out of ${row.includedVotes}`,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorPolicyScore>({
            id: "absentPercentage",
            name: "Absent for Vote",
            selector: (row: LegislatorPolicyScore) => `${row.absentPercentage}`,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorPolicyScore>({
            id: "seeBills",
            name: "See Bills",
            selector: (row: LegislatorPolicyScore) => `${row.absentPercentage}`,
            cell: (row) => (
                <a
                    className="link"
                    href={`/analysis/${row.legislatorId}/${row.year}/${row.policyTopic}/${row.policyDirection}`}
                >
                    See Bills
                </a>
                // <Badge
                //     type="basic"
                //     value={row.policyTopic}
                //     onClick={(value) => filterBadgeClick("policyTopic", value)}
                // ></Badge>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
    ];
}

const AnalysisPage = () => {
    const [legislatorDetails, setLegislatorDetails] = useState<Legislator>();
    const [legislatorPolicyScores, setlegislatorPolicyScores] = useState<
        LegislatorPolicyScore[]
    >([]);

    const [policyTopics, setPolicyTopics] = useState<PolicyTopic[]>([]);

    let legislatorId = "ARTHUJ";
    // let { legislatorId } = useParams<string>();
    // if (!legislatorId) {
    //     legislatorId = "";
    // }

    useEffect(() => {
        const fetchInformation = async () => {
            try {
                const detailsResponse =
                    await getLegislatorDetails(legislatorId);
                setLegislatorDetails(detailsResponse);
            } catch (error) {
                console.log(error);
            }

            const x = createPolicyTopics();
            setPolicyTopics(x);
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

        fetchInformation();
        loadLegislatorPolicyAnalysis();
    }, []);

    return (
        <>
            <div className="page pageScroll">
                {/* Legislator Details Container*/}
                <div className="verticalStack largeGap defaultPadding">
                    <div className="section outline">
                        <div className="filledHeader">Analysis</div>
                        <div className="defaultPadding">
                            <div>{legislatorDetails?.formatName}</div>
                            <div>2026</div>
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
                                            createLegislatorPolicyScoreColumns(
                                                helpers,
                                            )
                                        }
                                        data={legislatorPolicyScores}
                                        defaultSortId="policyTopic"
                                        defaultSortAscending={false}
                                    />
                                }
                            </div>
                            <PropertyGroup
                                title="Policy Topic"
                                value="placeholder"
                            ></PropertyGroup>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AnalysisPage;
