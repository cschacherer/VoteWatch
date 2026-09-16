import style from "./PolicyTopicSection.module.css";
import type { LegislatorCouplePolicyScore } from "../../models/LegislatorCouplePolicyScore";
import { ScoreSlider } from "../ScoreSlider/ScoreSlider";

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
        <div className="section defaultGap verticalStack largeGap defaultPaddingHorizontal">
            {distinctPolicyTopics.map((policyTopic) => {
                return (
                    <div
                        className="outlineThin section verticalStack defaultGap"
                        key={policyTopic}
                    >
                        <div className="smallFilledHeader">{policyTopic}</div>
                        <div className="defaultPadding defaultGap">
                            {legislatorPolicyScores
                                .filter((x) => x.policyTopic === policyTopic)
                                .map((legislatorPolicyScore, index) =>
                                    legislatorPolicyScore.allIncludedVotes != 0 ? (
                                        <div
                                            key={index}
                                            className="outlineThin section verticalStack defaultGap defaultPadding"
                                        >
                                            <div className="centerText">
                                                <strong>
                                                    {
                                                        legislatorPolicyScore.policyNameLabel
                                                    }
                                                </strong>
                                            </div>
                                            <div className="horizontalRow centerHorizontally">
                                                <div
                                                    className={style.scoreRow__left}
                                                >
                                                    {/* {
                                                        legislatorPolicyScore.leftPolicyDirection
                                                    } */}
                                                    <strong>Reduce</strong>
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
                                                        showValueLabel={true}
                                                    />
                                                </div>
                                                <div
                                                    className={
                                                        style.scoreRow__right
                                                    }
                                                >
                                                    <strong>Increase</strong>
                                                    {/* {
                                                        legislatorPolicyScore.rightPolicyDirection
                                                    } */}
                                                </div>
                                            </div>
                                            <div className="centerText">
                                                <strong>Votes Included:</strong>{" "}
                                                {
                                                    legislatorPolicyScore.allIncludedVotes
                                                }
                                            </div>
                                        </div>
                                    ) : null
                                )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PolicyTopicSection;
