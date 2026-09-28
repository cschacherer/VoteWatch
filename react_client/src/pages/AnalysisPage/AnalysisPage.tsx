import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    getAnalysisYears,
    getLegislatureOverview,
    getPolicyOutcomes,
} from "../../services/analysisService";
import type {
    AnalysisYear,
    LegislatureOverview,
    LegislatorCoupleScore,
    LegislatorParticipation,
    TopicOutcome,
} from "../../models/LegislatureOverview";
import { normalizeSessionId } from "../../models/Bill";
import { createDataTableColumn } from "../../models/DataTableUtils";
import { formatPolicyName } from "../../utils/stringFormat";
import Badge from "../../components/Badge/Badge";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import PageHeader from "../../components/PageHeader/PageHeader";
import PillTabs from "../../components/PillTabs/PillTabs";
import FilterCard, { FilterRow } from "../../components/FilterCard/FilterCard";
import ChipSelect from "../../components/ChipSelect/ChipSelect";
import FilterChip from "../../components/FilterChip/FilterChip";
import ToggleSwitch from "../../components/ToggleSwitch/ToggleSwitch";
import PolicyOutcomeCard from "../../components/PolicyOutcomeCard/PolicyOutcomeCard";
import PolicySpectrum from "../../components/PolicySpectrum/PolicySpectrum";
import { median, partyMedians } from "../../utils/partyMedians";

import style from "./AnalysisPage.module.css";

type SortOrder = "gap" | "agreement" | "az";

//policies scored for fewer legislators than this are left out - too few votes to show a trend
const MIN_LEGISLATORS_PER_POLICY = 10;
//policies where the typical legislator's score rests on fewer votes than this are hidden by default -
//with only 1-2 votes almost every score is exactly 0 or 100, which reads as a bigger split than it is
const MIN_MEDIAN_VOTES = 5;

const percent = (part: number, total: number) =>
    total ? Math.round((part / total) * 100) : 0;

//Create all columns for PARTICIPATION TABLE
function createParticipationColumns() {
    return [
        createDataTableColumn<LegislatorParticipation>({
            id: "name",
            name: "Legislator",
            selector: (row) => row.fullName,
            //the cell shows the name plus the chamber and district
            searchText: (row) => [
                row.formatName,
                row.fullName,
                `${row.house} · District ${row.district}`,
            ],
            minWidth: "260px",
            grow: 1.5,
            cell: (row) => (
                <Link
                    className={style.nameCell}
                    to={`/legislators/${row.legislatorId}`}
                >
                    <img
                        className={style.nameCell__photo}
                        src={row.image}
                        alt=""
                    />
                    <div>
                        <div className={style.nameCell__name}>
                            {row.formatName}
                        </div>
                        <div className={style.nameCell__district}>
                            {`${row.house} · District ${row.district}`}
                        </div>
                    </div>
                </Link>
            ),
        }),
        createDataTableColumn<LegislatorParticipation>({
            id: "party",
            name: "Party",
            selector: (row) => row.party,
            width: "170px",
            cell: (row) => <Badge type="party" value={row.party} />,
        }),
        createDataTableColumn<LegislatorParticipation>({
            id: "votesCast",
            name: "Votes Cast",
            selector: (row) => row.yesVotes + row.noVotes,
            width: "140px",
        }),
        createDataTableColumn<LegislatorParticipation>({
            id: "yesPercent",
            name: "Voted Yes",
            selector: (row) =>
                percent(row.yesVotes, row.yesVotes + row.noVotes),
            width: "140px",
            cell: (row) =>
                `${percent(row.yesVotes, row.yesVotes + row.noVotes)}%`,
        }),
        createDataTableColumn<LegislatorParticipation>({
            id: "absentVotes",
            name: "Missed Votes",
            selector: (row) => row.absentVotes,
            width: "150px",
        }),
        createDataTableColumn<LegislatorParticipation>({
            id: "absentPercent",
            name: "Missed %",
            selector: (row) =>
                percent(
                    row.absentVotes,
                    row.yesVotes + row.noVotes + row.absentVotes,
                ),
            minWidth: "180px",
            cell: (row) => {
                const value = percent(
                    row.absentVotes,
                    row.yesVotes + row.noVotes + row.absentVotes,
                );
                return (
                    <div className={style.meter}>
                        <div className={style.meter__track}>
                            <div
                                className={style.meter__fill}
                                style={{ width: `${value}%` }}
                            />
                        </div>
                        <span>{value}%</span>
                    </div>
                );
            },
        }),
    ];
}

