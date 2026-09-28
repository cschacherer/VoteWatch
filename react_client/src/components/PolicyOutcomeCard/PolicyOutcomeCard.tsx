import { Link } from "react-router-dom";
import type { TopicOutcome } from "../../models/LegislatureOverview";
import {
    formatPolicyName,
    shortenDirectionPair,
} from "../../utils/stringFormat";
import PolicyScoreBar from "../PolicyScoreBar/PolicyScoreBar";

import style from "./PolicyOutcomeCard.module.css";

//the legislature's outcome score for each policy couple in one topic, with a link to the passed
//bills that counted toward it
const PolicyOutcomeCard = ({
    outcome,
    year,
    session,
}: {
    outcome: TopicOutcome;
    year: string;
    //set when the outcomes are for one session, so the bill links show that session's bills
    session?: string | null;
}) => {
    //couples with no bills on either side have nothing to show
    const couplesWithBills = outcome.couples.filter(
        (couple) => couple.left.bills + couple.right.bills > 0,
    );

    return (
        <section className={style.card}>
            <h3 className={style.card__title}>
                {formatPolicyName(outcome.policyTopic)}
            </h3>

            {couplesWithBills.map((couple) => {
                const [leftLabel, rightLabel] = shortenDirectionPair(
                    couple.left.direction,
                    couple.right.direction,
                );
                //only passed bills count toward the outcome score
                const countedBills = couple.left.passed + couple.right.passed;

                return (
                    <div key={couple.policyCoupleName} className={style.couple}>
                        <div className={style.couple__header}>
                            <span className={style.couple__name}>
                                {couple.policyNameLabel}
                            </span>
                            {countedBills > 0 && (
                                <Link
                                    className={style.couple__link}
                                    to={`/analysis/outcomes/${year}/${couple.policyCoupleName}${session ? `?session=${session}` : ""}`}
                                    title="See every passed bill behind this score"
                                >
                                    {countedBills}{" "}
                                    {countedBills === 1 ? "bill" : "bills"}{" "}
                                    counted →
                                </Link>
                            )}
                        </div>
                        {couple.outcomeScore === null ? (
                            <span className={style.couple__noScore}>
                                No bills on this policy passed
                            </span>
                        ) : (
                            <PolicyScoreBar
                                score={couple.outcomeScore}
                                leftLabel={leftLabel}
                                rightLabel={rightLabel}
                            />
                        )}
                    </div>
                );
            })}
        </section>
    );
};

export default PolicyOutcomeCard;
