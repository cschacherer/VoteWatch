import RepIcon from "../../assets/icons-republican.svg?react";
import DemIcon from "../../assets/icons-democrat.svg?react";
import { normalizeSessionId } from "../../models/Bill";

import style from "./Badge.module.css";

export const BadgeType = {
    Party: "party",
    Vote: "vote",
    Subjects: "subjects",
    Passed: "passed",
    BillId: "billId",
    SessionId: "sessionId",
} as const;

export type BadgeType = (typeof BadgeType)[keyof typeof BadgeType];

type BadgeProps = {
    type: BadgeType;
    value?: any;
    onClick?: (value: any) => void;
};
const Badge = ({ type, value, onClick }: BadgeProps) => {
    if (value == null || value == undefined) return null;

    if (value == false) {
        const y = 0;
    }

    if (type == BadgeType.Passed) {
        const x = 0;
    }

    const v = String(value).toLowerCase();

    let valueStyle = `${style.badge__default} `;
    let Icon: React.ElementType | null = null;

    if (type == BadgeType.Party) {
        if (v == "democrat") {
            valueStyle = style.badge__dem;
            Icon = DemIcon;
        } else if (v == "republican") {
            valueStyle += style.badge__rep;
            Icon = RepIcon;
        } else {
            valueStyle = style.badge__ind;
        }
    } else if (type == BadgeType.Vote) {
        if (v == "yes") valueStyle = style.badge__yes;
        else if (v == "no") {
            valueStyle = style.badge__no;
        } else if (v == "absent") {
            valueStyle = style.badge__absent;
        }
    } else if (type == BadgeType.Passed) {
        if (v == "true") {
            valueStyle = style.badge__yes;
            value = "PASSED";
        } else if (v == "false") {
            valueStyle = style.badge__no;
            value = "FAILED";
        } else {
            let x = 0;
        }
    } else if (type == BadgeType.SessionId) {
        value = normalizeSessionId(v);
        valueStyle = style.badge__basic;
    } else {
        valueStyle = style.badge__basic;
    }

    const className = `${style.badge__default} ${valueStyle}`;

    return (
        <span className={className} onClick={() => onClick?.(value)}>
            {Icon && <Icon className={style.badge__icon} />}
            {value}
        </span>
    );
};

export default Badge;
