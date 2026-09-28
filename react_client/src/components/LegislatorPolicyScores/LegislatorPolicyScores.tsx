import { useState, useEffect } from "react";
import {
    getAnalysisYears,
    getLegislatorAnalysisByYear,
    getLegislatureCoupleScores,
} from "../../services/analysisService";
import type {
    AnalysisYear,
    PartyCoupleScore,
} from "../../models/LegislatureOverview";
import { partyMedians } from "../../utils/partyMedians";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch";
import type { LegislatorCouplePolicyScore } from "../../models/LegislatorCouplePolicyScore";
import { formatPolicyName } from "../../utils/stringFormat";
import { normalizeSessionId } from "../../models/Bill";
import FilterCard, { FilterRow } from "../FilterCard/FilterCard";
import FilterChip from "../FilterChip/FilterChip";
import ChipSelect from "../ChipSelect/ChipSelect";
import PolicyTopicSection from "../PolicyTopicSection/PolicyTopicSection";

import style from "./LegislatorPolicyScores.module.css";

type LegislatorPolicyScoresProps = {
    legislatorId: string;
    legislatorName?: string;
    //year to show first - falls back to the newest year
    year?: string | null;
    //one of that year's sessions, or null for the whole year
    session?: string | null;
    onYearChange?: (year: string) => void;
    onSessionChange?: (session: string | null) => void;
};

//"2025 Special Session 1" -> "Special Session 1" (the year is already picked above)
const sessionLabel = (sessionId: string) =>
    String(normalizeSessionId(sessionId)).replace(/^\d{4}\s*/, "");

