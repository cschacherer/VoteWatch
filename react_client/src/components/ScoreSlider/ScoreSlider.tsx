import React from "react";
import "./ScoreSlider.css";

type ScoreSliderProps = {
    value: number | string | null | undefined;
    label?: string;
    showValueLabel?: boolean;
};

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function toValidNumber(value: number | string | null | undefined) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function getScoreColor(value: number) {
    const percent = clamp(value, 0, 100) / 100;

    const red = Math.round(255 * (1 - percent));
    const green = Math.round(180 * percent);

    return `rgb(${red}, ${green}, 0)`;
}

export function ScoreSlider({
    value,
    label,
    showValueLabel = true,
}: ScoreSliderProps) {
    const numericValue = clamp(toValidNumber(value), 0, 100);
    const percent = numericValue;
    const selectedColor = getScoreColor(numericValue);

    return (
        <div className="ScoreSlider">
            <div
                className="ScoreSlider__track"
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={numericValue}
                aria-readonly="true"
                style={{
                    background: `linear-gradient(
            to right,
            ${selectedColor} 0%,
            ${selectedColor} ${percent}%,
            #b8d6ee ${percent}%,
            #b8d6ee 100%
          )`,
                }}
            >
                <div
                    className="ScoreSlider__thumb"
                    style={{
                        left: `${percent.toFixed(0)}%`,
                        backgroundColor: selectedColor,
                    }}
                />

                {showValueLabel && (
                    <div
                        className="ScoreSlider__label"
                        style={{
                            left: `${percent.toFixed(0)}%`,
                            color: selectedColor,
                        }}
                    >
                        {label ?? numericValue}
                    </div>
                )}
            </div>
        </div>
    );
}
