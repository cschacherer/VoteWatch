import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import SortableHeader from "../../components/SortableHeader/SortableHeader";

import { type ColumnDef } from "@tanstack/react-table";

type SortableColumnProps<T> = {
    accessorKey: keyof T;
    title: string;
    size: number;
    collapsibleCell?: boolean;
};

//helper function for creating sortable columns
export default function SortableColumn<T>({
    accessorKey,
    title,
    size,
    collapsibleCell = false,
}: SortableColumnProps<T>): ColumnDef<T> {
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
