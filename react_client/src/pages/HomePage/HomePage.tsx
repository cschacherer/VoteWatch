import { useState, useEffect } from "react";

import style from "./HomePage.module.css";

const HomePage = () => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");

    return (
        <>
            <div className={style.homePage__container}>
                <h1>Home Page Body</h1>
            </div>
        </>
    );
};

export default HomePage;
