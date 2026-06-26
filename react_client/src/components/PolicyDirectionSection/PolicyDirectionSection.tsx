import { useState, useEffect } from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import type { Vote, VoteValue } from "../../models/Vote";
import style from "./PolicyDirectionSection.module.css";

import type { LegislatorPolicyScore } from "../../models/LegislatorPolicyScore";
import { ScoreSlider } from "../ScoreSlider/ScoreSlider";

type PolicyDirectionSectionProps = {
    legislatorPolicyScore: LegislatorPolicyScore;
};

const PolicyDirectionSection = ({
    legislatorPolicyScore,
}: PolicyDirectionSectionProps) => {
    // const [voteData, setVoteData] = useState<Vote[]>([]);

    // useEffect(() => {
    //     const filteredVotes = voteList.filter((vote: Vote) => {
    //         return (
    //             vote.legislatorId != "" && //the legislator id will be empty if the legislator is no longer elected
    //             vote.vote == voteValue &&
    //             vote.house == house
    //         );
    //     });

    //     setVoteData(filteredVotes);
    // }, [voteList]);
    let allVotes = legislatorPolicyScore.allVotes;
    let includedVotes = legislatorPolicyScore.includedVotes;
    let yesVotes = legislatorPolicyScore.yesVotes;
    let absentVotes = allVotes - includedVotes;
    let noVotes = includedVotes - yesVotes;

    let absentPercentage = `${((absentVotes / allVotes) * 100).toFixed(0)}%`;
    let yesPercentage = `${((yesVotes / allVotes) * 100).toFixed(0)}%`;
    let noPercentage = `${((noVotes / allVotes) * 100).toFixed(0)}%`;

    let score = (yesVotes / includedVotes) * 100;

    if (allVotes == 0) {
        absentPercentage = "N/A";
        yesPercentage = "N/A";
        noPercentage = "N/A";
    }

    return (
        <tr className={style.policyDirectionSection__borderBottom}>
            <td style={{ padding: "8px", fontWeight: "bold" }}>
                {legislatorPolicyScore.policyDirection}
            </td>
            <td style={{ padding: "8px", textAlign: "center" }}>
                <ScoreSlider
                    value={score}
                    label={score.toFixed(0)}
                ></ScoreSlider>
            </td>
            <td style={{ padding: "8px", textAlign: "center" }}>
                <div className="horizontalRow centerHorizontally">
                    <div className="smallPadding">{yesPercentage}</div>
                    <div className="smallPadding"> - </div>
                    <div className="smallPadding">
                        {yesVotes}/{allVotes}
                    </div>
                </div>
            </td>
            <td style={{ padding: "8px", textAlign: "center" }}>
                <div className="horizontalRow centerHorizontally">
                    <div className="smallPadding">{noPercentage}</div>
                    <div className="smallPadding"> - </div>
                    <div className="smallPadding">
                        {noVotes}/{allVotes}
                    </div>
                </div>
            </td>
            <td style={{ padding: "8px", textAlign: "center" }}>
                <div className="horizontalRow centerHorizontally">
                    <div className="smallPadding">{absentPercentage}</div>
                    <div className="smallPadding"> - </div>
                    <div className="smallPadding">
                        {absentVotes}/{allVotes}
                    </div>
                </div>
            </td>
            <td style={{ padding: "8px", textAlign: "center" }}>
                <a
                    className="link"
                    href={`/analysis/${legislatorPolicyScore.legislatorId}/${legislatorPolicyScore.year}/${legislatorPolicyScore.policyTopic}/${legislatorPolicyScore.policyDirection}`}
                >
                    See Bills
                </a>
            </td>
        </tr>
    );
};

export default PolicyDirectionSection;
