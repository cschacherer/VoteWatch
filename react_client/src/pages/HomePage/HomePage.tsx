import { useState, useEffect } from "react";

import style from "./HomePage.module.css";
import DistrictFinder from "../../components/DistrictFinder/DistrictFinder";

const HomePage = () => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");

    return (
        <div className="page pageScroll">
            <div className="pageTitle">Home Page</div>
            <DistrictFinder></DistrictFinder>
        </div>
    );
};

export default HomePage;
