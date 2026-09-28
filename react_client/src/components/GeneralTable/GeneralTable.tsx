import { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { StyleSheetManager } from "styled-components";
//a dependency of styled-components 6 - the filter its docs recommend for libraries built on v5
import isPropValid from "@emotion/is-prop-valid";
import type { DataTableColumn } from "../../models/DataTableUtils";

import "../../styles/global.css";
import style from "./GeneralTable.module.css";

// ----- SEARCH HIGHLIGHTING -----
//matches are painted with the CSS Custom Highlight API (styled by ::highlight(table-search) in global.css).
//It highlights text ranges without changing the DOM, so it works inside any cell component
//(BillCell, PolicyChip, badges...) and doesn't fight React over the markup
const SEARCH_HIGHLIGHT = "table-search";
//queries shorter than this still filter the rows, but one letter would highlight half the table
const MIN_HIGHLIGHT_LENGTH = 3;

//ranges from every table on the page - a page can have more than one GeneralTable, and they all
//share the one named highlight
const searchRangesByTable = new Map<symbol, Range[]>();

function paintSearchHighlights() {
    const ranges = [...searchRangesByTable.values()].flat();
    if (ranges.length > 0) {
        CSS.highlights.set(SEARCH_HIGHLIGHT, new Highlight(...ranges));
    } else {
        CSS.highlights.delete(SEARCH_HIGHLIGHT);
    }
}

//every case-insensitive match of query in the text inside root (matches split across two elements,
//ie a chip's label and its count, aren't found)
function findTextMatches(root: Node, query: string): Range[] {
    const ranges: Range[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent?.toLowerCase() ?? "";
        let index = text.indexOf(query);
        while (index !== -1) {
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + query.length);
            ranges.push(range);
            index = text.indexOf(query, index + query.length);
        }
    }

    return ranges;
}

type GeneralTableProps<T> = {
    //already filtered by the page's own filters - the table only adds free-text search
    data: T[];
    columns: DataTableColumn<T>[];
    defaultSortId: string;
    defaultSortAscending: boolean;
    loading?: boolean;
    //called with the rows currently shown after search is applied
    onFilteredDataChange?: (rows: T[]) => void;
    //row property with a unique value, used as the React key - duplicate keys leave stale rows on screen
    keyField?: string;
};

//only real HTML attributes reach DOM elements - custom components still get every prop
const forwardValidProps = (prop: string, target: unknown) =>
    typeof target === "string" ? isPropValid(prop) : true;

export default function GeneralTable<T>({
    data,
    columns,
    defaultSortId,
    defaultSortAscending,
    loading = false,
    onFilteredDataChange,
    keyField = "id",
}: GeneralTableProps<T>) {
    const [filterText, setFilterText] = useState("");

    const tableRef = useRef<HTMLDivElement>(null);
    const tableId = useRef(Symbol("GeneralTable")).current;

    //highlight the search text in the visible cells - re-runs when the table's DOM changes (paging,
    //sorting, "Show more"), since those happen inside DataTable without re-rendering this component
    useEffect(() => {
        const table = tableRef.current;
        //older browsers without the Highlight API just don't get highlighting
        if (!table || !("highlights" in CSS)) return;

        const query = filterText.toLowerCase();

        const highlightMatches = () => {
            const body = table.querySelector(".rdt_TableBody") ?? table;
            searchRangesByTable.set(
                tableId,
                query.trim().length >= MIN_HIGHLIGHT_LENGTH
                    ? findTextMatches(body, query)
                    : [],
            );
            paintSearchHighlights();
        };

        highlightMatches();

        //batch bursts of DOM changes into one re-scan per frame
        let frame = 0;
        const observer = new MutationObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(highlightMatches);
        });
        observer.observe(table, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
            searchRangesByTable.delete(tableId);
            paintSearchHighlights();
        };
    }, [filterText, tableId]);

    //search only looks at what the table shows: each visible column's searchText, or its selector value
    //when that's plain text/numbers. Objects are skipped so hidden fields (ie a bill's full text) never match
    const toSearchStrings = (value: unknown): string[] => {
        if (typeof value === "string" || typeof value === "number") {
            return [String(value)];
        }
        if (Array.isArray(value)) {
            return value.flatMap(toSearchStrings);
        }
        return [];
    };

    const visibleColumns = columns.filter((column) => !column.omit);

    const matchesSearch = (row: T, search: string) =>
        visibleColumns.some((column) =>
            toSearchStrings(
                column.searchText
                    ? column.searchText(row)
                    : column.selector(row),
            ).some((text) => text.toLowerCase().includes(search)),
        );

    //this is the data that will actually appear in the DataTable - we pre filter it.
    const search = filterText.trim().toLowerCase();
    const filteredData = search
        ? data.filter((row) => matchesSearch(row, search))
        : data;

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
                fontSize: "var(--font-size-sm)",
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

    return (
        <div className={style.generalTable__container}>
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
            <div className={style.generalTable__tableWrapper} ref={tableRef}>
                {/* react-data-table-component 7 hands column settings (grow, minWidth, ...) to styled-components,
                    and styled-components 6 no longer filters them - without this, React warns about
                    unknown props on DOM elements */}
                <StyleSheetManager shouldForwardProp={forwardValidProps}>
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        keyField={keyField}
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
                </StyleSheetManager>
            </div>
        </div>
    );
}
