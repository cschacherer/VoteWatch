import {
    formatPolicyName,
    shortenDirectionPair,
} from "../../utils/stringFormat";

import style from "./PolicySpectrum.module.css";

export type SpectrumScore = {
    score: number;
    party: string;
    //how many votes this legislator's score is based on
    includedVotes: number;
};

type PolicySpectrumProps = {
    policyTopic: string;
    policyNameLabel: string;
    leftPolicyDirection: string;
    rightPolicyDirection: string;
    scores: SpectrumScore[];
};

const BIN_COUNT = 20; //5 points per bin
//parties with fewer scored members than this don't get a median marker - too few to be meaningful
export const MIN_PARTY_MEMBERS = 3;

const partyOrder = ["Republican", "Democrat"];
const partyStyles: Record<string, string> = {
    Republican: style.party__rep,
    Democrat: style.party__dem,
};
const partyShortNames: Record<string, string> = {
    Republican: "R",
    Democrat: "D",
};

export function median(values: number[]) {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2;
}

//median score for each party with enough scored members
export function partyMedians(scores: SpectrumScore[]) {
    const medians = new Map<string, number>();
    for (const party of partyOrder) {
        const partyScores = scores
            .filter((s) => s.party === party)
            .map((s) => s.score);
        const value = median(partyScores);
        if (value !== null && partyScores.length >= MIN_PARTY_MEMBERS) {
            medians.set(party, value);
        }
    }
    return medians;
}

//distribution of every legislator's score on one policy couple - a histogram of 5 point bins,
//stacked by party, with each party's median marked
const PolicySpectrum = ({
    policyTopic,
    policyNameLabel,
    leftPolicyDirection,
    rightPolicyDirection,
    scores,
}: PolicySpectrumProps) => {
    const [leftLabel, rightLabel] = shortenDirectionPair(
        leftPolicyDirection,
        rightPolicyDirection,
    );

    //bins[i] = party -> count, where bin i covers scores [i*5, i*5+5) and 100 lands in the last bin
    const bins = Array.from(
        { length: BIN_COUNT },
        () => new Map<string, number>(),
    );
    for (const { score, party } of scores) {
        const index = Math.min(
            Math.floor((score / 100) * BIN_COUNT),
            BIN_COUNT - 1,
        );
        const key = partyOrder.includes(party) ? party : "Other";
        bins[index].set(key, (bins[index].get(key) ?? 0) + 1);
    }
    const binTotals = bins.map((bin) =>
        [...bin.values()].reduce((sum, count) => sum + count, 0),
    );
    const maxBin = Math.max(1, ...binTotals);

    const medians = partyMedians(scores);
    const overall = median(scores.map((s) => s.score));
    const medianVotes = median(scores.map((s) => s.includedVotes)) ?? 0;
    const medianValues = [...medians.values()];
    const medianLabelsOverlap =
        medianValues.length === 2 &&
        Math.abs(medianValues[0] - medianValues[1]) < 12;

    return (
        <section className={style.spectrum}>
            <div className={style.spectrum__header}>
                <div>
                    <span className={style.spectrum__topic}>
                        {formatPolicyName(policyTopic)}
                    </span>
                    <h3 className={style.spectrum__title}>{policyNameLabel}</h3>
                </div>
                <span className={style.spectrum__count}>
                    {scores.length} legislators
                </span>
            </div>

            {/* histogram */}
            <div className={style.chart}>
                {bins.map((bin, index) => {
                    const low = index * 5;
                    const high = index === BIN_COUNT - 1 ? 100 : low + 5;
                    const detail = [...partyOrder, "Other"]
                        .filter((party) => bin.get(party))
                        .map((party) => `${bin.get(party)} ${party}`)
                        .join(", ");
                    return (
                        <div
                            key={index}
                            className={style.chart__bin}
                            title={`Score ${low}–${high}: ${binTotals[index]} legislator${binTotals[index] === 1 ? "" : "s"}${detail ? ` (${detail})` : ""}`}
                        >
                            {[...partyOrder, "Other"].map((party) => {
                                const count = bin.get(party) ?? 0;
                                return count > 0 ? (
                                    <div
                                        key={party}
                                        className={`${style.chart__segment} ${partyStyles[party] ?? style.party__other}`}
                                        style={{
                                            height: `${(count / maxBin) * 100}%`,
                                        }}
                                    />
                                ) : null;
                            })}
                        </div>
                    );
                })}
                <div className={style.chart__center} />
            </div>

            {/* party medians on the same 0-100 scale */}
            <div
                className={`${style.medians} ${medianLabelsOverlap ? style.medians__stacked : ""}`}
            >
                {[...medians.entries()].map(([party, value], index) => (
                    <span
                        key={party}
                        className={`${style.median} ${partyStyles[party]}`}
                        style={{
                            //clamped so labels at 0 or 100 stay inside the card
                            left: `clamp(22px, ${value}%, calc(100% - 22px))`,
                            //when the medians are close, the second label drops below the first
                            top: medianLabelsOverlap && index === 1 ? 22 : 0,
                        }}
                        title={`${party} median: ${Math.round(value)}`}
                    >
                        {partyShortNames[party]} {Math.round(value)}
                    </span>
                ))}
            </div>

            <div className={style.axis}>
                <span className={style.axis__left}>← {leftLabel}</span>
                <span className={style.axis__right}>{rightLabel} →</span>
            </div>

            <div className={style.spectrum__footer}>
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
                <span className={style.spectrum__votes}>
                    {" "}
                    · Based on {Math.round(medianVotes)}{" "}
                    {Math.round(medianVotes) === 1 ? "vote" : "votes"} per
                    legislator (median)
                </span>
            </div>
        </section>
    );
};

export default PolicySpectrum;
