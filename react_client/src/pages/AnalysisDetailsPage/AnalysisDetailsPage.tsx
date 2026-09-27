import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getLegislatorDetails } from "../../services/legislatorService";
import {
    getLegislatorAnalysisByYear,
    getLegislatorPolicyCoupleVotesByYear,
} from "../../services/analysisService";
import type { Legislator } from "../../models/Legislator";
import type { LegislatorVote } from "../../models/LegislatorVote";
import type { LegislatorCouplePolicyScore } from "../../models/LegislatorCouplePolicyScore";
import { normalizeSessionId } from "../../models/Bill";
import { VoteValue } from "../../models/Vote";
import { createDataTableColumn } from "../../models/DataTableUtils";
import {
    formatPolicyName,
    shortenDirectionPair,
} from "../../utils/stringFormat";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import Badge from "../../components/Badge/Badge";
import BillCell from "../../components/BillCell/BillCell";
import {
    billCellSearchText,
    policyChipSearchText,
} from "../../utils/searchText";
import PolicyChip from "../../components/PolicyChip/PolicyChip";
import PolicyScoreBar from "../../components/PolicyScoreBar/PolicyScoreBar";
import { StatCards } from "../../components/PageHeader/PageHeader";

import style from "./AnalysisDetailsPage.module.css";

type PolicySide = "left" | "right";

//Yes on a bill pushes the score toward that bill's side, No pushes it toward the other side, Absent is not scored
function getVoteEffect(vote: VoteValue, billSide: PolicySide) {
    if (vote === VoteValue.Absent) return null;
    if (vote === VoteValue.Yes) return billSide;
    return billSide === "left" ? "right" : "left";
}

//the side of the couple a bill is on, from its policy direction
function getBillSide(
    vote: LegislatorVote,
    couple: LegislatorCouplePolicyScore,
): PolicySide | null {
    const direction = vote.bill.policies[0]?.policyDirection;
    if (direction === couple.leftPolicyDirection) return "left";
    if (direction === couple.rightPolicyDirection) return "right";
    return null;
}

//Create all columns for VOTE TABLE
function createAnalysisDetailsColumns(
    sideLabels: Record<PolicySide, string>,
    billSide: PolicySide,
) {
    const effectLabel = (vote: VoteValue) => {
        const effect = getVoteEffect(vote, billSide);
        if (!effect) return "Not scored";
        return `${effect === "left" ? "←" : "→"} Toward ${sideLabels[effect]}`;
    };

    return [
        createDataTableColumn<LegislatorVote>({
            id: "bill",
            name: "Bill",
            selector: (row: LegislatorVote) =>
                row.bill.id + row.bill.shortTitle,
            searchText: (row: LegislatorVote) => billCellSearchText(row.bill),
            width: "260px",
            cell: (row: LegislatorVote) => (
                <BillCell
                    id={row.bill.id}
                    sessionId={row.bill.sessionId}
                    shortTitle={row.bill.shortTitle}
                />
            ),
        }),
        createDataTableColumn<LegislatorVote>({
            id: "vote",
            name: "Vote",
            selector: (row: LegislatorVote) => row.vote,
            width: "150px",
            cell: (row: LegislatorVote) => (
                <Badge type="vote" value={row.vote} />
            ),
        }),
        createDataTableColumn<LegislatorVote>({
            id: "effect",
            name: "Effect on Score",
            selector: (row: LegislatorVote) => effectLabel(row.vote),
            width: "200px",
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
        }),
        createDataTableColumn<LegislatorVote>({
            id: "policy",
            name: "Policy Weight",
            selector: (row: LegislatorVote) =>
                row.bill.policies[0]?.impactLevel ?? "",
            searchText: (row: LegislatorVote) =>
                row.bill.policies[0]
                    ? policyChipSearchText(row.bill.policies[0])
                    : [],
            width: "250px",
            cell: (row: LegislatorVote) =>
                row.bill.policies[0] ? (
                    <PolicyChip policy={row.bill.policies[0]} />
                ) : null,
        }),
        createDataTableColumn<LegislatorVote>({
            id: "passed",
            name: "Passed",
            selector: (row: LegislatorVote) =>
                row.bill.passed ? "passed" : "failed",
            width: "120px",
            cell: (row: LegislatorVote) => (
                <Badge type="passed" value={row.bill.passed} />
            ),
        }),
        createDataTableColumn<LegislatorVote>({
            id: "summary",
            name: "Summary",
            selector: (row: LegislatorVote) =>
                row.bill?.summary?.oneSentence ?? "",
            grow: 2,
            minWidth: "260px",
        }),
        //hidden - kept so session stays sortable and available in the Filters panel
        createDataTableColumn<LegislatorVote>({
            id: "sessionId",
            name: "Session",
            selector: (row: LegislatorVote) =>
                normalizeSessionId(row.bill.sessionId),
            omit: true,
        }),
    ];
}

