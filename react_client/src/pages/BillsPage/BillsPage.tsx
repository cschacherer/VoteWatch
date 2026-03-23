import { useState, useEffect } from "react";
import { getAllBills } from "../../services/billService";
import type { Bill } from "../../models/Bill";
import SortableColumn from "../../components/SortableColumn/SortableColumn";
import SortableHeader from "../../components/SortableHeader/SortableHeader";

import FilterPanel from "../../components/FilterPanel/FilterPanel";

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

import style from "./BillsPage.module.css";

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

    //set all column tables here
    const columns: ColumnDef<Bill>[] = [
        {
            accessorKey: "billId",
            header: ({ column }) => (
                <SortableHeader column={column} title={"Bill Id"} />
            ),
            enableSorting: true,
            size: 100,
            cell: ({ row }) => (
                <a
                    href={`/bills/${row.original.id}`}
                    target="_self"
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                    {row.original.id}
                </a>
            ),
        },
        SortableColumn<Bill>({
            accessorKey: "shortTitle",
            title: "Title",
            size: 250,
        }),
        SortableColumn<Bill>({
            accessorKey: "generalProvisions",
            title: "General Provisions",
            size: 300,
        }),
        SortableColumn<Bill>({
            accessorKey: "highlightedProvisions",
            title: "Highlighted Provisions",
            size: 350,
            collapsibleCell: true,
        }),
        SortableColumn<Bill>({
            accessorKey: "lastAction",
            title: "Last Action",
            size: 150,
        }),
        SortableColumn<Bill>({
            accessorKey: "lastActionDate",
            title: "Last Action Date",
            size: 150,
        }),
        SortableColumn<Bill>({ accessorKey: "year", title: "Year", size: 80 }),
        SortableColumn<Bill>({
            accessorKey: "sessionId",
            title: "Session Id",
            size: 120,
        }),

        SortableColumn<Bill>({
            accessorKey: "subjects",
            title: "Subjects",
            size: 250,
        }),
        {
            accessorKey: "houseVoteUrl",
            header: "House Vote URL",
            size: 100,
            cell: ({ row }) => (
                <a
                    href={row.original.houseVoteUrl}
                    target="_self"
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                    {row.original.houseVoteUrl}
                </a>
            ),
        },
        {
            accessorKey: "senateVoteUrl",
            header: "Senate Vote URL",
            size: 100,
            cell: ({ row }) => (
                <a
                    href={row.original.senateVoteUrl}
                    target="_self"
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                    {row.original.senateVoteUrl}
                </a>
            ),
        },
        {
            accessorKey: "link",
            header: "Utah Gov Link",
            size: 100,
            cell: ({ row }) => (
                <a
                    href={row.original.link}
                    target="_self"
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                    Official Link
                </a>
            ),
        },
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
