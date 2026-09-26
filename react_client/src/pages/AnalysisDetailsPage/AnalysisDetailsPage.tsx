import { useState, useEffect } from "react";
import { getLegislatorDetails } from "../../services/legislatorService";
import type { Legislator } from "../../models/Legislator";
import type { LegislatorVote } from "../../models/LegislatorVote";
import { useParams } from "react-router-dom";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";
import Badge from "../../components/Badge/Badge";
import PropertyGroup from "../../components/PropertyGroup/PropertyGroup";
import { normalizeSessionId } from "../../models/Bill";
import { VoteValue } from "../../models/Vote";
import type { LegislatorCouplePolicyScore } from "../../models/LegislatorCouplePolicyScore";
import {
    getLegislatorAnalysisByYear,
    getLegislatorPolicyCoupleVotesByYear,
} from "../../services/analysisService";
import { ScoreSlider } from "../../components/ScoreSlider/ScoreSlider";
import { formatPolicyName } from "../../utils/stringFormat";
import style from "./AnalysisDetailsPage.module.css";

type PolicySide = "left" | "right";

//Yes on a bill pushes the score toward that bill's side, No pushes it toward the other side, Absent is not scored
function getVoteEffect(vote: VoteValue, billSide: PolicySide) {
    if (vote === VoteValue.Absent) return null;
    if (vote === VoteValue.Yes) return billSide;
    return billSide === "left" ? "right" : "left";
}

