import style from "./PillTabs.module.css";

export type PillTabOption = {
    value: string;
    label: string;
};

type PillTabsProps = {
    options: PillTabOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
};

//a row of pill-shaped tabs where exactly one is selected, ie the session tabs on the Bills page
const PillTabs = ({ options, selectedValue, onSelect }: PillTabsProps) => {
    return (
        <div className={style.pillTabs} role="tablist">
            {options.map((option) => (
                <button
                    key={option.value}
                    role="tab"
                    aria-selected={selectedValue === option.value}
                    className={`${style.pillTab} ${selectedValue === option.value ? style.pillTab__active : ""}`}
                    onClick={() => onSelect(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

export default PillTabs;
