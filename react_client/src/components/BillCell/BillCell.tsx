import { Link } from "react-router-dom";
import Badge from "../Badge/Badge";

import style from "./BillCell.module.css";

type BillCellProps = {
    id: string;
    sessionId: string;
    shortTitle: string;
    //when set, clicking the session badge calls this (ie to filter the table by session)
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
                {id}
            </Link>
            <Link className={style.billCell__title} to={billLink}>
                {shortTitle}
            </Link>
            <Badge
                type="sessionId"
                value={sessionId}
                onClick={onSessionClick}
            ></Badge>
        </div>
    );
};

export default BillCell;