//one legislator's policy couple scores for a year or one session - year and session chips, topic chips,
//and a card per topic. Stored scores are per year, so a session (or an unscored year) is computed live
const LegislatorPolicyScores = ({
    legislatorId,
    legislatorName,
    year,
    session,
    onYearChange,
    onSessionChange,
}: LegislatorPolicyScoresProps) => {
    const [years, setYears] = useState<AnalysisYear[]>([]);
    const [policyScores, setPolicyScores] = useState<
        LegislatorCouplePolicyScore[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    //every legislator's scores for the same year/session, only loaded while the compare switch is on
    const [compareParties, setCompareParties] = useState(false);
    const [partyScores, setPartyScores] = useState<PartyCoupleScore[]>([]);
    const [partyScoresLoading, setPartyScoresLoading] = useState(false);

    //newest first - every year with bills can be scored
    const yearOptions = years.map((y) => y.year);
    const selectedYear =
        year && yearOptions.includes(year) ? year : yearOptions[0];
    const yearSessions =
        years.find((y) => y.year === selectedYear)?.sessions ?? [];
    //ignore a session that isn't in the selected year (ie an old link)
    const selectedSession =
        session && yearSessions.includes(session) ? session : null;
    //what the scores cover, ie "2025" or "2025 Special Session 1"
    const periodLabel = selectedSession
        ? String(normalizeSessionId(selectedSession))
        : selectedYear;

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

        const fetchScores = async () => {
            setLoading(true);
            try {
                setPolicyScores(
                    await getLegislatorAnalysisByYear(
                        legislatorId,
                        selectedYear,
                        selectedSession,
                    ),
                );
            } catch (error) {
                console.log(error);
                setPolicyScores([]);
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, [legislatorId, selectedYear, selectedSession]);

    useEffect(() => {
        if (!compareParties || !selectedYear) return;

        //ignore a response for a year or session that's no longer selected
        let stale = false;
        const fetchPartyScores = async () => {
            setPartyScoresLoading(true);
            try {
                const scores = await getLegislatureCoupleScores(
                    selectedYear,
                    selectedSession,
                );
                if (!stale) setPartyScores(scores);
            } catch (error) {
                console.log(error);
                if (!stale) setPartyScores([]);
            } finally {
                if (!stale) setPartyScoresLoading(false);
            }
        };

        fetchPartyScores();
        return () => {
            stale = true;
        };
    }, [compareParties, selectedYear, selectedSession]);

    //policy couple -> party -> median legislator score, the same medians Party Trends shows
    const partyMediansByCouple = new Map<string, Map<string, number>>();
    if (compareParties) {
        const scoresByCouple = new Map<string, PartyCoupleScore[]>();
        for (const score of partyScores) {
            const list = scoresByCouple.get(score.policyCoupleName) ?? [];
            list.push(score);
            scoresByCouple.set(score.policyCoupleName, list);
        }
        for (const [coupleName, scores] of scoresByCouple) {
            partyMediansByCouple.set(coupleName, partyMedians(scores));
        }
    }

    //only couples with votes have a meaningful score
    const topicCounts = new Map<string, number>();
    for (const couple of policyScores) {
        if (couple.allIncludedVotes > 0) {
            topicCounts.set(
                couple.policyTopic,
                (topicCounts.get(couple.policyTopic) ?? 0) + 1,
            );
        }
    }
    const topicOptions = [...topicCounts.keys()].sort((a, b) =>
        a.localeCompare(b),
    );

    const shownScores = selectedTopic
        ? policyScores.filter((score) => score.policyTopic === selectedTopic)
        : //without a topic filter, hide topics that have no scored couples at all
          policyScores.filter((score) => topicCounts.has(score.policyTopic));

    if (!loading && yearOptions.length === 0) {
        return <div className={style.message}>No policy scores yet.</div>;
    }

    return (
        <div className={style.policyScores}>
            <div className={style.explainer}>
                <strong>How to read a score:</strong> 0 means every counted vote
                moved toward the left position, 100 means every counted vote
                moved toward the right, and 50 is even. A <em>Yes</em> on a bill
                counts toward that bill's direction; a <em>No</em> counts toward
                the opposite one. Higher-impact bills, and bills where the
                policy is the main focus, count more. Bills are sorted into
                policies by AI, and absent votes aren't counted. Click a vote
                count to see every bill behind a score.
            </div>

            <FilterCard title="Filter analysis">
                <FilterRow label="Year">
                    {yearOptions.map((y) => (
                        <FilterChip
                            key={y}
                            label={y}
                            active={selectedYear === y}
                            onClick={() => {
                                setSelectedTopic(null);
                                onYearChange?.(y);
                            }}
                        />
                    ))}
                </FilterRow>

                {/* the selected year's sessions - even a year with only a General Session */}
                {yearSessions.length > 0 && (
                    <FilterRow label="Session">
                        <FilterChip
                            label={`All ${selectedYear}`}
                            active={!selectedSession}
                            onClick={() => {
                                setSelectedTopic(null);
                                onSessionChange?.(null);
                            }}
                        />
                        {yearSessions.map((s) => (
                            <FilterChip
                                key={s}
                                label={sessionLabel(s)}
                                active={selectedSession === s}
                                onClick={() => {
                                    setSelectedTopic(null);
                                    onSessionChange?.(
                                        selectedSession === s ? null : s,
                                    );
                                }}
                            />
                        ))}
                    </FilterRow>
                )}

                <FilterRow label="Topic">
                    <ChipSelect
                        options={topicOptions.map((topic) => ({
                            value: topic,
                            label: formatPolicyName(topic),
                            count: topicCounts.get(topic) ?? 0,
                        }))}
                        selectedValue={selectedTopic}
                        onSelect={setSelectedTopic}
                        allLabel="All Topics"
                        searchPlaceholder="Search topics..."
                    />
                </FilterRow>
                <FilterRow label="Compare">
                    <ToggleSwitch
                        label={
                            compareParties && partyScoresLoading
                                ? "Show Democrat and Republican medians (loading...)"
                                : "Show Democrat and Republican medians"
                        }
                        title="Adds each party's median legislator score to every bar, for the same year and session"
                        checked={compareParties}
                        onChange={setCompareParties}
                    />
                </FilterRow>
            </FilterCard>

            {loading ? (
                <div className={style.message}>Loading scores...</div>
            ) : topicOptions.length === 0 ? (
                <div className={style.message}>
                    No policy scores for {legislatorName ?? "this legislator"}{" "}
                    in {periodLabel} yet.
                </div>
            ) : (
                <PolicyTopicSection
                    legislatorPolicyScores={shownScores}
                    session={selectedSession}
                    partyMediansByCouple={
                        compareParties ? partyMediansByCouple : undefined
                    }
                />
            )}
        </div>
    );
};

export default LegislatorPolicyScores;
