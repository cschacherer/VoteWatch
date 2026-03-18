import { useState, useEffect } from "react";
import { getAllBills, getBillDetails } from "../../services/billService";
import type { Bill } from "../../models/Bills";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import SortableHeader from "../../components/SortableHeader/SortableHeader";
import FilterPanel from "../../components/FilterPanel/FilterPanel";

import style from "./BillsPage.module.css";

import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
} from "@tanstack/react-table";

const BillsPage = () => {
    const [bills, setBills] = useState<Bill[]>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    useEffect(() => {
        const fetchBills = async () => {
            try {
                const response = await getAllBills();
                console.log(response);
                setBills(response);
            } catch (e) {
                if (e instanceof Error) {
                    console.error(`Error getting all bills: ${e.message}`);
                } else {
                    console.error("Unknown error getting all bills", e);
                }
            }
        };

        fetchBills();
    }, []);

    //helper function for declaring columns
    function createSortableColumn<T>(
        accessorKey: keyof T,
        title: string,
        size: number,
        collapsibleCell: boolean = false,
    ): ColumnDef<T> {
        return {
            accessorKey: accessorKey as string,
            header: ({ column }) => (
                <SortableHeader column={column} title={title} />
            ),
            enableSorting: true,
            size: size,
            //.../ is the spread operator, which conditionally adds properties to an object (in this case, cell property is only added if collapsibleCell is true)
            ...(collapsibleCell && {
                cell: ({ getValue }) => (
                    <CollapsibleCell text={getValue<string>()} />
                ),
            }),
        };
    }

    //set all column tables here
    const columns: ColumnDef<Bill>[] = [
        createSortableColumn<Bill>("id", "Bill Id", 120),
        createSortableColumn<Bill>("shortTitle", "Title", 250),
        createSortableColumn<Bill>(
            "generalProvisions",
            "General Provisions",
            300,
        ),
        createSortableColumn<Bill>(
            "highlightedProvisions",
            "Highlighted Provisions",
            350,
            true,
        ),
        createSortableColumn<Bill>("lastAction", "Last Action", 150),
        createSortableColumn<Bill>("lastActionDate", "Last Action Date", 150),
        createSortableColumn<Bill>("year", "Year", 80),
        createSortableColumn<Bill>("sessionId", "Session Id", 120),
        createSortableColumn<Bill>("link", "Link", 200),
        createSortableColumn<Bill>("subjects", "Subjects", 250),
        createSortableColumn<Bill>("houseVoteUrl", "House Vote URL", 100),
        createSortableColumn<Bill>("senateVoteUrl", "Senate Vote URL", 100),
    ];

    //use tanstack react-table to use a responsive table (ie changing col widths, sorting, etc)
    const responsiveTable = useReactTable({
        data: bills,
        columns,
        state: {
            sorting,
            globalFilter,
            columnFilters,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        filterFns: {},
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        enableColumnResizing: true,
        columnResizeMode: "onChange",
    });

    return (
        <div className={style.bills__pageContainer}>
            <div>
                <h1 className={style.bills__header}>Bills Bills Bills!</h1>
            </div>

            {/* Global filter */}
            <input
                className={style.bills__filter}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search bills..."
            />

            {/* Specific column filter */}
            <FilterPanel table={responsiveTable} />

            <div className={style.bills__tableContainer}>
                <table className={style.bills__table}>
                    <thead>
                        {responsiveTable
                            .getHeaderGroups()
                            .map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className={style.bills__colHeader}
                                            style={{
                                                width: header.getSize(),
                                            }} //need this to resize column width
                                        >
                                            <div>
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext(),
                                                )}
                                            </div>

                                            {/* Resize column handle */}
                                            <div
                                                onMouseDown={header.getResizeHandler()}
                                                onTouchStart={header.getResizeHandler()}
                                                className={style.bills__resizer}
                                            />
                                        </th>
                                    ))}
                                </tr>
                            ))}
                    </thead>

                    <tbody>
                        {responsiveTable.getRowModel().rows.map((row) => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className={style.bills_cell}
                                        title={cell.getValue() as string}
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext(),
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BillsPage;
