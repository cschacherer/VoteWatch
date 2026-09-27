import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getPolicyCoupleOutcome } from "../../services/analysisService";
import type { PolicyCoupleOutcome } from "../../models/LegislatureOverview";
import { type Bill, normalizeSessionId } from "../../models/Bill";
import {
    FilterType,
    createDataTableColumn,
    formatDate,
} from "../../models/DataTableUtils";
import {
    formatPolicyName,
    shortenDirectionPair,
} from "../../utils/stringFormat";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import BillCell from "../../components/BillCell/BillCell";
import PolicyChip from "../../components/PolicyChip/PolicyChip";
import PolicyScoreBar from "../../components/PolicyScoreBar/PolicyScoreBar";
import { StatCards } from "../../components/PageHeader/PageHeader";

import style from "./OutcomeDetailsPage.module.css";

type PolicySide = "left" | "right";

//Create all columns for the PASSED BILLS TABLE
function createOutcomeColumns() {
    return [
        createDataTableColumn<Bill>({
            id: "bill",
            name: "Bill",
            selector: (row: Bill) => row.id + row.shortTitle,
            width: "280px",
            cell: (row: Bill) => (
                <BillCell
                    id={row.id}
                    sessionId={row.sessionId}
                    shortTitle={row.shortTitle}
                />
            ),
            filterConfig: { type: FilterType.Text },
        }),
        createDataTableColumn<Bill>({
            id: "policy",
            name: "Policy Weight",
            selector: (row: Bill) => row.policies[0]?.impactLevel ?? "",
            width: "260px",
            cell: (row: Bill) =>
                row.policies[0] ? (
                    <PolicyChip policy={row.policies[0]} />
                ) : null,
            filterConfig: { type: FilterType.Text },
        }),
        createDataTableColumn<Bill>({
            id: "datePassed",
            name: "Passed",
            selector: (row: Bill) => row.datePassed,
            width: "130px",
            cell: (row: Bill) => formatDate(row.datePassed),
            filterConfig: { type: FilterType.Text },
        }),
        createDataTableColumn<Bill>({
            id: "summary",
            name: "Summary",
            selector: (row: Bill) => row.summary?.oneSentence ?? "",
            grow: 2,
            minWidth: "300px",
            filterConfig: { type: FilterType.Text },
        }),
        //hidden - kept so session stays sortable and available in the Filters panel
        createDataTableColumn<Bill>({
            id: "sessionId",
            name: "Session",
            selector: (row: Bill) => normalizeSessionId(row.sessionId),
            omit: true,
            filterConfig: { type: FilterType.Text },
        }),
    ];
}

//the passed bills on one side of the couple
const OutcomeSideSection = ({
    side,
    direction,
    sideLabel,
    bills,
    year,
}: {
    side: PolicySide;
    direction: string;
    sideLabel: string;
    bills: Bill[];
    year: string;
}) => (
    <section
        className={`${style.side} ${side === "left" ? style.side__left : style.side__right}`}
    >
        <div className={style.side__header}>
            <div>
                <h2 className={style.side__title}>
                    {side === "left" ? "← " : ""}Passed bills that{" "}
                    {formatPolicyName(direction)}
                    {side === "right" ? " →" : ""}
                </h2>
                <p className={style.side__explainer}>
                    Each of these moves the score toward{" "}
                    <strong>{sideLabel}</strong>.
                </p>
            </div>
            <span className={style.side__count}>
                {bills.length} {bills.length === 1 ? "bill" : "bills"}
            </span>
        </div>

        {bills.length > 0 ? (
            <div className={style.side__table}>
                <GeneralTable
                    columns={() => createOutcomeColumns()}
                    data={bills}
                    defaultSortId="sessionId"
                    defaultSortAscending={false}
                />
            </div>
        ) : (
            <p className={style.side__empty}>
                No bills that {formatPolicyName(direction)} passed in {year}.
            </p>
        )}
    </section>
);

const OutcomeDetailsPage = () => {
    const [outcome, setOutcome] = useState<PolicyCoupleOutcome>();
    const [loading, setLoading] = useState(true);

    let { year, policyCoupleName } = useParams<string>();
    if (!year) year = "";
    if (!policyCoupleName) policyCoupleName = "";

    useEffect(() => {
        const fetchOutcome = async () => {
            setLoading(true);
            try {
                setOutcome(
                    await getPolicyCoupleOutcome(year, policyCoupleName),
                );
            } catch (error) {
                console.log(error);
                setOutcome(undefined);
            } finally {
                setLoading(false);
            }
        };

        fetchOutcome();
    }, [year, policyCoupleName]);

    const backLink = `/analysis?year=${year}`;

    if (loading || !outcome) {
        return (
            <div className={`page pageScroll ${style.outcomeDetails}`}>
                <div className={style.outcomeDetails__content}>
                    <Link className={style.backLink} to={backLink}>
                        ← Legislature Trends
                    </Link>
                    <div className={style.message}>
                        {loading ? "Loading..." : "Couldn't find this policy."}
                    </div>
                </div>
            </div>
        );
    }

    const [leftLabel, rightLabel] = shortenDirectionPair(
        outcome.leftPolicyDirection,
        outcome.rightPolicyDirection,
    );
    const sideBills = (direction: string) =>
        outcome.bills.filter(
            (bill) => bill.policies[0]?.policyDirection === direction,
        );
    const leftBills = sideBills(outcome.leftPolicyDirection);
    const rightBills = sideBills(outcome.rightPolicyDirection);

    const stats = [
        { label: "Bills Counted", value: String(outcome.bills.length) },
        { label: `Toward ${leftLabel}`, value: String(leftBills.length) },
        { label: `Toward ${rightLabel}`, value: String(rightBills.length) },
    ];

    return (
        <div className={`page pageScroll ${style.outcomeDetails}`}>
            <div className={style.outcomeDetails__content}>
                <Link className={style.backLink} to={backLink}>
                    ← Legislature Trends
                </Link>

                {/* Overview */}
                <section className={style.hero}>
                    <span className={style.hero__eyebrow}>
                        {formatPolicyName(outcome.policyTopic)} · {year} · Whole
                        Legislature
                    </span>
                    <h1 className={style.hero__title}>
                        {outcome.policyNameLabel}
                    </h1>

                    <div className={style.hero__score}>
                        {outcome.outcomeScore === null ? (
                            <p className={style.hero__note}>
                                No bills on this policy passed in {year}.
                            </p>
                        ) : (
                            <PolicyScoreBar
                                score={outcome.outcomeScore}
                                leftLabel={formatPolicyName(
                                    outcome.leftPolicyDirection,
                                )}
                                rightLabel={formatPolicyName(
                                    outcome.rightPolicyDirection,
                                )}
                            />
                        )}
                    </div>

                    <StatCards stats={stats} />

                    <p className={style.hero__note}>
                        The score is based on the bills below — every {year}{" "}
                        bill on this policy that passed. Each counts toward its
                        own direction, and higher-impact bills, and bills where
                        this policy is the main focus, count more. Bills are
                        sorted into policies by AI.
                    </p>
                </section>

                <OutcomeSideSection
                    side="left"
                    direction={outcome.leftPolicyDirection}
                    sideLabel={leftLabel}
                    bills={leftBills}
                    year={year}
                />
                <OutcomeSideSection
                    side="right"
                    direction={outcome.rightPolicyDirection}
                    sideLabel={rightLabel}
                    bills={rightBills}
                    year={year}
                />
            </div>
        </div>
    );
};

export default OutcomeDetailsPage;
