import type { ReactNode } from "react";

import style from "./FilterCard.module.css";

type FilterCardProps = {
    title: string;
    //shown on the right of the title, ie a ToggleSwitch
    action?: ReactNode;
    //"stacked" puts rows under the title, "inline" puts the title, children, and action on one line
    layout?: "stacked" | "inline";
    children: ReactNode;
};

//white card that groups filter controls above a table
const FilterCard = ({
    title,
    action,
    layout = "stacked",
    children,
}: FilterCardProps) => {
    if (layout === "inline") {
        return (
            <section
                className={`${style.filterCard} ${style.filterCard__inline}`}
            >
                <span className={style.filterCard__title}>{title}</span>
                {children}
                {action && (
                    <div className={style.filterCard__inlineAction}>
                        {action}
                    </div>
                )}
            </section>
        );
    }

    return (
        <section className={style.filterCard}>
            <div className={style.filterCard__header}>
                <span className={style.filterCard__title}>{title}</span>
                {action}
            </div>
            {children}
        </section>
    );
};

//a labeled row of chips inside a FilterCard, ie "TOPIC  [All Topics] [Education 235] ..."
//action is a control for this row's filter (ie a ToggleSwitch), shown below the chips
export const FilterRow = ({
    label,
    action,
    children,
}: {
    label: string;
    action?: ReactNode;
    children: ReactNode;
}) => (
    <div className={style.filterRow}>
        <span className={style.filterRow__label}>{label}</span>
        <div className={style.filterRow__body}>
            <div className={style.filterRow__chips}>{children}</div>
            {action && <div className={style.filterRow__action}>{action}</div>}
        </div>
    </div>
);

//"× Clear all filters (N)" for a FilterCard's action - renders nothing while no filters are on
export const ClearFiltersButton = ({
    count,
    onClick,
}: {
    count: number;
    onClick: () => void;
}) =>
    count > 0 ? (
        <button className={style.clearFilters} onClick={onClick}>
            × Clear all filters ({count})
        </button>
    ) : null;

export default FilterCard;
