import { useState, useEffect } from "react";
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
    loading?: boolean;
    //called with the rows currently shown after search + filters are applied
    onFilteredDataChange?: (rows: T[]) => void;
};

export default function GeneralTable<T>({
    data,
    columns,
    defaultSortId,
    defaultSortAscending,
    loading = false,
    onFilteredDataChange,
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

    //filteredData is a new array every render, so this runs every render - parents should only
    //store primitive values from it (like counts) so React can skip re-rendering when nothing changed
    useEffect(() => {
        onFilteredDataChange?.(filteredData);
    });

    //Have to use the styles because using styles.generalTable wipe out a lot of the defaults
    //and we just want a couple of properties changes
    const customStyles = {
        headRow: {
            style: {
                minHeight: "48px",
                borderBottom: "1px solid var(--color-table-border)",
            },
        },
        headCells: {
            style: {
                padding: "var(--padding-datatable-header)",
                color: "var(--color-table-header-text)",
                backgroundColor: "var(--color-table-header-bg)",
                fontSize: "var(--font-size-xs)",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
            },
        },
        rows: {
            style: {
                borderBottom: "1px solid var(--color-table-border)",
            },
            highlightOnHoverStyle: {
                backgroundColor: "var(--color-table-row-hover)",
                borderBottomColor: "var(--color-table-border)",
                outline: "none",
            },
        },
        cells: {
            style: {
                padding: "var(--padding-datatable-header)",
                fontSize: "var(--font-size-sm)",
                color: "#1f2937",
            },
        },
        pagination: {
            style: {
                borderTop: "1px solid var(--color-table-border)",
            },
        },
    };

    const clearFilters = () => {
        setActiveFilters([]);
    };

    return (
        <div className={style.generalTable__container}>
            <div className={style.generalTable__subHeader}>
                <div className={style.generalTable__toolbar}>
                    <div className={style.generalTable__search}>
                        <svg
                            className={style.generalTable__searchIcon}
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <line x1="16.5" y1="16.5" x2="21" y2="21" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                        {filterText && (
                            <button
                                className={style.generalTable__clearSearch}
                                onClick={() => setFilterText("")}
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <FilterPanel
                        filters={filters}
                        activeFilters={activeFilters}
                        onApplyFilters={setActiveFilters}
                    />
                </div>

                {activeFilters.length > 0 && (
                    <div className={style.generalTable__activeFilters}>
                        {activeFilters.map((f, i) => (
                            <span
                                key={`${f.key}-${i}`}
                                className={style.generalTable__filterChip}
                            >
                                <strong>{f.label ?? f.key}:</strong> {f.value}
                                <button
                                    onClick={() =>
                                        setActiveFilters(
                                            activeFilters.filter(
                                                (_, index) => index !== i,
                                            ),
                                        )
                                    }
                                    aria-label={`Remove ${f.label ?? f.key} filter`}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        <button
                            onClick={clearFilters}
                            className={style.generalTable__clearFilters}
                        >
                            Clear all
                        </button>
                    </div>
                )}
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
                    fixedHeader
                    progressPending={loading}
                    progressComponent={
                        <div className={style.generalTable__message}>
                            Loading...
                        </div>
                    }
                    noDataComponent={
                        <div className={style.generalTable__message}>
                            No matching records
                        </div>
                    }
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 20, 50]}
                />
            </div>
        </div>
    );
}
