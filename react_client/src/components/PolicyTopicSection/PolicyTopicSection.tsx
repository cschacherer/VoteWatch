import { useState, useEffect } from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import type { Vote, VoteValue } from "../../models/Vote";

import style from "./PolicyTopicSection.module.css";
import type { LegislatorPolicyScore } from "../../models/LegislatorPolicyScore";
import PolicyDirectionSection from "../PolicyDirectionSection/PolicyDirectionSection";

type PolicyTopicSectionProps = {
    legislatorPolicyScores: LegislatorPolicyScore[];
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
                        className="outlineThin section verticalStack"
                        key={policyTopic}
                    >
                        <div className="smallFilledHeader">{policyTopic}</div>
                        <div className="defaultPaddingHorizontal">
                            <table className={`width100`}>
                                <thead>
                                    <tr>
                                        <th
                                            className={
                                                style.policyTopicSection__directionColumnHeader
                                            }
                                        >
                                            Policy Direction
                                        </th>
                                        <th
                                            className={
                                                style.policyTopicSection__width10ColumnHeader
                                            }
                                        >
                                            Score
                                        </th>
                                        <th
                                            className={
                                                style.policyTopicSection__width20ColumnHeader
                                            }
                                        >
                                            Yes Votes
                                        </th>
                                        <th
                                            className={
                                                style.policyTopicSection__width20ColumnHeader
                                            }
                                        >
                                            No Votes
                                        </th>
                                        <th
                                            className={
                                                style.policyTopicSection__width20ColumnHeader
                                            }
                                        >
                                            Absent Votes
                                        </th>
                                        <th
                                            className={
                                                style.policyTopicSection__width10ColumnHeader
                                            }
                                        >
                                            Bills Included
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {legislatorPolicyScores
                                        .filter(
                                            (x) =>
                                                x.policyTopic === policyTopic,
                                        )
                                        .map((legislatorPolicyScore, index) => (
                                            <PolicyDirectionSection
                                                key={index}
                                                legislatorPolicyScore={
                                                    legislatorPolicyScore
                                                }
                                            />
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PolicyTopicSection;
