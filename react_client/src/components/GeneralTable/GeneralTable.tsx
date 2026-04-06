import { useState } from "react";
import DataTable from "react-data-table-component";
import FilterPanel from "../../components/FilterPanel/FilterPanel";
import type { ActiveFilter } from "../../models/DataTableUtils";
import { BadgeType } from "../Badge/Badge";
import type { DataTableColumn } from "../../models/DataTableUtils";

import style from "./GeneralTable.module.css";

type GeneralTableProps<T> = {
    data: T[];
    columns: (helpers: {
        filterBadgeClick: (key: string, value: string) => void;
    }) => any[];
    defaultSortId: string;
};

export default function GeneralTable<T>({
    data,
    columns,
    defaultSortId,
}: GeneralTableProps<T>) {
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
    const [filterText, setFilterText] = useState("");

    function filterBadgeClick(key: string, value: string) {
        setActiveFilters([{ key, value }]);
        // setActiveFilters((prev) => {
        //     const exists = prev.find((f) => f.key === key && f.value === value);

        //     if (exists) {
        //         return prev.filter(
        //             (f) => !(f.key === key && f.value === value),
        //         );
        //     }

        //     return [...prev, { key, value }];
        // });
    }

    const builtColumns = columns({
        filterBadgeClick,
    });

    const filters = builtColumns
        .filter((col) => col.filterConfig)
        .map((col) => ({
            key: col.id,
            label: col.name,
            type: col.filterConfig!.type,
            options: col.filterConfig!.options!,
            onApplyFilters: setActiveFilters,
        }));

    function matchesSearch(obj: any, search: string): boolean {
        if (!obj) return false;

        // primitive values
        if (typeof obj === "string" || typeof obj === "number") {
            return String(obj).toLowerCase().includes(search);
        }

        // arrays
        if (Array.isArray(obj)) {
            return obj.some((item) => matchesSearch(item, search));
        }

        // objects
        if (typeof obj === "object") {
            return Object.values(obj).some((value) =>
                matchesSearch(value, search),
            );
        }

        return false;
    }

    //this is the data that will actually appear in the DataTable - we pre filter it.
    const filteredData = data
        .filter((row) => matchesSearch(row, filterText.toLowerCase()))
        .filter((row) =>
            activeFilters.every((filter) => {
                if (!filter.key || !filter.value) return true;

                const column = builtColumns.find((c) => c.id === filter.key);
                if (!column) return true;

                const value = column.selector(row);

                //number filter
                if (filter.operator && !isNaN(Number(value))) {
                    const rowVal = Number(value);
                    const filterVal = Number(filter.value);

                    switch (filter.operator) {
                        case "=":
                            return rowVal === filterVal;
                        case ">":
                            return rowVal > filterVal;
                        case "<":
                            return rowVal < filterVal;
                        case ">=":
                            return rowVal >= filterVal;
                        case "<=":
                            return rowVal <= filterVal;
                    }
                }

                // array filter (for subjects)
                if (Array.isArray(value)) {
                    return value.some(
                        (v) =>
                            String(v).toLowerCase() ===
                            filter.value.toLowerCase(),
                    );
                }

                //string filter
                return String(value ?? "")
                    .toLowerCase()
                    .includes(filter.value.toLowerCase());
            }),
        );

    const customStyles = {
        headCells: {
            style: {
                padding: "16px",
                color: "white",
                backgroundColor: "#525252",
                fontSize: "16px",
            },
        },
        cells: {
            style: {
                padding: "16px",
                fontSize: "14px",
            },
        },
    };

    return (
        <div className={style.generalTable__container}>
            <div className={style.generalTable__subHeader}>
                <input
                    className={style.generalTable__searchBar}
                    type="text"
                    placeholder="Search..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    style={{ flex: 1 }}
                />

                <FilterPanel
                    filters={filters}
                    activeFilters={activeFilters}
                    onApplyFilters={setActiveFilters}
                />
            </div>
            <div className={style.generalTable__tableWrapper}>
                <DataTable
                    columns={builtColumns}
                    data={filteredData}
                    defaultSortFieldId={defaultSortId}
                    defaultSortAsc={true}
                    customStyles={customStyles}
                    responsive
                    highlightOnHover
                    striped
                    fixedHeader
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 20, 50]}
                />
            </div>
        </div>
    );
}