//Create all columns for VOTE TABLE
function createAnalysisDetailsColumns(
    {
        filterBadgeClick,
    }: {
        filterBadgeClick: (key: string, value: string) => void;
    },
    policyCoupleScore: LegislatorCouplePolicyScore | undefined,
    billSide: PolicySide,
) {
    const effectLabel = (vote: VoteValue) => {
        const effect = getVoteEffect(vote, billSide);
        if (!effect || !policyCoupleScore) return "Not scored";
        const direction =
            effect === "left"
                ? policyCoupleScore.leftPolicyDirection
                : policyCoupleScore.rightPolicyDirection;
        return `${effect === "left" ? "←" : "→"} Toward ${formatPolicyName(direction)}`;
    };

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
            id: "effect",
            name: "Effect on Score",
            selector: (row: LegislatorVote) => effectLabel(row.vote),
            width: "260px",
            cell: (row: LegislatorVote) => {
                const effect = getVoteEffect(row.vote, billSide);
                const effectStyle = effect
                    ? effect === "left"
                        ? style.effect__left
                        : style.effect__right
                    : style.effect__none;
                return (
                    <span className={`${style.effect} ${effectStyle}`}>
                        {effectLabel(row.vote)}
                    </span>
                );
            },
            filterConfig: {
                type: FilterType.Text,
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
            id: "policy",
            name: "Policies",
            selector: (row: LegislatorVote) => row.bill.policies,
            minWidth: "250px",
            grow: 1,
            cell: (row: LegislatorVote) => {
                return (
                    <div>
                        {row.bill.policies.map((policy) => {
                            return (
                                <div>
                                    {/* <div>
                                        <strong>Policy Topic:</strong>{" "}
                                        {policy.policyTopic}
                                    </div>
                                    <div>
                                        <strong>Policy Direction:</strong>{" "}
                                        {policy.policyDirection}
                                    </div> */}
                                    <div>
                                        <strong>Policy Topic Strength:</strong>{" "}
                                        {policy.policyTopicStrength}
                                    </div>
                                    <div>
                                        <strong>Impact Level:</strong>{" "}
                                        {policy.impactLevel}
                                    </div>
                                    <div>
                                        <strong>AI Confidence:</strong>{" "}
                                        {policy.confidence}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            },
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        // createDataTableColumn<LegislatorVote>({
        //     id: "subjects",
        //     name: "Subjects",
        //     selector: (row: LegislatorVote) => row.bill.subjects,
        //     minWidth: "250px",
        //     grow: 1,
        //     cell: (row: LegislatorVote) => (
        //         <CollapsibleCell
        //             items={row.bill.subjects}
        //             onBadgeClick={(value) =>
        //                 filterBadgeClick("subjects", value)
        //             }
        //         />
        //     ),
        //     filterConfig: {
        //         type: FilterType.Text,
        //     },
        // }),
    ];
}

//One side of the policy couple - the bills classified in that direction and how the legislator voted on them
const PolicySideSection = ({
    side,
    policyCoupleScore,
    votes,
}: {
    side: PolicySide;
    policyCoupleScore: LegislatorCouplePolicyScore;
    votes: LegislatorVote[];
}) => {
    const direction =
        side === "left"
            ? policyCoupleScore.leftPolicyDirection
            : policyCoupleScore.rightPolicyDirection;
    const otherDirection =
        side === "left"
            ? policyCoupleScore.rightPolicyDirection
            : policyCoupleScore.leftPolicyDirection;

    const sideVotes = votes.filter(
        (x) => x.bill.policies[0]?.policyDirection === direction,
    );
    const countVotes = (vote: VoteValue) =>
        sideVotes.filter((x) => x.vote === vote).length;

    return (
        <div
            className={`${style.side} ${side === "left" ? style.side__left : style.side__right}`}
        >
            <div className={style.side__title}>
                {side === "left" ? "← " : ""}Bills that{" "}
                {formatPolicyName(direction)}
                {side === "right" ? " →" : ""}
            </div>
            <div>
                A <strong>Yes</strong> vote on these bills moves the score
                toward <strong>{formatPolicyName(direction)}</strong>. A{" "}
                <strong>No</strong> vote moves it toward{" "}
                <strong>{formatPolicyName(otherDirection)}</strong>.
            </div>
            <div className={style.side__counts}>
                <span>
                    <strong>Bills:</strong> {sideVotes.length}
                </span>
                {[VoteValue.Yes, VoteValue.No, VoteValue.Absent].map(
                    (vote) => (
                        <span
                            key={vote}
                            className="horizontalRow smallGap centerVertically"
                        >
                            <Badge type="vote" value={vote} />
                            {countVotes(vote)}
                        </span>
                    ),
                )}
            </div>
            {sideVotes.length > 0 ? (
                <GeneralTable
                    columns={(helpers) =>
                        createAnalysisDetailsColumns(
                            helpers,
                            policyCoupleScore,
                            side,
                        )
                    }
                    data={sideVotes}
                    defaultSortId="sessionId"
                    defaultSortAscending={false}
                />
            ) : (
                <div className={style.effect__none}>
                    No bills in {policyCoupleScore.year} were classified as{" "}
                    {formatPolicyName(direction)}.
                </div>
            )}
        </div>
    );
};

const AnalysisDetailsPage = () => {
    const [legislatorDetails, setLegislatorDetails] = useState<Legislator>();
    const [policyCoupleScore, setPolicyCoupleScore] =
        useState<LegislatorCouplePolicyScore>();
    const [legislatorVotes, setLegislatorVotes] = useState<LegislatorVote[]>(
        [],
    );

    let { legislatorId, year, policyCoupleName } = useParams<string>();
    if (!legislatorId) {
        legislatorId = "";
    }
    if (!year) {
        year = "";
    }
    if (!policyCoupleName) {
        policyCoupleName = "";
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
                const policyScores: LegislatorCouplePolicyScore[] =
                    await getLegislatorAnalysisByYear(legislatorId, year);
                setPolicyCoupleScore(
                    policyScores.find(
                        (x) => x.policyCoupleName === policyCoupleName,
                    ),
                );
            } catch (error) {
                console.log(error);
            }
        };

        const fetchVoteInformation = async () => {
            try {
                const response = await getLegislatorPolicyCoupleVotesByYear(
                    legislatorId,
                    year,
                    policyCoupleName,
                );
                setLegislatorVotes(response);
            } catch (error) {
                console.log(error);
            }
        };

        fetchLegislatorInformation();
        loadLegislatorPolicyAnalysis();
        fetchVoteInformation();
    }, [legislatorId, year, policyCoupleName]);

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
                                    value={formatPolicyName(
                                        policyCoupleScore?.policyTopic ?? "",
                                    )}
                                ></PropertyGroup>
                                <PropertyGroup
                                    title="Policy"
                                    value={policyCoupleScore?.policyNameLabel}
                                ></PropertyGroup>
                                <PropertyGroup
                                    title="Votes Included"
                                    value={policyCoupleScore?.allIncludedVotes}
                                ></PropertyGroup>
                                <PropertyGroup
                                    title="Absent (Not Scored)"
                                    value={
                                        legislatorVotes.filter(
                                            (x) => x.vote === VoteValue.Absent,
                                        ).length
                                    }
                                ></PropertyGroup>
                            </div>
                            {policyCoupleScore && (
                                <div className="defaultPadding horizontalRow centerHorizontally centerVertically largeFont largeGap">
                                    <span
                                        className={`${style.directionLabel} ${style.directionLabel__left}`}
                                    >
                                        ←{" "}
                                        {formatPolicyName(
                                            policyCoupleScore.leftPolicyDirection,
                                        )}
                                    </span>
                                    <ScoreSlider
                                        value={policyCoupleScore.score}
                                    />
                                    <span
                                        className={`${style.directionLabel} ${style.directionLabel__right}`}
                                    >
                                        {formatPolicyName(
                                            policyCoupleScore.rightPolicyDirection,
                                        )}{" "}
                                        →
                                    </span>
                                </div>
                            )}

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
                            {policyCoupleScore && (
                                <div className="defaultPadding verticalStack largeGap">
                                    <PolicySideSection
                                        side="left"
                                        policyCoupleScore={policyCoupleScore}
                                        votes={legislatorVotes}
                                    />
                                    <PolicySideSection
                                        side="right"
                                        policyCoupleScore={policyCoupleScore}
                                        votes={legislatorVotes}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AnalysisDetailsPage;