type AnalysisTab = "passed" | "parties" | "participation";

const analysisTabs: { value: AnalysisTab; label: string }[] = [
    { value: "passed", label: "Legislature Trends" },
    { value: "parties", label: "Party Trends" },
    { value: "participation", label: "Participation" },
];

const AnalysisPage = () => {
    //the tab, year, and session live in the URL (?tab=parties&year=2026) so the page can be linked to
    //and bookmarked
    const [searchParams, setSearchParams] = useSearchParams();
    const yearParam = searchParams.get("year");
    const tabParam = searchParams.get("tab") as AnalysisTab | null;
    const tab: AnalysisTab =
        tabParam && analysisTabs.some((t) => t.value === tabParam)
            ? tabParam
            : "passed";

    //an empty or null value removes that param
    const updateParams = (changes: Record<string, string | null>) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(changes).forEach(([key, value]) =>
            value ? next.set(key, value) : next.delete(key),
        );
        setSearchParams(next, { replace: true });
    };

    const [years, setYears] = useState<AnalysisYear[]>([]);
    const [overview, setOverview] = useState<LegislatureOverview>();
    const [loading, setLoading] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>("gap");
    const [includeFewVotes, setIncludeFewVotes] = useState(false);
    const [outcomeTopic, setOutcomeTopic] = useState<string | null>(null);
    //one session's outcomes - null means use the whole year's from the overview
    const [sessionOutcomes, setSessionOutcomes] = useState<
        TopicOutcome[] | null
    >(null);
    const [outcomesLoading, setOutcomesLoading] = useState(false);

    const selectedYear =
        yearParam && years.some((y) => y.year === yearParam)
            ? yearParam
            : years[0]?.year;
    const yearHasScores =
        years.find((y) => y.year === selectedYear)?.hasScores ?? false;

    //the session only narrows "What the legislature passed" - the rest of the page is the whole year
    const yearSessions =
        years.find((y) => y.year === selectedYear)?.sessions ?? [];
    const sessionParam = searchParams.get("session");
    const outcomeSession =
        sessionParam && yearSessions.includes(sessionParam)
            ? sessionParam
            : null;
    //what the outcomes cover, ie "2025" or "2025 Special Session 1"
    const outcomePeriodLabel = outcomeSession
        ? String(normalizeSessionId(outcomeSession))
        : selectedYear;

    //a new year clears the session, since the old one belongs to a different year
    const selectYear = (year: string) => {
        setSelectedTopic(null);
        setOutcomeTopic(null);
        updateParams({ year, session: null });
    };

    const selectOutcomeSession = (session: string | null) => {
        if (!selectedYear) return;
        setOutcomeTopic(null);
        updateParams({ year: selectedYear, session });
    };

    //"2025 Special Session 1" -> "Special Session 1" (the year is already picked above)
    const sessionLabel = (sessionId: string) =>
        String(normalizeSessionId(sessionId)).replace(/^\d{4}\s*/, "");

    useEffect(() => {
        const fetchYears = async () => {
            try {
                setYears(await getAnalysisYears());
            } catch (error) {
                console.log(error);
                setLoading(false);
            }
        };

        fetchYears();
    }, []);

    useEffect(() => {
        if (!selectedYear) return;

        const fetchOverview = async () => {
            setLoading(true);
            try {
                setOverview(await getLegislatureOverview(selectedYear));
            } catch (error) {
                console.log(error);
                setOverview(undefined);
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
    }, [selectedYear]);

    useEffect(() => {
        if (!selectedYear || !outcomeSession) {
            setSessionOutcomes(null);
            return;
        }

        //ignore a response for a session that's no longer selected
        let stale = false;
        const fetchSessionOutcomes = async () => {
            setOutcomesLoading(true);
            try {
                const outcomes = await getPolicyOutcomes(
                    selectedYear,
                    outcomeSession,
                );
                if (!stale) setSessionOutcomes(outcomes);
            } catch (error) {
                console.log(error);
                if (!stale) setSessionOutcomes([]);
            } finally {
                if (!stale) setOutcomesLoading(false);
            }
        };

        fetchSessionOutcomes();
        return () => {
            stale = true;
        };
    }, [selectedYear, outcomeSession]);

    //PARTICIPATION - the whole legislature, both chambers
    const participation = overview?.participation ?? [];
    const totalCast = participation.reduce(
        (sum, p) => sum + p.yesVotes + p.noVotes,
        0,
    );
    const totalAbsent = participation.reduce(
        (sum, p) => sum + p.absentVotes,
        0,
    );

    //POLICY SPECTRUMS - group every legislator's score by policy couple
    const couples = new Map<string, LegislatorCoupleScore[]>();
    for (const score of overview?.scores ?? []) {
        couples.set(score.policyCoupleName, [
            ...(couples.get(score.policyCoupleName) ?? []),
            score,
        ]);
    }
    const coupleSummaries = [...couples.values()]
        .filter((scores) => scores.length >= MIN_LEGISLATORS_PER_POLICY)
        .map((scores) => {
            const medians = partyMedians(scores);
            const gap =
                medians.size === 2
                    ? Math.abs(
                          (medians.get("Republican") ?? 0) -
                              (medians.get("Democrat") ?? 0),
                      )
                    : null;
            const medianVotes = median(scores.map((s) => s.includedVotes)) ?? 0;
            return { first: scores[0], scores, gap, medianVotes };
        })
        .filter(
            (couple) =>
                includeFewVotes || couple.medianVotes >= MIN_MEDIAN_VOTES,
        );
    const hiddenFewVoteCount =
        [...couples.values()].filter(
            (scores) => scores.length >= MIN_LEGISLATORS_PER_POLICY,
        ).length - coupleSummaries.length;

    const topicCounts = new Map<string, number>();
    for (const couple of coupleSummaries) {
        const topic = couple.first.policyTopic;
        topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
    const topicOptions = [...topicCounts.keys()].sort((a, b) =>
        a.localeCompare(b),
    );

    //policies without a party gap (one party has too few scored members) sort last
    const shownCouples = coupleSummaries
        .filter(
            (couple) =>
                !selectedTopic || couple.first.policyTopic === selectedTopic,
        )
        .sort((a, b) => {
            if (sortOrder === "az") {
                return a.first.policyNameLabel.localeCompare(
                    b.first.policyNameLabel,
                );
            }
            if (a.gap === null) return 1;
            if (b.gap === null) return -1;
            return sortOrder === "gap" ? b.gap - a.gap : a.gap - b.gap;
        });

    //one card per topic, cards always alphabetical by topic name - the sort order only orders the
    //policies inside each card
    const shownTopics = new Map<string, typeof shownCouples>();
    for (const couple of shownCouples) {
        const topic = couple.first.policyTopic;
        shownTopics.set(topic, [...(shownTopics.get(topic) ?? []), couple]);
    }
    const shownTopicEntries = [...shownTopics.entries()].sort(([a], [b]) =>
        formatPolicyName(a).localeCompare(formatPolicyName(b)),
    );

    //POLICY OUTCOMES - what passed per topic and direction (whole legislature, not split by chamber)
    //alphabetical by topic name - the grid and the topic chips both use this order
    const policyOutcomes = [
        ...((outcomeSession ? sessionOutcomes : overview?.policyOutcomes) ??
            []),
    ].sort((a, b) =>
        formatPolicyName(a.policyTopic).localeCompare(
            formatPolicyName(b.policyTopic),
        ),
    );
    const shownOutcomes = outcomeTopic
        ? policyOutcomes.filter((t) => t.policyTopic === outcomeTopic)
        : policyOutcomes;

    const stats = [
        { label: "Legislators", value: participation.length.toString() },
        {
            label: "Bills Voted On",
            value: (overview?.billsVotedOn ?? 0).toLocaleString(),
        },
        { label: "Votes Cast", value: totalCast.toLocaleString() },
        {
            label: "Missed Votes",
            value: `${percent(totalAbsent, totalCast + totalAbsent)}%`,
        },
    ];

    //the page-wide year - every tab's filter card has this row, since each tab is its own view
    const yearRow = (
        <FilterRow label="Year">
            {years.map((y) => (
                <FilterChip
                    key={y.year}
                    label={y.year}
                    active={selectedYear === y.year}
                    onClick={() => selectYear(y.year)}
                />
            ))}
        </FilterRow>
    );

    return (
        <div className={`page pageScroll ${style.analysisPage}`}>
            <div className={style.analysisPage__content}>
                <PageHeader
                    eyebrow="Voting Analysis"
                    title="Legislature Trends"
                    subtitle={
                        <>
                            How the whole Utah Legislature voted — what it
                            passed on each policy, where legislators land, and
                            who showed up. For one legislator's scores, open
                            their profile from the{" "}
                            <Link to="/legislators">Legislators</Link> page.
                        </>
                    }
                    stats={stats}
                    loading={loading}
                />

                <PillTabs
                    options={analysisTabs}
                    selectedValue={tab}
                    onSelect={(value) => updateParams({ tab: value })}
                />

                {/* WHAT THE LEGISLATURE PASSED */}
                {tab === "passed" && (
                    <section className={style.section}>
                        <div className={style.section__header}>
                            <p className={style.section__subtitle}>
                                The legislature's score on each policy, based on
                                the {outcomePeriodLabel} bills that passed: 0
                                means everything that passed moved toward the
                                left position, 100 toward the right, on the same
                                scale as legislator scores. Higher-impact bills,
                                and bills where the policy is the main focus,
                                count more. Bills are sorted into policies by
                                AI. Covers both chambers — click "bills counted"
                                to see every bill behind a score.
                            </p>
                        </div>

                        {loading ? (
                            <div className={style.message}>Loading...</div>
                        ) : (
                            <>
                                {/* stays up even when a session has no outcomes, so the year and session can be changed */}
                                <FilterCard title="Filter topics">
                                    {yearRow}

                                    {/* the selected year's sessions - even a year with only a General Session */}
                                    {yearSessions.length > 0 && (
                                        <FilterRow label="Session">
                                            <FilterChip
                                                label={`All ${selectedYear}`}
                                                active={!outcomeSession}
                                                onClick={() =>
                                                    selectOutcomeSession(null)
                                                }
                                            />
                                            {yearSessions.map((session) => (
                                                <FilterChip
                                                    key={session}
                                                    label={sessionLabel(
                                                        session,
                                                    )}
                                                    active={
                                                        outcomeSession ===
                                                        session
                                                    }
                                                    onClick={() =>
                                                        selectOutcomeSession(
                                                            outcomeSession ===
                                                                session
                                                                ? null
                                                                : session,
                                                        )
                                                    }
                                                />
                                            ))}
                                        </FilterRow>
                                    )}

                                    <FilterRow label="Topic">
                                        <ChipSelect
                                            options={policyOutcomes.map(
                                                (topic) => ({
                                                    value: topic.policyTopic,
                                                    label: formatPolicyName(
                                                        topic.policyTopic,
                                                    ),
                                                    count: topic.bills,
                                                }),
                                            )}
                                            selectedValue={outcomeTopic}
                                            onSelect={setOutcomeTopic}
                                            allLabel="All Topics"
                                            searchPlaceholder="Search topics..."
                                        />
                                    </FilterRow>
                                </FilterCard>

                                {outcomesLoading ? (
                                    <div className={style.message}>
                                        Loading...
                                    </div>
                                ) : policyOutcomes.length === 0 ? (
                                    <div className={style.message}>
                                        No policy data for {outcomePeriodLabel}.
                                    </div>
                                ) : (
                                    <div className={style.outcomeGrid}>
                                        {shownOutcomes.map((outcome) => (
                                            <PolicyOutcomeCard
                                                key={outcome.policyTopic}
                                                outcome={outcome}
                                                year={selectedYear ?? ""}
                                                session={outcomeSession}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                )}

                {/* WHERE PARTIES STAND */}
                {tab === "parties" && (
                    <section className={style.section}>
                        <div className={style.section__header}>
                            <p className={style.section__subtitle}>
                                Each slider shows where the median Democrat and
                                the median Republican land on a policy. Scores
                                run from 0 (every counted vote toward the left
                                position) to 100 (every counted vote toward the
                                right). Bills are sorted into policies by AI.
                                Policies scored for fewer than{" "}
                                {MIN_LEGISLATORS_PER_POLICY} legislators aren't
                                shown, and policies where legislators' scores
                                rest on fewer than {MIN_MEDIAN_VOTES} votes are
                                hidden unless you include them below.
                            </p>
                        </div>

                        {loading ? (
                            <div className={style.message}>Loading...</div>
                        ) : (
                            <>
                                {/* stays up for a year without scores, so the year can be changed back */}
                                <FilterCard
                                    title="Filter policies"
                                    action={
                                        yearHasScores && (
                                            <PillTabs
                                                options={[
                                                    {
                                                        value: "gap",
                                                        label: "Biggest party gap",
                                                    },
                                                    {
                                                        value: "agreement",
                                                        label: "Most agreement",
                                                    },
                                                    {
                                                        value: "az",
                                                        label: "A–Z",
                                                    },
                                                ]}
                                                selectedValue={sortOrder}
                                                onSelect={(value) =>
                                                    setSortOrder(
                                                        value as SortOrder,
                                                    )
                                                }
                                            />
                                        )
                                    }
                                >
                                    {yearRow}
                                    {yearHasScores && (
                                        <>
                                            <FilterRow label="Topic">
                                                <ChipSelect
                                                    options={topicOptions.map(
                                                        (topic) => ({
                                                            value: topic,
                                                            label: formatPolicyName(
                                                                topic,
                                                            ),
                                                            count:
                                                                topicCounts.get(
                                                                    topic,
                                                                ) ?? 0,
                                                        }),
                                                    )}
                                                    selectedValue={
                                                        selectedTopic
                                                    }
                                                    onSelect={setSelectedTopic}
                                                    allLabel="All Topics"
                                                    searchPlaceholder="Search topics..."
                                                />
                                            </FilterRow>
                                            <FilterRow label="Include">
                                                <ToggleSwitch
                                                    label={`Policies based on fewer than ${MIN_MEDIAN_VOTES} votes per legislator${!includeFewVotes && hiddenFewVoteCount > 0 ? ` (${hiddenFewVoteCount} hidden)` : ""}`}
                                                    title="With only one or two votes, almost every score is exactly 0 or 100"
                                                    checked={includeFewVotes}
                                                    onChange={(checked) => {
                                                        setSelectedTopic(null);
                                                        setIncludeFewVotes(
                                                            checked,
                                                        );
                                                    }}
                                                />
                                            </FilterRow>
                                        </>
                                    )}
                                </FilterCard>

                                {!yearHasScores ? (
                                    <div className={style.message}>
                                        Policy scores haven't been calculated
                                        for {selectedYear} yet.
                                    </div>
                                ) : (
                                    <>
                                        <div className={style.legend}>
                                            <span>
                                                <span
                                                    className={`${style.legend__swatch} ${style.legend__rep}`}
                                                />
                                                Republican
                                            </span>
                                            <span>
                                                <span
                                                    className={`${style.legend__swatch} ${style.legend__dem}`}
                                                />
                                                Democrat
                                            </span>
                                            <span>
                                                Each dot is the party's median
                                                legislator
                                            </span>
                                        </div>

                                        {shownCouples.length === 0 ? (
                                            <div className={style.message}>
                                                No policies have enough scored
                                                legislators here.
                                            </div>
                                        ) : (
                                            <div className={style.spectrumGrid}>
                                                {shownTopicEntries.map(
                                                    ([
                                                        policyTopic,
                                                        topicCouples,
                                                    ]) => (
                                                        <PolicySpectrum
                                                            key={policyTopic}
                                                            policyTopic={
                                                                policyTopic
                                                            }
                                                            couples={topicCouples.map(
                                                                ({
                                                                    first,
                                                                    scores,
                                                                }) => ({
                                                                    policyCoupleName:
                                                                        first.policyCoupleName,
                                                                    policyNameLabel:
                                                                        first.policyNameLabel,
                                                                    leftPolicyDirection:
                                                                        first.leftPolicyDirection,
                                                                    rightPolicyDirection:
                                                                        first.rightPolicyDirection,
                                                                    scores,
                                                                }),
                                                            )}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </section>
                )}

                {/* PARTICIPATION */}
                {tab === "participation" && (
                    <section className={style.section}>
                        <div className={style.section__header}>
                            <p className={style.section__subtitle}>
                                Floor votes each legislator cast or missed on{" "}
                                {selectedYear} bills. Click a column to sort.
                            </p>
                        </div>
                        <FilterCard title="Filter legislators">
                            {yearRow}
                        </FilterCard>
                        <div className={style.tableContainer}>
                            <GeneralTable
                                columns={createParticipationColumns()}
                                data={participation}
                                defaultSortId="absentPercent"
                                defaultSortAscending={false}
                                loading={loading}
                            />
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default AnalysisPage;
