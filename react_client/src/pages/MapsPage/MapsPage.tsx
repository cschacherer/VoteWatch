import DistrictFinder from "../../components/DistrictFinder/DistrictFinder";
import style from "./MapsPage.module.css";

const HomePage = () => {
    return (
        <div className={`page pageScroll`}>
            <div className={`verticalStack defaultGap`}>
                <div className="pageTitle">Mapping and Districting</div>
                <div className={style.homePage__districtFinder}>
                    <DistrictFinder></DistrictFinder>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
