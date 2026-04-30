import { useState } from "react";
import DataTable from "react-data-table-component";
import FilterPanel from "../../components/FilterPanel/FilterPanel";
import type { ActiveFilter } from "../../models/DataTableUtils";

import "../../styles/global.css";
import style from "./GeneralTable.module.css";

type GeneralTableProps<T> = {
    data: T[];
    columns: (helpers: {
        filterBadgeClick: (key: string, value: string) => void;
    }) => any[];
    defaultSortId: string;
    defaultSortAscending: boolean;
};

export default function GeneralTable<T>({
    data,
    columns,
    defaultSortId,
    defaultSortAscending,
}: GeneralTableProps<T>) {
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
    const [filterText, setFilterText] = useState("");

    function filterBadgeClick(key: string, value: string) {
        setActiveFilters([{ key, value }]);
    }

    const builtColumns = columns({
        filterBadgeClick,
    });

    const filters = builtColumns.map((col) => ({
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

                //set label
                filter.label = column.name;

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

    //Have to use the styles because using styles.generalTable wipe out a lot of the defaults
    //and we just want a couple of properties changes
    const customStyles = {
        headCells: {
            style: {
                padding: "var(--padding-datatable-header)",
                color: "var(--color-datatable-header-font)",
                backgroundColor: "var(--color-datatable-header-bg)",
                fontSize: "var(--font-size-datatable-header)",
            },
        },
        cells: {
            style: {
                padding: "var(--padding-datatable-header)",
                fontSize: "var(--font-size-default)",
            },
        },
    };

    const clearFilters = () => {
        setActiveFilters([]);
    };

    return (
        <div className={style.generalTable__container}>
            <div className={style.generalTable__subHeader}>
                <div className="horizontalRow defaultGap">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button
                        className="defaultButton"
                        onClick={() => setFilterText("")}
                    >
                        Clear
                    </button>
                </div>

                <div className="horizontalRow defaultGap">
                    <FilterPanel
                        filters={filters}
                        activeFilters={activeFilters}
                        onApplyFilters={setActiveFilters}
                    />
                    {activeFilters.length > 0 && (
                        <div
                            className={`horizontalRow defaultGap width100 ${style.generalTable__activeFilterText}`}
                        >
                            <div className="justifySpaceBetween">
                                <div className="horizontalRow defaultGap">
                                    <span className="bold">
                                        Active Filters:
                                    </span>{" "}
                                    {activeFilters.map((f) => (
                                        <div>
                                            <div>
                                                <span key={f.key}>
                                                    {`${f.label}: ${f.value}`}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={clearFilters}
                                    className="defaultButton"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className={style.generalTable__tableWrapper}>
                <DataTable
                    columns={builtColumns}
                    data={filteredData}
                    defaultSortFieldId={defaultSortId}
                    defaultSortAsc={defaultSortAscending}
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
