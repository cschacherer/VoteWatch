import { useState } from "react";
import style from "./CollapsibleCell.module.css";

type CollapsibleCellProps = {
    text: string;
    lines?: number;
};

const CollapsibleCell = ({ text }: CollapsibleCellProps) => {
    if (!text) return null;

    const linesShown = 5;
    const isLongText = text.length > 150;
    const [isExpanded, setIsExpanded] = useState(!isLongText);

    return (
        <div>
            <div
                className={
                    isExpanded
                        ? style.collapsibleCell__cellExpanded
                        : style.collapsibleCell__cellCollapsed
                }
                style={
                    !isExpanded ? { WebkitLineClamp: linesShown } : undefined
                }
            >
                {text}
            </div>

            {isLongText && (
                <button
                    type="button"
                    className={style.collapsibleCell__toggleButton}
                    onClick={() => setIsExpanded((v) => !v)}
                >
                    {isExpanded ? "Show less" : "Show more"}
                </button>
            )}
        </div>
    );
};

export default CollapsibleCell;
