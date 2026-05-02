import { useState, useEffect } from "react";
import downIcon from "../../assets/icon_expand_down.svg";
import rightIcon from "../../assets/icon_expand_right.svg";

type ExpandableSectionProps = {
    header: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    onExpand?: () => void;
};

const ExpandableSection = ({
    header,
    children,
    defaultExpanded = false,
    onExpand,
}: ExpandableSectionProps) => {
    const [expanded, setExpanded] = useState<boolean>(defaultExpanded);

    const toggleExpanded = () => {
        const newExpanded = !expanded;
        if (newExpanded == true && onExpand) {
            onExpand();
        }
        setExpanded(newExpanded);
    };

    return (
        <div className="section outline ">
            {/* Legislator Voting History Table */}
            <div className="filledHeader horizontalRow defaultGap">
                <button
                    type="button"
                    className="expandButton defaultPadding"
                    onClick={toggleExpanded}
                >
                    <img
                        className="expandIcon"
                        src={expanded ? downIcon : rightIcon}
                        alt={expanded ? "Collapse" : "Expand"}
                    />
                </button>
                <span>{header}</span>
            </div>

            {expanded && children}
        </div>
    );
};

export default ExpandableSection;