//One side of the policy couple - the bills classified in that direction and how the legislator voted on them
const PolicySideSection = ({
    side,
    couple,
    sideLabels,
    votes,
    periodLabel,
}: {
    side: PolicySide;
    couple: LegislatorCouplePolicyScore;
    sideLabels: Record<PolicySide, string>;
    votes: LegislatorVote[];
    //the year or session the score covers, ie "2025 Special Session 1"
    periodLabel: string;
}) => {
    const direction =
        side === "left"
            ? couple.leftPolicyDirection
            : couple.rightPolicyDirection;
    const otherSide: PolicySide = side === "left" ? "right" : "left";

    const sideVotes = votes.filter(
        (vote) => getBillSide(vote, couple) === side,
    );
    const countVotes = (value: VoteValue) =>
        sideVotes.filter((vote) => vote.vote === value).length;

    return (
        <section
            className={`${style.side} ${side === "left" ? style.side__left : style.side__right}`}
        >
            <div className={style.side__header}>
                <div>
                    <h2 className={style.side__title}>
                        {side === "left" ? "← " : ""}Bills that{" "}
                        {formatPolicyName(direction)}
                        {side === "right" ? " →" : ""}
                    </h2>
                    <p className={style.side__explainer}>
                        <strong>Yes</strong> moves the score toward{" "}
                        <strong>{sideLabels[side]}</strong>. <strong>No</strong>{" "}
                        moves it toward <strong>{sideLabels[otherSide]}</strong>
                        .
                    </p>
                </div>
                <div className={style.side__counts}>
                    <span className={style.side__billCount}>
                        {sideVotes.length}{" "}
                        {sideVotes.length === 1 ? "bill" : "bills"}
                    </span>
                    {[VoteValue.Yes, VoteValue.No, VoteValue.Absent].map(
                        (value) => (
                            <span key={value} className={style.side__tally}>
                                <Badge type="vote" value={value} />
                                {countVotes(value)}
                            </span>
                        ),
                    )}
                </div>
            </div>

            {sideVotes.length > 0 ? (
                <div className={style.side__table}>
                    <GeneralTable
                        columns={createAnalysisDetailsColumns(sideLabels, side)}
                        data={sideVotes}
                        defaultSortId="sessionId"
                        defaultSortAscending={false}
                    />
                </div>
            ) : (
                <p className={style.side__empty}>
                    No bills in {periodLabel} were classified as{" "}
                    {formatPolicyName(direction)}.
                </p>
            )}
        </section>
    );
};

