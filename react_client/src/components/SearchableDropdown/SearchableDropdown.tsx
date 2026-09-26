import { useState, useEffect, useRef } from "react";

import style from "./SearchableDropdown.module.css";

export type DropdownOption = {
    value: string;
    label: string;
    count?: number;
};

type SearchableDropdownProps = {
    options: DropdownOption[];
    selectedValue: string | null;
    onSelect: (value: string | null) => void;
    //label for the "no selection" option, ie "All Subjects"
    allLabel: string;
    searchPlaceholder?: string;
};

//a dropdown button that opens a searchable list - for option lists too long for chips or a plain <select>
export default function SearchableDropdown({
    options,
    selectedValue,
    onSelect,
    allLabel,
    searchPlaceholder = "Search...",
}: SearchableDropdownProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    //index into visibleOptions, where 0 is the "all" option
    const [highlightIndex, setHighlightIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedOption = options.find((o) => o.value === selectedValue);

    const searchText = query.trim().toLowerCase();
    const matchingOptions = searchText
        ? options.filter((o) => o.label.toLowerCase().includes(searchText))
        : options;
    //null is the "all" option
    const visibleOptions: (DropdownOption | null)[] = [
        null,
        ...matchingOptions,
    ];

    const close = () => {
        setOpen(false);
        setQuery("");
    };

    const choose = (option: DropdownOption | null) => {
        onSelect(option ? option.value : null);
        close();
    };

    //close when clicking anywhere outside the dropdown
    useEffect(() => {
        if (!open) return;

        const handleMouseDown = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                close();
            }
        };

        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [open]);

    //keep the highlighted option scrolled into view while using the arrow keys
    useEffect(() => {
        const item = listRef.current?.children[highlightIndex] as
            HTMLElement | undefined;
        item?.scrollIntoView({ block: "nearest" });
    }, [highlightIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((i) =>
                Math.min(i + 1, visibleOptions.length - 1),
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            choose(visibleOptions[highlightIndex] ?? null);
        } else if (e.key === "Escape") {
            close();
        }
    };

    return (
        <div className={style.dropdown} ref={containerRef}>
            <button
                type="button"
                className={`${style.dropdown__button} ${selectedOption || selectedValue ? style.dropdown__buttonActive : ""}`}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => {
                    setHighlightIndex(0);
                    setOpen((prev) => !prev);
                }}
            >
                <span className={style.dropdown__buttonLabel}>
                    {selectedOption?.label ?? selectedValue ?? allLabel}
                </span>
                {selectedOption?.count !== undefined && (
                    <span className={style.dropdown__count}>
                        {selectedOption.count}
                    </span>
                )}
                <svg
                    className={`${style.dropdown__chevron} ${open ? style.dropdown__chevronOpen : ""}`}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {selectedValue && (
                <button
                    type="button"
                    className={style.dropdown__clear}
                    onClick={() => onSelect(null)}
                    aria-label={`Clear selection, show ${allLabel}`}
                >
                    ×
                </button>
            )}

            {open && (
                <div className={style.dropdown__panel}>
                    <input
                        autoFocus
                        type="text"
                        className={style.dropdown__search}
                        placeholder={searchPlaceholder}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setHighlightIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                    />
                    <ul
                        className={style.dropdown__list}
                        role="listbox"
                        ref={listRef}
                    >
                        {visibleOptions.map((option, index) => {
                            const isSelected = option
                                ? option.value === selectedValue
                                : !selectedValue;
                            return (
                                <li
                                    key={option?.value ?? "__all__"}
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`${style.dropdown__option} ${index === highlightIndex ? style.dropdown__optionHighlighted : ""} ${isSelected ? style.dropdown__optionSelected : ""}`}
                                    onMouseEnter={() =>
                                        setHighlightIndex(index)
                                    }
                                    onClick={() => choose(option)}
                                >
                                    <span>{option?.label ?? allLabel}</span>
                                    {option?.count !== undefined && (
                                        <span className={style.dropdown__count}>
                                            {option.count}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    {matchingOptions.length === 0 && (
                        <div className={style.dropdown__empty}>
                            No matches for "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
