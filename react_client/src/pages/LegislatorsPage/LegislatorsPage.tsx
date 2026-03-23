import { useState, useEffect } from "react";
import { getAllLegislators } from "../../services/legislatorService";
import type { Legislator } from "../../models/Legislator";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
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

import style from "./LegislatorsPage.module.css";

const LegislatorsPage = () => {
    const [legislators, setLegislators] = useState<Legislator[]>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    useEffect(() => {
        const fetchBills = async () => {
            try {
                const response = await getAllLegislators();
                console.log(response);
                setLegislators(response);
            } catch (e) {
                if (e instanceof Error) {
                    console.error(
                        `Error getting all legislators: ${e.message}`,
                    );
                } else {
                    console.error("Unknown error getting all legislators", e);
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
        link: boolean = false,
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
    const columns: ColumnDef<Legislator>[] = [
        // createSortableColumn<Legislator>("formatName", "Name", 150),
        {
            accessorKey: "fullName",
            header: ({ column }) => (
                <SortableHeader column={column} title="Name" />
            ),
            size: 150,
            cell: ({ row }) => (
                <a
                    href={`legislators/${row.original.id}`}
                    target="_self"
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                    {row.original.fullName}
                </a>
            ),
        },
        // createSortableColumn<Legislator>("image", "Image", 120),
        {
            accessorKey: "image",
            header: "Image",
            size: 100,
            cell: ({ row }) => (
                <img
                    src={row.original.image}
                    alt={row.original.fullName}
                    style={{ width: 100, borderRadius: "50%" }}
                />
            ),
        },

        createSortableColumn<Legislator>("house", "House", 120),
        createSortableColumn<Legislator>("party", "Party", 120),
        createSortableColumn<Legislator>("district", "District", 120),
        createSortableColumn<Legislator>("counties", "Counties", 180),
        createSortableColumn<Legislator>("email", "Email", 200),
        createSortableColumn<Legislator>("cell", "Cell Phone", 140),
        createSortableColumn<Legislator>("serviceStart", "Service Start", 140),
        // createSortableColumn<Legislator>("link", "Link", 200),
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
        data: legislators,
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
        <div className={style.legislators__pageContainer}>
            <div>
                <h1 className={style.legislators__header}>Legislators!</h1>
            </div>

            {/* Global filter */}
            <input
                className={style.legislators__filter}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search legislators..."
            />

            {/* Specific column filter */}
            <FilterPanel table={responsiveTable} />

            <div className={style.legislators__tableContainer}>
                <table className={style.legislators__table}>
                    <thead>
                        {responsiveTable
                            .getHeaderGroups()
                            .map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className={
                                                style.legislators__colHeader
                                            }
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
                                                className={
                                                    style.legislators__resizer
                                                }
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
                                        className={style.legislators_cell}
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

export default LegislatorsPage;
