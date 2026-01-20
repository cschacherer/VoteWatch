import { useState, useEffect } from "react";

import style from "./LegislatorDetailsPage.module.css";

const LegislatorDetailsPage = () => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");

    return (
        <>
            <div>
                <h1>Legislator Details Body</h1>
            </div>
        </>
    );
};

export default LegislatorDetailsPage;
