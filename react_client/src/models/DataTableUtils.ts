export const FilterType = {
    Text: "text",
    Number: "number",
    Select: "select",
} as const;

export type FilterType = (typeof FilterType)[keyof typeof FilterType];

export type FilterConfig = {
    key?: string;
    label?: string;
    type: FilterType;
    options?: string[];
    onApplyFilters?: (filters: ActiveFilter[]) => void;
};

export type FilterableBadge = {
    key?: string;
    value: string;
};

export type ActiveFilter = {
    key: string;
    value: string;
    label?: string;
    operator?: "contains" | "equals" | "=" | ">" | "<" | ">=" | "<=";
};

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

    filterConfig?: FilterConfig;
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

        // handle nested defaults
        filterConfig: column.filterConfig
            ? {
                  type: column.filterConfig.type,
                  options: column.filterConfig.options,
              }
            : undefined,
    };
}

export function sendBadgeFilter(key: string, value: string) {
    const newFilters = [{ key, value }];
    return newFilters;
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
