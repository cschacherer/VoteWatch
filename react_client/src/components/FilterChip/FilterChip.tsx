import style from "./FilterChip.module.css";

type FilterChipProps = {
    label: string;
    count?: number;
    active: boolean;
    onClick: () => void;
};

//a selectable chip with an optional count - used in FilterRow
const FilterChip = ({ label, count, active, onClick }: FilterChipProps) => (
    <button
        className={`${style.filterChip} ${active ? style.filterChip__active : ""}`}
        aria-pressed={active}
        onClick={onClick}
    >
        {label}
        {count !== undefined && (
            <span className={style.filterChip__count}>{count}</span>
        )}
    </button>
);

export default FilterChip;
