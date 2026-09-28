import style from "./PolicyScoreBar.module.css";

type PolicyScoreBarProps = {
    //0 = fully toward the left position, 50 = even, 100 = fully toward the right position
    score: number;
    leftLabel: string;
    rightLabel: string;
    //optional party -> median score, drawn as smaller party colored dots with labels under the track
    partyMedians?: Map<string, number>;
};

const partyStyles: Record<string, string> = {
    Republican: style.party__rep,
    Democrat: style.party__dem,
};
const partyAbbreviation: Record<string, string> = {
    Republican: "R",
    Democrat: "D",
};
//half the width of a party dot (.scoreBar__party is 12px)
const PARTY_DOT_RADIUS = 6;
//party medians closer than this many points would draw overlapping dots or labels
const PARTIES_TOUCH_POINTS = 12;

const clamp = (value: number) => Math.min(Math.max(value, 0), 100);

//neutral left <-> right bar for a policy couple score - uses the policy side colors instead of
//red/green so neither side reads as "good" or "bad"
const PolicyScoreBar = ({
    score,
    leftLabel,
    rightLabel,
    partyMedians,
}: PolicyScoreBarProps) => {
    const position = clamp(score);

    const parties = [...(partyMedians ?? new Map()).entries()].filter(
        ([party]) => partyStyles[party],
    );
    const republican = partyMedians?.get("Republican");
    const democrat = partyMedians?.get("Democrat");
    const partiesTouch =
        republican !== undefined &&
        democrat !== undefined &&
        Math.abs(republican - democrat) < PARTIES_TOUCH_POINTS;

    //clamped so a dot at 0 or 100 stays on the track; when the medians nearly match, the two dots sit
    //side by side around their midpoint (lower score on the left) instead of on top of each other
    const partyDotLeft = (party: string, value: number) => {
        if (
            !partiesTouch ||
            Math.abs((republican ?? 0) - (democrat ?? 0)) >= 3
        ) {
            return `clamp(${PARTY_DOT_RADIUS}px, ${value}%, calc(100% - ${PARTY_DOT_RADIUS}px))`;
        }
        const midpoint = ((republican ?? 0) + (democrat ?? 0)) / 2;
        const onLeft =
            party === "Republican"
                ? (republican ?? 0) <= (democrat ?? 0)
                : (democrat ?? 0) < (republican ?? 0);
        return `calc(clamp(${PARTY_DOT_RADIUS * 2}px, ${midpoint}%, calc(100% - ${PARTY_DOT_RADIUS * 2}px)) ${onLeft ? "-" : "+"} ${PARTY_DOT_RADIUS}px)`;
    };

    return (
        <div className={style.scoreBar}>
            <div
                className={style.scoreBar__track}
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(position)}
                aria-label={`${Math.round(position)} out of 100, from ${leftLabel} to ${rightLabel}`}
            >
                <div className={style.scoreBar__center} />
                {/* drawn before the legislator's marker so it stays on top */}
                {parties.map(([party, value]) => (
                    <span
                        key={party}
                        className={`${style.scoreBar__party} ${partyStyles[party]}`}
                        style={{ left: partyDotLeft(party, value) }}
                        title={`${party} median: ${Math.round(value)}`}
                    />
                ))}
                <div
                    className={style.scoreBar__marker}
                    style={{ left: `${position}%` }}
                >
                    <span className={style.scoreBar__value}>
                        {Math.round(position)}
                    </span>
                </div>
            </div>
            {parties.length > 0 && (
                <div
                    className={`${style.scoreBar__parties} ${partiesTouch ? style.scoreBar__partiesStacked : ""}`}
                >
                    {parties.map(([party, value], index) => (
                        <span
                            key={party}
                            className={`${style.scoreBar__partyLabel} ${partyStyles[party]}`}
                            style={{
                                //clamped so labels at 0 or 100 stay inside the card
                                left: `clamp(24px, ${value}%, calc(100% - 24px))`,
                                //when the medians are close, the second label drops below the first
                                top: partiesTouch && index === 1 ? 22 : 0,
                            }}
                        >
                            {partyAbbreviation[party]} {Math.round(value)}
                        </span>
                    ))}
                </div>
            )}
            <div className={style.scoreBar__labels}>
                <span className={style.scoreBar__left}>← {leftLabel}</span>
                <span className={style.scoreBar__right}>{rightLabel} →</span>
            </div>
        </div>
    );
};

export default PolicyScoreBar;
