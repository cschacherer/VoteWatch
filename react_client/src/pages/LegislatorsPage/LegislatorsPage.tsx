import { useState, useEffect } from "react";

import style from "./LegislatorsPage.module.css";

const LegislatorsPage = () => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");

    return (
        <>
            <div>
                <h1>Legislators Page Body</h1>
            </div>
        </>
    );
};

export default LegislatorsPage;
