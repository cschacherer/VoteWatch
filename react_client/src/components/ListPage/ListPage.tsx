import type { ReactNode } from "react";

import style from "./ListPage.module.css";

type ListPageProps = {
    children: ReactNode;
    //true when the last child is a GeneralTable that needs a fixed height so its body can scroll -
    //turn off when the page ends with normal content (ie cards) that should just grow
    fillLastChild?: boolean;
};

//page layout for list pages (Bills, Legislators) - a centered column that scrolls, where the last
//child (the GeneralTable) gets a fixed height so its body scrolls on its own
const ListPage = ({ children, fillLastChild = true }: ListPageProps) => {
    return (
        <div className={`page pageScroll ${style.listPage}`}>
            <div
                className={`${style.listPage__content} ${fillLastChild ? style.listPage__fillLast : ""}`}
            >
                {children}
            </div>
        </div>
    );
};

export default ListPage;
