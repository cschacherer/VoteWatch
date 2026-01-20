import { useState, useEffect } from "react";

import style from "./AboutPage.module.css";

const AboutPage = () => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");

    return (
        <>
            <div>
                <h1>About Page Body</h1>
            </div>
        </>
    );
};

export default AboutPage;
