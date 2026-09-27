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
export const FilterRow = ({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) => (
    <div className={style.filterRow}>
        <span className={style.filterRow__label}>{label}</span>
        <div className={style.filterRow__chips}>{children}</div>
    </div>
);

export default FilterCard;
