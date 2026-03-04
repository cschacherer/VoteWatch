import { useState, useEffect } from "react";
import { getAllBills, getBillDetails } from "../../services/billService";
import type { Bill } from "../../models/Bills";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";

import style from "./BillsPage.module.css";

import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from "@tanstack/react-table";

const BillsPage = () => {
    const [bills, setBills] = useState<Bill[]>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

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
        { accessorKey: "id", header: "Bill Id", size: 120 },
        { accessorKey: "shortTitle", header: "Title", size: 250 },
        {
            accessorKey: "generalProvisions",
            header: "General Provisions",
            size: 300,
        },
        {
            accessorKey: "highlightedProvisions",
            header: "Highlighted Provisions",
            size: 300,
            cell: ({ getValue }) => (
                <CollapsibleCell text={getValue<string>()} />
            ),
        },
        { accessorKey: "lastAction", header: "Last Action", size: 200 },
        {
            accessorKey: "lastActionDate",
            header: "Last Action Date",
            size: 150,
        },
        { accessorKey: "year", header: "Year", size: 80 },
        { accessorKey: "sessionId", header: "Session Id", size: 120 },
        { accessorKey: "link", header: "Link", size: 200 },
        { accessorKey: "subjects", header: "Subjects", size: 250 },
        { accessorKey: "houseVoteUrl", header: "House Vote URL", size: 200 },
        { accessorKey: "senateVoteUrl", header: "Senate Vote URL", size: 200 },
    ];

    //use tanstack react-table to use a responsive table (ie changing col widths, sorting, etc)
    const responsiveTable = useReactTable({
        data: bills,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableColumnResizing: true,
        columnResizeMode: "onChange",
    });

    return (
        <div className={style.bills__pageContainer}>
            <div>
                <h1>Bills Bills Bills!</h1>
            </div>

            {/* Global filter */}
            <input
                className={style.bills__filter}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search bills..."
            />

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
                                            style={{ width: header.getSize() }} //need this to resize column width
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div>
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext(),
                                                )}
                                                {{
                                                    asc: " 🔼",
                                                    desc: " 🔽",
                                                }[
                                                    header.column.getIsSorted() as string
                                                ] ?? null}
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
                                        className={style.cell}
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
