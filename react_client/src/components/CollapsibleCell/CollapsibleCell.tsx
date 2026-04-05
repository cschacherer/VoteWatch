import { useState } from "react";
import style from "./CollapsibleCell.module.css";

type CollapsibleCellProps = {
    text: string;
};

const CollapsibleCell = ({ text }: CollapsibleCellProps) => {
    if (!text) return null;

    const [expanded, setExpanded] = useState(false);

    const limit = 200;

    const isLong = text.length > limit;

    const previewText = expanded ? text : text.slice(0, limit);

    return (
        <div>
            <div
                style={{
                    whiteSpace: "pre-wrap",
                }}
            >
                {previewText}
                {!expanded && isLong && "..."}
            </div>

            {isLong && (
                <div className={style.collapsibleCell__container}>
                    <span
                        className={style.collapsibleCell_showMoreButton}
                        onClick={() => setExpanded((prev) => !prev)}
                    >
                        {expanded ? "Show less" : "Show more"}
                    </span>
                </div>
            )}
        </div>
    );
};

export default CollapsibleCell;
