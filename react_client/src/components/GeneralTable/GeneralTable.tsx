import { useState } from "react";
import DataTable from "react-data-table-component";
import type { ActiveFilter } from "../FilterPanel/FilterPanel";
import FilterPanel from "../../components/FilterPanel/FilterPanel";

import style from "./GeneralTable.module.css";

type GeneralTableProps<T> = {
    data: T[];
    columns: any[];
    filters: any[];
};

export default function GeneralTable<T>({
    data,
    columns,
    filters,
}: GeneralTableProps<T>) {
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
    const [filterText, setFilterText] = useState("");

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

    function getValue(obj: any, path: string) {
        return path.split(".").reduce((acc, key) => acc?.[key], obj);
    }

    //this is the data that will actually appear in the DataTable - we pre filter it.
    const filteredData = data
        .filter((row) => matchesSearch(row, filterText.toLowerCase()))
        .filter((row) =>
            activeFilters.every((filter) => {
                if (!filter.key || !filter.value) return true;

                const rawValue = getValue(row, filter.key);

                //number filter
                if (filter.operator && !isNaN(Number(rawValue))) {
                    const rowVal = Number(rawValue);
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

                //test
                return String(rawValue ?? "")
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
            <div className={style.generalTable__tableWrapper}>
                <DataTable
                    columns={columns}
                    data={filteredData}
                    customStyles={customStyles}
                    responsive
                    highlightOnHover
                    striped
                    fixedHeader
                    fixedHeaderScrollHeight="600px"
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 20, 50]}
                    subHeader
                    subHeaderComponent={
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
                    }
                />
            </div>
        </div>
    );
}
