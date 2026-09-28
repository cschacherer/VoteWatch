import {
    formatPolicyName,
    shortenDirectionPair,
} from "../../utils/stringFormat";
import {
    MIN_PARTY_MEMBERS,
    median,
    partyMedians,
    type SpectrumScore,
} from "../../utils/partyMedians";

import style from "./PolicySpectrum.module.css";

//one policy couple in a topic card - every legislator's score on it
export type SpectrumCouple = {
    policyCoupleName: string;
    policyNameLabel: string;
    leftPolicyDirection: string;
    rightPolicyDirection: string;
    scores: SpectrumScore[];
};

type PolicySpectrumProps = {
    policyTopic: string;
    //already in display order
    couples: SpectrumCouple[];
};

//half the width of a party dot (.slider__dot is 18px)
const DOT_RADIUS = 9;
//party medians closer than this many points would draw overlapping dots
const DOTS_TOUCH_POINTS = 4;

const partyStyles: Record<string, string> = {
    Republican: style.party__rep,
    Democrat: style.party__dem,
};
const partyAbbreviation: Record<string, string> = {
    Republican: "R",
    Democrat: "D",
};

//one policy couple's row - a 0-100 slider with one dot per party at that party's median legislator score
const CoupleSpectrum = ({ couple }: { couple: SpectrumCouple }) => {
    const [leftLabel, rightLabel] = shortenDirectionPair(
        couple.leftPolicyDirection,
        couple.rightPolicyDirection,
    );

    const medians = partyMedians(couple.scores);
    const overall = median(couple.scores.map((s) => s.score));
    const medianVotes = median(couple.scores.map((s) => s.includedVotes)) ?? 0;

    //with only a few votes both parties often land on the same score (ie both 100), which would put one
    //dot exactly on top of the other - when they're this close, the dots sit side by side instead,
    //centered on the midpoint, with the lower score on the left
    const republican = medians.get("Republican");
    const democrat = medians.get("Democrat");
    const dotsTouch =
        republican !== undefined &&
        democrat !== undefined &&
        Math.abs(republican - democrat) < DOTS_TOUCH_POINTS;

    const dotLeft = (party: string, value: number) => {
        if (!dotsTouch) {
            //clamped so a dot at 0 or 100 stays on the track instead of hanging off the end
            return `clamp(${DOT_RADIUS}px, ${value}%, calc(100% - ${DOT_RADIUS}px))`;
        }
        const midpoint = ((republican ?? 0) + (democrat ?? 0)) / 2;
        const onLeft =
            party === "Republican"
                ? (republican ?? 0) <= (democrat ?? 0)
                : (democrat ?? 0) < (republican ?? 0);
        //the pair is 2 dots wide, so its center is clamped a full dot in from each end
        return `calc(clamp(${DOT_RADIUS * 2}px, ${midpoint}%, calc(100% - ${DOT_RADIUS * 2}px)) ${onLeft ? "-" : "+"} ${DOT_RADIUS}px)`;
    };

    return (
        <div className={style.couple}>
            <div className={style.couple__header}>
                <span className={style.couple__name}>
                    {couple.policyNameLabel}
                </span>
                <span className={style.couple__count}>
                    {couple.scores.length} legislators
                </span>
            </div>

            {/* Democrat label above the track, Republican below, so they never overlap */}
            <div className={style.slider}>
                <div
                    className={style.slider__track}
                    role="img"
                    aria-label={[...medians.entries()]
                        .map(
                            ([party, value]) =>
                                `${party} median ${Math.round(value)}`,
                        )
                        .join(", ")}
                >
                    <div className={style.slider__center} />
                    {[...medians.entries()].map(([party, value]) => (
                        <span
                            key={party}
                            className={`${style.slider__dot} ${partyStyles[party]}`}
                            style={{ left: dotLeft(party, value) }}
                            title={`${party} median: ${Math.round(value)}`}
                        />
                    ))}
                </div>
                {[...medians.entries()].map(([party, value]) => (
                    <span
                        key={party}
                        className={`${style.slider__label} ${party === "Democrat" ? style.slider__labelAbove : style.slider__labelBelow} ${partyStyles[party]}`}
                        style={{
                            //clamped so labels at 0 or 100 stay inside the card
                            left: `clamp(28px, ${value}%, calc(100% - 28px))`,
                        }}
                    >
                        {partyAbbreviation[party]} - {Math.round(value)}
                    </span>
                ))}
            </div>
            {medians.size === 0 && (
                <p className={style.slider__empty}>
                    Neither party has {MIN_PARTY_MEMBERS} scored legislators on
                    this policy.
                </p>
            )}

            <div className={style.axis}>
                <span className={style.axis__left}>← {leftLabel}</span>
                <span className={style.axis__right}>{rightLabel} →</span>
            </div>

            <div className={style.couple__footer}>
                Median {overall === null ? "—" : Math.round(overall)}
                {medians.size === 2 && (
                    <>
                        {" "}
                        · Party gap{" "}
                        {Math.round(
                            Math.abs(
                                (medians.get("Republican") ?? 0) -
                                    (medians.get("Democrat") ?? 0),
                            ),
                        )}
                    </>
                )}
                <span className={style.couple__votes}>
                    {" "}
                    · Based on {Math.round(medianVotes)}{" "}
                    {Math.round(medianVotes) === 1 ? "vote" : "votes"} per
                    legislator (median)
                </span>
            </div>
        </div>
    );
};

//one card per policy topic - a party-median slider for each of the topic's policy couples, laid out
//like the PolicyTopicSection cards on a legislator's profile
const PolicySpectrum = ({ policyTopic, couples }: PolicySpectrumProps) => (
    <section className={style.spectrum}>
        <h3 className={style.spectrum__title}>
            {formatPolicyName(policyTopic)}
        </h3>
        {couples.map((couple) => (
            <CoupleSpectrum key={couple.policyCoupleName} couple={couple} />
        ))}
    </section>
);

export default PolicySpectrum;
