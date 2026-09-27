import FilterChip from "../FilterChip/FilterChip";
import SearchableDropdown, {
    type DropdownOption,
} from "../SearchableDropdown/SearchableDropdown";

import style from "./ChipSelect.module.css";

type ChipSelectProps = {
    options: DropdownOption[];
    selectedValue: string | null;
    onSelect: (value: string | null) => void;
    //label for the "no selection" chip / option, ie "All Topics"
    allLabel: string;
    searchPlaceholder?: string;
};

//a single-select filter that shows every option as a chip on wider screens and switches to a
//searchable dropdown on phones, where a long row of chips would push the page content far down.
//Clicking the selected chip again clears it. Both versions are rendered and CSS shows one.
const ChipSelect = ({
    options,
    selectedValue,
    onSelect,
    allLabel,
    searchPlaceholder,
}: ChipSelectProps) => (
    <>
        <div className={style.chips}>
            <FilterChip
                label={allLabel}
                active={!selectedValue}
                onClick={() => onSelect(null)}
            />
            {options.map((option) => (
                <FilterChip
                    key={option.value}
                    label={option.label}
                    count={option.count}
                    active={selectedValue === option.value}
                    onClick={() =>
                        onSelect(
                            selectedValue === option.value
                                ? null
                                : option.value,
                        )
                    }
                />
            ))}
        </div>
        <div className={style.dropdown}>
            <SearchableDropdown
                options={options}
                selectedValue={selectedValue}
                onSelect={onSelect}
                allLabel={allLabel}
                searchPlaceholder={searchPlaceholder}
            />
        </div>
    </>
);

export default ChipSelect;
