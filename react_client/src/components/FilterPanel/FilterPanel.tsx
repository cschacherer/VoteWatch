import { useState } from "react";
import { Modal } from "react-bootstrap";
import type { FilterConfig, ActiveFilter } from "../../models/DataTableUtils";

import style from "./FilterPanel.module.css";

type FilterPanelProps = {
    filters: FilterConfig[];
    activeFilters: ActiveFilter[];
    onApplyFilters: (filters: ActiveFilter[]) => void;
};

export default function FilterPanel({
    filters,
    activeFilters,
    onApplyFilters,
}: FilterPanelProps) {
    const [open, setOpen] = useState(false);
    const [draftFilters, setDraftFilters] = useState<ActiveFilter[]>(
        activeFilters.length ? activeFilters : [{ key: "", value: "" }],
    );

    const addFilter = () => {
        setDraftFilters((prev) => [...prev, { key: "", value: "" }]);
    };

    const updateFilter = (
        index: number,
        field: "key" | "value",
        value: string,
    ) => {
        setDraftFilters((old) =>
            old.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
        );
    };

    const removeFilter = (index: number) => {
        setDraftFilters((old) => old.filter((_, i) => i !== index));
    };

    const applyFilters = () => {
        const cleaned = draftFilters.filter((f) => f.key && f.value);

        onApplyFilters(cleaned);
        setOpen(false);
    };

    const clearFilters = () => {
        onApplyFilters([]);
        setOpen(false);
    };

    return (
        <div>
            <button
                className={`defaultButton ${style.filterPanel__showFiltersButton}`}
                onClick={() => setOpen(true)}
            >
                Filters ({activeFilters.length})
            </button>
            {open && (
                <Modal
                    show={open}
                    onHide={() => setOpen(false)}
                    size="lg"
                    backdrop="static"
                    centered
                >
                    <Modal.Header closeButton>
                        <div className={style.filterPanel__headerText}>
                            Filter Table
                        </div>
                    </Modal.Header>
                    <Modal.Body>
                        <div className={style.filterPanel__container}>
                            <div className={style.filterPanel__subContainer}>
                                {draftFilters.map((filter, i) => {
                                    const config = filters.find(
                                        (f) => f.key === filter.key,
                                    );

                                    return (
                                        <div
                                            key={i}
                                            className={
                                                style.filterPanel__filterRow
                                            }
                                        >
                                            {/* Column selector */}
                                            <select
                                                className={`defaultDropdown ${style.filterPanel__columnSelector}`}
                                                value={filter.key}
                                                onChange={(e) =>
                                                    updateFilter(
                                                        i,
                                                        "key",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Select column
                                                </option>
                                                {filters.map((f) => (
                                                    <option
                                                        key={f.key}
                                                        value={f.key}
                                                    >
                                                        {f.label}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Dropdown Value */}
                                            {config?.type === "select" ? (
                                                <select
                                                    className={`defaultDropdown ${style.filterPanel__valueDropdown}`}
                                                    value={filter.value}
                                                    onChange={(e) =>
                                                        updateFilter(
                                                            i,
                                                            "value",
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Select value
                                                    </option>
                                                    {config.options?.map(
                                                        (opt) => (
                                                            <option
                                                                key={opt}
                                                                value={opt}
                                                            >
                                                                {opt}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            ) : // Number Value
                                            config?.type === "number" ? (
                                                <>
                                                    {/* Operator dropdown */}
                                                    <select
                                                        className={
                                                            style.filterPanel__operatorDropdown
                                                        }
                                                        value={
                                                            filter.operator ??
                                                            "="
                                                        }
                                                        onChange={(e) =>
                                                            setDraftFilters(
                                                                (old) =>
                                                                    old.map(
                                                                        (
                                                                            f,
                                                                            idx,
                                                                        ) =>
                                                                            idx ===
                                                                            i
                                                                                ? {
                                                                                      ...f,
                                                                                      operator:
                                                                                          e
                                                                                              .target
                                                                                              .value as ActiveFilter["operator"],
                                                                                  }
                                                                                : f,
                                                                    ),
                                                            )
                                                        }
                                                    >
                                                        <option value="=">
                                                            =
                                                        </option>
                                                        <option value=">">
                                                            {">"}
                                                        </option>
                                                        <option value="<">
                                                            {"<"}
                                                        </option>
                                                        <option value=">=">
                                                            {">="}
                                                        </option>
                                                        <option value="<=">
                                                            {"<="}
                                                        </option>
                                                    </select>

                                                    {/* Number input */}
                                                    <input
                                                        type="number"
                                                        className={
                                                            style.filterPanel__valueTextbox
                                                        }
                                                        value={filter.value}
                                                        onChange={(e) =>
                                                            updateFilter(
                                                                i,
                                                                "value",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Value"
                                                    />
                                                </>
                                            ) : (
                                                //String value textbox
                                                <input
                                                    className={`defaultTextInput ${style.filterPanel__valueTextbox}`}
                                                    value={filter.value}
                                                    onChange={(e) =>
                                                        updateFilter(
                                                            i,
                                                            "value",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Value"
                                                />
                                            )}
                                            <button
                                                className={`defaultButton ${style.filterPanel__deleteFilterButton}`}
                                                onClick={() => removeFilter(i)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Add Filter button */}
                            <button
                                className={`defaultButton ${style.filterPanel__addFilterButton}`}
                                onClick={addFilter}
                            >
                                + Add Filter
                            </button>

                            <div className={style.filterPanel__bottomButtons}>
                                {/* Filter All button */}
                                <button
                                    className={`defaultButton ${style.filterPanel__bottomFilterButton}`}
                                    onClick={applyFilters}
                                >
                                    Apply Filters
                                </button>
                                {/* Clear Filters button */}
                                <button
                                    className={`defaultButton ${style.filterPanel__bottomFilterButton}`}
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </Modal.Body>
                </Modal>
            )}
        </div>
    );
}
