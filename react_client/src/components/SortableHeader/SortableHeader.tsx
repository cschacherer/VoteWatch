import type { Column } from "@tanstack/react-table";
import defaultSortIcon from "../../assets/icons8-sort.png";
import upSortIcon from "../../assets/icons8-sort-up.png";
import downSortIcon from "../../assets/icons8-sort-down.png";
import style from "./SortableHeader.module.css";

type Props<T> = {
    column: Column<T, unknown>;
    title: string;
};

export default function SortableHeader<T>({ column, title }: Props<T>) {
    const sorted = column.getIsSorted();

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                justifyContent: "space-between",
            }}
        >
            <span>{title}</span>

            <button
                onClick={column.getToggleSortingHandler()}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                {sorted === "asc" && (
                    <img
                        src={upSortIcon}
                        className={style.sortableHeader__icon}
                    />
                )}
                {sorted === "desc" && (
                    <img
                        src={downSortIcon}
                        className={style.sortableHeader__icon}
                    />
                )}
                {!sorted && (
                    <img
                        src={defaultSortIcon}
                        className={style.sortableHeader__icon}
                    />
                )}
            </button>
        </div>
    );
}
