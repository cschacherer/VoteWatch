import style from "./PolicyTopicSection.module.css";
import type { LegislatorCouplePolicyScore } from "../../models/LegislatorCouplePolicyScore";
import { ScoreSlider } from "../ScoreSlider/ScoreSlider";
import { formatPolicyName } from "../../utils/stringFormat";
import ExpandableSection from "../ExpandableSection/ExpandableSection";
import { Link } from "react-router-dom";

type PolicyTopicSectionProps = {
    legislatorPolicyScores: LegislatorCouplePolicyScore[];
};

const PolicyTopicSection = ({
    legislatorPolicyScores,
}: PolicyTopicSectionProps) => {
    const distinctPolicyTopics = [
        ...new Set(legislatorPolicyScores.map((x) => x.policyTopic)),
    ];

    return (
        <div className="section verticalStack largeGap ">
            {distinctPolicyTopics.map((policyTopic) => {
                return (
                    <div className="section largeGap" key={policyTopic}>
                        <ExpandableSection
                            header={formatPolicyName(policyTopic)}
                            defaultExpanded={true}
                        >
                            <div className="largePadding horizontalRow largeGap">
                                {legislatorPolicyScores
                                    .filter(
                                        (x) => x.policyTopic === policyTopic,
                                    )
                                    .map((legislatorPolicyScore, index) =>
                                        legislatorPolicyScore.allIncludedVotes !=
                                        0 ? (
                                            <div
                                                key={index}
                                                className="section verticalStack largeGap topicHeight centerVertically justifySpaceBetween"
                                            >
                                                <div className="outlineThin largePadding largeGap verticalStack topicHeight centerVertically">
                                                    <div className="centerText largeFont">
                                                        <strong>
                                                            {
                                                                legislatorPolicyScore.policyNameLabel
                                                            }
                                                        </strong>
                                                    </div>
                                                    <div className="horizontalRow centerHorizontally largeFont">
                                                        <div
                                                            className={
                                                                style.scoreRow__left
                                                            }
                                                        >
                                                            {/* {
                                                        legislatorPolicyScore.leftPolicyDirection
                                                    } */}
                                                            <strong>
                                                                Reduce
                                                            </strong>
                                                        </div>
                                                        <div
                                                            className={
                                                                style.scoreRow__center
                                                            }
                                                        >
                                                            <ScoreSlider
                                                                value={
                                                                    legislatorPolicyScore.score
                                                                }
                                                                showValueLabel={
                                                                    true
                                                                }
                                                            />
                                                        </div>
                                                        <div
                                                            className={
                                                                style.scoreRow__right
                                                            }
                                                        >
                                                            <strong>
                                                                Increase
                                                            </strong>
                                                            {/* {
                                                        legislatorPolicyScore.rightPolicyDirection
                                                    } */}
                                                        </div>
                                                    </div>
                                                    <Link
                                                        className="centerText link"
                                                        to={`/analysis/${legislatorPolicyScore.legislatorId}/${legislatorPolicyScore.year}/${legislatorPolicyScore.policyCoupleName}`}
                                                    >
                                                        <strong>
                                                            Votes Included:
                                                        </strong>{" "}
                                                        {
                                                            legislatorPolicyScore.allIncludedVotes
                                                        }
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : null,
                                    )}
                            </div>
                        </ExpandableSection>
                    </div>
                );
            })}
        </div>
    );
};

export default PolicyTopicSection;
