import { useState, useEffect } from "react";
import {
    getAnalysisYears,
    getLegislatorAnalysisByYear,
} from "../../services/analysisService";
import type { AnalysisYear } from "../../models/LegislatureOverview";
import type { LegislatorCouplePolicyScore } from "../../models/LegislatorCouplePolicyScore";
import { formatPolicyName } from "../../utils/stringFormat";
import PillTabs from "../PillTabs/PillTabs";
import FilterCard, { FilterRow } from "../FilterCard/FilterCard";
import FilterChip from "../FilterChip/FilterChip";
import PolicyTopicSection from "../PolicyTopicSection/PolicyTopicSection";

import style from "./LegislatorPolicyScores.module.css";

type LegislatorPolicyScoresProps = {
    legislatorId: string;
    legislatorName?: string;
    //year to show first - falls back to the newest year with scores
    year?: string | null;
    onYearChange?: (year: string) => void;
};

//one legislator's policy couple scores for a year - year tabs, topic chips, and a card per topic
const LegislatorPolicyScores = ({
    legislatorId,
    legislatorName,
    year,
    onYearChange,
}: LegislatorPolicyScoresProps) => {
    const [years, setYears] = useState<AnalysisYear[]>([]);
    const [policyScores, setPolicyScores] = useState<
        LegislatorCouplePolicyScore[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    const scoredYears = years.filter((y) => y.hasScores).map((y) => y.year);
    const selectedYear =
        year && scoredYears.includes(year) ? year : scoredYears[0];

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
    }, [legislatorId, selectedYear]);

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

    if (!loading && scoredYears.length === 0) {
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

            <FilterCard
                title="Filter scores"
                action={
                    scoredYears.length > 1 && selectedYear ? (
                        <PillTabs
                            options={scoredYears.map((y) => ({
                                value: y,
                                label: y,
                            }))}
                            selectedValue={selectedYear}
                            onSelect={(y) => {
                                setSelectedTopic(null);
                                onYearChange?.(y);
                            }}
                        />
                    ) : undefined
                }
            >
                <FilterRow label="Topic">
                    <FilterChip
                        label="All Topics"
                        active={!selectedTopic}
                        onClick={() => setSelectedTopic(null)}
                    />
                    {topicOptions.map((topic) => (
                        <FilterChip
                            key={topic}
                            label={formatPolicyName(topic)}
                            count={topicCounts.get(topic) ?? 0}
                            active={selectedTopic === topic}
                            onClick={() =>
                                setSelectedTopic(
                                    selectedTopic === topic ? null : topic,
                                )
                            }
                        />
                    ))}
                </FilterRow>
            </FilterCard>

            {loading ? (
                <div className={style.message}>Loading scores...</div>
            ) : topicOptions.length === 0 ? (
                <div className={style.message}>
                    No policy scores for {legislatorName ?? "this legislator"}{" "}
                    in {selectedYear} yet.
                </div>
            ) : (
                <PolicyTopicSection legislatorPolicyScores={shownScores} />
            )}
        </div>
    );
};

export default LegislatorPolicyScores;
