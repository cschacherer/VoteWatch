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
};

export type ActiveFilter = {
    key: string;
    value: string;
    operator?: "contains" | "=" | ">" | "<" | ">=" | "<=";
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
