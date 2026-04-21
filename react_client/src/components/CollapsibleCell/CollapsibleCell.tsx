import { useState } from "react";
import Badge from "../../components/Badge/Badge";
import { BadgeType } from "../../components/Badge/Badge";

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
            <div className="verticalStack defaultGap">
                <div className="preWrap">
                    {previewText}
                    {!expanded && isLong && "..."}
                </div>

                {isLong && (
                    <div>
                        <span
                            className="showMore"
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
        const limit = 4;
        const isLong = items.length > limit;
        const visibleItems = expanded ? items : items.slice(0, limit);

        return (
            <div className="verticalStack defaultGap">
                <div className="subjectBadgeList">
                    {visibleItems.map((item) => (
                        <Badge
                            type={BadgeType.Subjects}
                            value={item}
                            onClick={(value) => onBadgeClick?.(value)}
                        />
                    ))}
                </div>

                {isLong && (
                    <div>
                        <span
                            className="showMore"
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
