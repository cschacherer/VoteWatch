import type { ReactNode } from "react";

import style from "./PageHeader.module.css";

export type PageStat = {
    label: string;
    value: string;
};

type PageHeaderProps = {
    eyebrow: string;
    title: string;
    subtitle?: ReactNode;
    stats?: PageStat[];
    //shows a dash in each stat while data is loading
    loading?: boolean;
};

//row of stat cards, ie "1,998 BILLS" - shows a dash in each while loading
export const StatCards = ({
    stats,
    loading = false,
}: {
    stats: PageStat[];
    loading?: boolean;
}) => (
    <div className={style.stats}>
        {stats.map((stat) => (
            <div key={stat.label} className={style.stat}>
                <div className={style.stat__value}>
                    {loading ? "—" : stat.value}
                </div>
                <div className={style.stat__label}>{stat.label}</div>
            </div>
        ))}
    </div>
);

const PageHeader = ({
    eyebrow,
    title,
    subtitle,
    stats = [],
    loading = false,
}: PageHeaderProps) => {
    return (
        <header className={style.header}>
            <div>
                <span className={style.header__eyebrow}>{eyebrow}</span>
                <h1 className={style.header__title}>{title}</h1>
                {subtitle && (
                    <p className={style.header__subtitle}>{subtitle}</p>
                )}
            </div>
            {stats.length > 0 && <StatCards stats={stats} loading={loading} />}
        </header>
    );
};

export default PageHeader;
