import DistrictFinder from "../../components/DistrictFinder/DistrictFinder";
import style from "./HomePage.module.css";
import capital_pic from "../../assets/blue_capital.jpg";
import landscape_pic from "../../assets/landscape.jpg";
import senate_bill_pic from "../../assets/senateBill.jpg";
import legislature_pic from "../../assets/legislature.jpg";

const HomePage = () => {
    return (
        <div className={`page pageScroll`}>
            <div className={`verticalStack largeGap centerPage`}>
                {/* Header Image Section */}
                <div className={style.titleImage}>
                    <img src={capital_pic}></img>
                    <div className={style.titleImageOverlay}></div>
                    <h1 className={style.titleImageText}>
                        Hold Your Legislators Accountable
                    </h1>
                </div>
                <div className={`section outlineThin ${style.summaryText}`}>
                    <div>
                        {`It shouldn't be so hard to figure out what your elected
                officials are voting on—but right now, it is. Important
                information about Utah Senate and House bills is often buried in
                complicated government websites that are tough to navigate and
                even harder to follow. This site was created to make that
                process simpler. It puts the key details about bills and votes
                in one place so you can actually see what's happening without
                digging through layers of confusing pages. `}
                    </div>
                    <br></br>
                    <div>
                        {`This is a non-partisan project built around one idea: making government
                more transparent and easier to understand. There's no agenda
                here—just a straightforward way to track what your
                representatives are doing. Whether you're keeping an eye on a
                specific issue or just want to stay informed, this site is meant
                to give you clear, easy access to the decisions shaping Utah.`}
                    </div>
                </div>

                <div className={`section`}>
                    <a className="cleanLink" href="/maps">
                        <div
                            className={`horizontalRow outlineThin ${style.sectionCard}`}
                        >
                            <img
                                className={style.sectionCardLeftImg}
                                src={landscape_pic}
                            ></img>
                            <div className={style.sectionCardText}>
                                Find Your State Representatives
                            </div>
                        </div>
                    </a>
                </div>

                <div className={`section`}>
                    <a className="cleanLink" href="/bills">
                        <div
                            className={`horizontalRow outlineThin ${style.sectionCard}`}
                        >
                            <div className={`${style.sectionCardText}`}>
                                See Legislative Bills
                            </div>
                            <img
                                className={style.sectionCardRightImg}
                                src={senate_bill_pic}
                            ></img>
                        </div>
                    </a>
                </div>

                <div className="section">
                    <a className="cleanLink" href="/analysis">
                        <div
                            className={`horizontalRow outlineThin ${style.sectionCard}`}
                        >
                            <img
                                className={style.sectionCardLeftImg}
                                src={legislature_pic}
                            ></img>
                            <div className={style.sectionCardText}>
                                Analyze Legislator's Votes
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
