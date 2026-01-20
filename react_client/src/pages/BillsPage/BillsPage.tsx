import { useState, useEffect } from "react";

import style from "./BillsPage.module.css";

const BillsPage = () => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");

    return (
        <>
            <div>
                <h1>Bills Page Body</h1>
            </div>
        </>
    );
};

export default BillsPage;
