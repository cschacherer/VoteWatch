import { useState } from "react";
import { Modal } from "react-bootstrap";
import { type Table } from "@tanstack/react-table";

import style from "./FilterPanel.module.css";

type FilterPanelProps<TData> = {
    table: Table<TData>;
};

const FilterPanel = <TData,>({ table }: FilterPanelProps<TData>) => {
    const [open, setOpen] = useState(false);

    const [draftFilters, setDraftFilters] = useState(
        table.getState().columnFilters,
    );

    const addOneFilter = () => {
        if (draftFilters.length == 0)
            setDraftFilters(() => [{ id: "", value: "" }]);
    };
    addOneFilter();

    const addFilter = () => {
        setDraftFilters((prev) => [...prev, { id: "", value: "" }]);
    };

    const updateFilter = (index: number, key: string, value: string) => {
        setDraftFilters((old) =>
            old.map((f, i) => (i === index ? { ...f, [key]: value } : f)),
        );
    };

    const removeFilter = (index: number) => {
        setDraftFilters((old) => old.filter((_, i) => i !== index));
    };

    const submitTableFilters = () => {
        table.setColumnFilters(draftFilters); // 🚀 apply all at once
        setOpen(false); // close modal
    };

    const leafColumns = table.getAllLeafColumns();
    console.log(leafColumns);

    return (
        <div>
            <button
                className={style.filterPanel__showFiltersButton}
                onClick={() => setOpen(true)}
            >
                Filters ({table.getState().columnFilters.length})
            </button>
            {open && (
                <Modal
                    show={open}
                    onHide={() => setOpen(false)}
                    size="lg"
                    backdrop="static"
                    centered
                >
                    <Modal.Header
                        className={style.filterPanel__header}
                        closeButton
                    >
                        <div className={style.filterPanel__headerText}>
                            Filter Table
                        </div>
                    </Modal.Header>
                    <Modal.Body>
                        <div className={style.filterPanel__container}>
                            <div className={style.filterPanel__subContainer}>
                                {draftFilters.map((filter, i) => (
                                    <div
                                        key={i}
                                        className={style.filterPanel__filterRow}
                                    >
                                        {/* Column selector */}
                                        <select
                                            className={
                                                style.filterPanel__columnSelector
                                            }
                                            value={filter.id}
                                            onChange={(e) =>
                                                updateFilter(
                                                    i,
                                                    "id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select column
                                            </option>
                                            {table
                                                .getAllLeafColumns()
                                                .map((col) => (
                                                    <option
                                                        key={col.id}
                                                        value={col.id}
                                                    >
                                                        {col.id}
                                                    </option>
                                                ))}
                                        </select>

                                        {/* Value input */}
                                        <input
                                            className={
                                                style.filterPanel__valueTextbox
                                            }
                                            value={String(filter.value) ?? ""}
                                            onChange={(e) =>
                                                updateFilter(
                                                    i,
                                                    "value",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Value"
                                        />

                                        <button
                                            className={
                                                style.filterPanel__deleteFilterButton
                                            }
                                            onClick={() => removeFilter(i)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                className={style.filterPanel__addFilterButton}
                                onClick={addFilter}
                            >
                                + Add Filter
                            </button>

                            <button
                                className={style.filterPanel__filterAllButton}
                                onClick={submitTableFilters}
                            >
                                Filter Table
                            </button>
                        </div>
                    </Modal.Body>
                </Modal>
            )}
        </div>
    );
};

export default FilterPanel;
