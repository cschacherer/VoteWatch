import { Link } from "react-router-dom";
import type { LegislatorCouplePolicyScore } from "../../models/LegislatorCouplePolicyScore";
import {
    formatPolicyName,
    shortenDirectionPair,
} from "../../utils/stringFormat";
import PolicyScoreBar from "../PolicyScoreBar/PolicyScoreBar";

import style from "./PolicyTopicSection.module.css";

type PolicyTopicSectionProps = {
    legislatorPolicyScores: LegislatorCouplePolicyScore[];
    //set when the scores are for one session, so the vote links show that session's bills
    session?: string | null;
    //policy couple name -> party -> median score, shown on each bar when set
    partyMediansByCouple?: Map<string, Map<string, number>>;
};

//one card per policy topic, with a score bar for each policy couple the legislator has votes on
const PolicyTopicSection = ({
    legislatorPolicyScores,
    session,
    partyMediansByCouple,
}: PolicyTopicSectionProps) => {
    const distinctPolicyTopics = [
        ...new Set(legislatorPolicyScores.map((x) => x.policyTopic)),
    ];

    return (
        <div className={style.topicGrid}>
            {distinctPolicyTopics.map((policyTopic) => {
                //couples with no included votes have no meaningful score, so they're not shown
                const scoredCouples = legislatorPolicyScores.filter(
                    (x) =>
                        x.policyTopic === policyTopic && x.allIncludedVotes > 0,
                );
                const unscoredCount =
                    legislatorPolicyScores.filter(
                        (x) => x.policyTopic === policyTopic,
                    ).length - scoredCouples.length;

                return (
                    <section className={style.topicCard} key={policyTopic}>
                        <h2 className={style.topicCard__title}>
                            {formatPolicyName(policyTopic)}
                        </h2>

                        {scoredCouples.length === 0 && (
                            <p className={style.topicCard__empty}>
                                No scored votes on this topic.
                            </p>
                        )}

                        {scoredCouples.map((couple) => {
                            const [leftLabel, rightLabel] =
                                shortenDirectionPair(
                                    couple.leftPolicyDirection,
                                    couple.rightPolicyDirection,
                                );

                            return (
                                <div
                                    className={style.couple}
                                    key={couple.policyCoupleName}
                                >
                                    <div className={style.couple__header}>
                                        <span className={style.couple__name}>
                                            {couple.policyNameLabel}
                                        </span>
                                        <Link
                                            className={style.couple__votes}
                                            to={`/analysis/${couple.legislatorId}/${couple.year}/${couple.policyCoupleName}${session ? `?session=${session}` : ""}`}
                                            title="See every bill in this score"
                                        >
                                            {couple.allIncludedVotes}{" "}
                                            {couple.allIncludedVotes === 1
                                                ? "vote"
                                                : "votes"}{" "}
                                            →
                                        </Link>
                                    </div>
                                    <PolicyScoreBar
                                        score={Number(couple.score)}
                                        leftLabel={leftLabel}
                                        rightLabel={rightLabel}
                                        partyMedians={partyMediansByCouple?.get(
                                            couple.policyCoupleName,
                                        )}
                                    />
                                </div>
                            );
                        })}

                        {scoredCouples.length > 0 && unscoredCount > 0 && (
                            <p className={style.topicCard__note}>
                                {unscoredCount} more{" "}
                                {unscoredCount === 1 ? "policy" : "policies"}{" "}
                                with no scored votes
                            </p>
                        )}
                    </section>
                );
            })}
        </div>
    );
};

export default PolicyTopicSection;
