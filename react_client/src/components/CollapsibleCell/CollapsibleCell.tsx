import { useState } from "react";
import Badge from "../../components/Badge/Badge";
import { BadgeType } from "../../components/Badge/Badge";

import style from "./CollapsibleCell.module.css";

type CollapsibleCellProps = {
    text?: string;
    items?: string[];
    onBadgeClick?: (value: string) => void;
};

const CollapsibleCell = ({
    text,
    items,
    onBadgeClick,
}: CollapsibleCellProps) => {
    const [expanded, setExpanded] = useState(false);

    if (text) {
        const limit = 150;
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
                            className={style.collapsibleCell_showMoreButtonText}
                            onClick={() => setExpanded((prev) => !prev)}
                        >
                            {expanded ? "Show less" : "Show more"}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    if (items) {
        const limit = 5;
        const isLong = items.length > limit;
        const visibleItems = expanded ? items : items.slice(0, limit);

        return (
            <div>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                    }}
                >
                    {visibleItems.map((item) => (
                        <Badge
                            type={BadgeType.Subjects}
                            value={item}
                            onClick={(value) => onBadgeClick?.(value)}
                        />
                    ))}
                </div>

                {isLong && (
                    <div className={style.collapsibleCell__container}>
                        <span
                            className={style.collapsibleCell_showMoreButton}
                            onClick={() => setExpanded((prev) => !prev)}
                        >
                            {expanded
                                ? "Show less"
                                : `Show more (+${items.length - limit})`}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default CollapsibleCell;
