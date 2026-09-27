import type { BillPolicy } from "../../models/Bill";
import { formatPolicyName } from "../../utils/stringFormat";

import style from "./PolicyChip.module.css";

type PolicyChipProps = {
    policy: BillPolicy;
    onTopicClick?: (policy: BillPolicy) => void;
    onDirectionClick?: (policy: BillPolicy) => void;
};

const impactStyles: Record<string, string> = {
    low: style.policyChip__impactLow,
    moderate: style.policyChip__impactModerate,
    high: style.policyChip__impactHigh,
};

//renders a button when there is a click handler, otherwise plain text
const ClickableText = ({
    text,
    className,
    title,
    onClick,
}: {
    text: string;
    className: string;
    title: string;
    onClick?: () => void;
}) =>
    onClick ? (
        <button
            className={`${className} ${style.policyChip__textButton}`}
            onClick={onClick}
            title={title}
        >
            {text}
        </button>
    ) : (
        <span className={className}>{text}</span>
    );

const PolicyChip = ({
    policy,
    onTopicClick,
    onDirectionClick,
}: PolicyChipProps) => {
    const isPrimary = policy.policyTopicStrength === "primary";
    const formattedTopic = formatPolicyName(policy.policyTopic);
    const formattedDirection = formatPolicyName(policy.policyDirection);

    return (
        <div
            className={`${style.policyChip} ${isPrimary ? style.policyChip__primary : ""}`}
        >
            <div className={style.policyChip__header}>
                <ClickableText
                    text={formattedTopic}
                    className={style.policyChip__topic}
                    title={`Show all ${formattedTopic} bills`}
                    onClick={onTopicClick && (() => onTopicClick(policy))}
                />
                <span className={style.policyChip__strength}>
                    {formatPolicyName(policy.policyTopicStrength)}
                </span>
            </div>
            <div className={style.policyChip__direction}>
                <ClickableText
                    text={formattedDirection}
                    className=""
                    title={`Show all bills that ${formattedDirection}`}
                    onClick={
                        onDirectionClick && (() => onDirectionClick(policy))
                    }
                />
                <span
                    className={`${style.policyChip__impact} ${impactStyles[policy.impactLevel] ?? ""}`}
                >
                    {/* one string (one text node) so a search for "high impact" can highlight it */}
                    {`${formatPolicyName(policy.impactLevel)} impact`}
                </span>
            </div>
        </div>
    );
};

export default PolicyChip;
