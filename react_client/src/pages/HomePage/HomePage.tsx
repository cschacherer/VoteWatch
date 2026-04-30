import DistrictFinder from "../../components/DistrictFinder/DistrictFinder";
import style from "./HomePage.module.css";

const HomePage = () => {
    return (
        <div className={`page pageScroll`}>
            <div className={`verticalStack largeGap ${style.homePage__center}`}>
                <div className="pageTitle">
                    Hold Your Legislators Accountable
                </div>
                <div className="section outline defaultPadding">
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

                <div>
                    <DistrictFinder></DistrictFinder>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
