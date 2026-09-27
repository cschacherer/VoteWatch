//filtering lives in each page's own filters (FilterCard chips and dropdowns) - clicking a value in a
//table cell selects the matching page filter, so columns only describe how to display and sort
export type DataTableColumn<T> = {
    id: string;
    name: string;
    selector: (row: T) => any;

    //optional
    sortable?: boolean;
    wrap?: boolean;
    grow?: number;
    width?: string;
    minWidth?: string;
    maxWidth?: string;
    omit?: boolean;

    cell?: (row: T) => React.ReactNode;

    //the text this column shows, for the table search - only needed when the cell displays something
    //different from selector (ie a bill cell shows the number, title, and session). Hidden (omit)
    //columns are never searched
    searchText?: (row: T) => string | number | (string | number)[];
};

export function createDataTableColumn<T>(
    column: Partial<DataTableColumn<T>> & {
        id: string;
        name: string;
        selector: (row: T) => any;
    },
): DataTableColumn<T> {
    return {
        sortable: true,
        wrap: true,
        grow: 1,
        omit: false,

        // allow overrides
        ...column,
    };
}

export function formatDate(dateString?: string | null) {
    if (!dateString) return "N/A";

    const normalizedDateString = dateString.replace("T0:", "T00:");

    const date = new Date(normalizedDateString);

    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const year = date.getUTCFullYear();

    return `${month}/${day}/${year}`;
}
