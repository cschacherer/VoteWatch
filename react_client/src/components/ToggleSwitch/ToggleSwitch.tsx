import style from "./ToggleSwitch.module.css";

type ToggleSwitchProps = {
    label: string;
    title?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
};

//an on/off switch with a label - the real checkbox is visually hidden and the track is drawn with CSS
const ToggleSwitch = ({
    label,
    title,
    checked,
    onChange,
}: ToggleSwitchProps) => (
    <label className={style.toggleSwitch} title={title}>
        <input
            type="checkbox"
            role="switch"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
        />
        <span className={style.toggleSwitch__track}></span>
        {label}
    </label>
);

export default ToggleSwitch;
