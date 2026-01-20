import { useState, useEffect } from "react";

import style from "./BillDetailsPage.module.css";

const BillDetailsPage = () => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");

    return (
        <>
            <div>
                <h1>Bill Details Body</h1>
            </div>
        </>
    );
};

export default BillDetailsPage;
