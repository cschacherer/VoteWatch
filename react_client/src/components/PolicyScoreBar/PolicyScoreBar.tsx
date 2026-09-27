import style from "./PolicyScoreBar.module.css";

type PolicyScoreBarProps = {
    //0 = fully toward the left position, 50 = even, 100 = fully toward the right position
    score: number;
    leftLabel: string;
    rightLabel: string;
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 100);

//neutral left <-> right bar for a policy couple score - uses the policy side colors instead of
//red/green so neither side reads as "good" or "bad"
const PolicyScoreBar = ({
    score,
    leftLabel,
    rightLabel,
}: PolicyScoreBarProps) => {
    const position = clamp(score);

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
                <div
                    className={style.scoreBar__marker}
                    style={{ left: `${position}%` }}
                >
                    <span className={style.scoreBar__value}>
                        {Math.round(position)}
                    </span>
                </div>
            </div>
            <div className={style.scoreBar__labels}>
                <span className={style.scoreBar__left}>← {leftLabel}</span>
                <span className={style.scoreBar__right}>{rightLabel} →</span>
            </div>
        </div>
    );
};

export default PolicyScoreBar;
