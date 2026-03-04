import { useState } from "react";

type CollapsibleCellProps = {
    text: string;
    collapsedHeight?: number;
};

const CollapsibleCell = ({ text }: CollapsibleCellProps) => {
    const [expanded, setExpanded] = useState(() => text.length <= 300);

    if (!text) return null;

    return (
        <div>
            <div className={expanded ? "cellExpanded" : "cellCollapsed"}>
                {text}
            </div>

            {expanded && (
                <button
                    type="button"
                    className="cellToggle"
                    onClick={() => setExpanded((v) => !v)}
                >
                    {expanded ? "Show less" : "Show more"}
                </button>
            )}
        </div>
    );
};

export default CollapsibleCell;
