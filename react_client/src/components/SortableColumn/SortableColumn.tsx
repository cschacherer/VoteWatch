import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import SortableHeader from "../../components/SortableHeader/SortableHeader";
import { type ColumnDef, type CellContext } from "@tanstack/react-table";

type SortableColumnProps<T> =
    | {
          accessorKey: keyof T;
          title: string;
          size: number;
          collapsibleCell?: boolean;
      }
    | {
          accessorFn: (row: T) => unknown;
          id: string;
          title: string;
          size: number;
          collapsibleCell?: boolean;
      };

//helper function for creating sortable columns
export default function SortableColumn<T>(
    props: SortableColumnProps<T>,
): ColumnDef<T> {
    const { title, size, collapsibleCell = false } = props;

    const base = {
        header: ({ column }: any) => (
            <SortableHeader column={column} title={title} />
        ),
        enableSorting: true,
        size: size,
        //.../ is the spread operator, which conditionally adds properties to an object (in this case, cell property is only added if collapsibleCell is true)
        ...(collapsibleCell && {
            cell: (info: CellContext<T, unknown>) => (
                <CollapsibleCell text={info.getValue() as string} />
            ),
        }),
    };

    // ✅ flat accessor
    if ("accessorKey" in props) {
        return {
            ...base,
            accessorKey: props.accessorKey as string,
        };
    }

    // ✅ nested accessor
    return {
        ...base,
        accessorFn: props.accessorFn,
        id: props.id,
    };
}
