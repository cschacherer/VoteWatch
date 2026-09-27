import { Link } from "react-router-dom";
import Badge from "../Badge/Badge";
import { normalizeSessionId } from "../../models/Bill";

import style from "./BillCell.module.css";

type BillCellProps = {
    id: string;
    sessionId: string;
    shortTitle: string;
    //when set, clicking the session badge calls this with the raw session id (ie "2026GS")
    onSessionClick?: (sessionId: string) => void;
};

//table cell for a bill - bill number tag and title (both link to the bill) with its session underneath
const BillCell = ({
    id,
    sessionId,
    shortTitle,
    onSessionClick,
}: BillCellProps) => {
    const billLink = `/bills/${sessionId}/${id}`;

    return (
        <div className={style.billCell}>
            <Link className={style.billCell__id} to={billLink}>
                {/* {id} */}
                <Badge type="billId" value={id}></Badge>
            </Link>
            <div className={style.billCell__titlePadding}>
                <Link className={style.billCell__title} to={billLink}>
                    {shortTitle}
                </Link>
                {/* Badge hands its click handler the formatted label, so pass the raw session id ourselves */}
                <span
                    title={
                        onSessionClick
                            ? `Show only ${normalizeSessionId(sessionId)} bills`
                            : undefined
                    }
                >
                    <Badge
                        type="sessionId"
                        value={sessionId}
                        onClick={
                            onSessionClick && (() => onSessionClick(sessionId))
                        }
                    ></Badge>
                </span>
            </div>
        </div>
    );
};

export default BillCell;