const AnalysisDetailsPage = () => {
    const [legislatorDetails, setLegislatorDetails] = useState<Legislator>();
    const [policyCoupleScore, setPolicyCoupleScore] =
        useState<LegislatorCouplePolicyScore>();
    const [legislatorVotes, setLegislatorVotes] = useState<LegislatorVote[]>(
        [],
    );
    const [loading, setLoading] = useState(true);

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

    //optional ?session=2026GS - the score and bills for one session instead of the whole year
    const [searchParams] = useSearchParams();
    const session = searchParams.get("session");
    //what the score covers, ie "2025" or "2025 Special Session 1"
    const periodLabel = session ? String(normalizeSessionId(session)) : year;

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [details, policyScores, votes] = await Promise.all([
                    getLegislatorDetails(legislatorId),
                    getLegislatorAnalysisByYear(legislatorId, year, session),
                    getLegislatorPolicyCoupleVotesByYear(
                        legislatorId,
                        year,
                        policyCoupleName,
                        session,
                    ),
                ]);
                setLegislatorDetails(details);
                setPolicyCoupleScore(
                    (policyScores as LegislatorCouplePolicyScore[]).find(
                        (x) => x.policyCoupleName === policyCoupleName,
                    ),
                );
                setLegislatorVotes(votes);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [legislatorId, year, policyCoupleName, session]);

    //back to the Policy Scores tab on the legislator's profile, on the same year and session
    const backLink = `/legislators/${legislatorId}?tab=scores&year=${year}${session ? `&session=${session}` : ""}`;

    if (loading || !policyCoupleScore) {
        return (
            <div className={`page pageScroll ${style.analysisDetails}`}>
                <div className={style.analysisDetails__content}>
                    <Link className={style.backLink} to={backLink}>
                        ← Policy scores
                    </Link>
                    <div className={style.message}>
                        {loading
                            ? "Loading..."
                            : "Couldn't find this policy score."}
                    </div>
                </div>
            </div>
        );
    }

    const [leftLabel, rightLabel] = shortenDirectionPair(
        policyCoupleScore.leftPolicyDirection,
        policyCoupleScore.rightPolicyDirection,
    );
    const sideLabels: Record<PolicySide, string> = {
        left: leftLabel,
        right: rightLabel,
    };

    //how many counted votes moved the score each way
    const effects = legislatorVotes.map((vote) => {
        const side = getBillSide(vote, policyCoupleScore);
        return side ? getVoteEffect(vote.vote, side) : null;
    });
    const towardLeft = effects.filter((effect) => effect === "left").length;
    const towardRight = effects.filter((effect) => effect === "right").length;
    const absentCount = legislatorVotes.filter(
        (vote) => vote.vote === VoteValue.Absent,
    ).length;

    const stats = [
        {
            label: "Votes Counted",
            value: String(policyCoupleScore.allIncludedVotes),
        },
        { label: `Toward ${leftLabel}`, value: String(towardLeft) },
        { label: `Toward ${rightLabel}`, value: String(towardRight) },
        { label: "Absent", value: String(absentCount) },
    ];

    return (
        <div className={`page pageScroll ${style.analysisDetails}`}>
            <div className={style.analysisDetails__content}>
                <Link className={style.backLink} to={backLink}>
                    ← {legislatorDetails?.formatName ?? "Legislator"}'s policy
                    scores
                </Link>

                {/* Overview */}
                <section className={style.hero}>
                    <span className={style.hero__eyebrow}>
                        {formatPolicyName(policyCoupleScore.policyTopic)} ·{" "}
                        {periodLabel}
                    </span>
                    <h1 className={style.hero__title}>
                        {policyCoupleScore.policyNameLabel}
                    </h1>

                    {legislatorDetails && (
                        <Link
                            className={style.legislator}
                            to={`/legislators/${legislatorDetails.id}`}
                        >
                            <img
                                className={style.legislator__photo}
                                src={legislatorDetails.image}
                                alt=""
                            />
                            <span className={style.legislator__name}>
                                {legislatorDetails.formatName}
                            </span>
                            <span className={style.legislator__meta}>
                                {legislatorDetails.house} · District{" "}
                                {legislatorDetails.district}
                            </span>
                            <Badge
                                type="party"
                                value={legislatorDetails.party}
                            />
                        </Link>
                    )}

                    <div className={style.hero__score}>
                        <PolicyScoreBar
                            score={Number(policyCoupleScore.score)}
                            leftLabel={formatPolicyName(
                                policyCoupleScore.leftPolicyDirection,
                            )}
                            rightLabel={formatPolicyName(
                                policyCoupleScore.rightPolicyDirection,
                            )}
                        />
                    </div>

                    <StatCards stats={stats} />

                    <p className={style.hero__note}>
                        Higher-impact bills, and bills where this policy is the
                        main focus, count more toward the score. Absent votes
                        are listed below but not counted.
                    </p>
                </section>

                <PolicySideSection
                    side="left"
                    couple={policyCoupleScore}
                    sideLabels={sideLabels}
                    votes={legislatorVotes}
                    periodLabel={periodLabel}
                />
                <PolicySideSection
                    side="right"
                    couple={policyCoupleScore}
                    sideLabels={sideLabels}
                    votes={legislatorVotes}
                    periodLabel={periodLabel}
                />
            </div>
        </div>
    );
};

export default AnalysisDetailsPage;
