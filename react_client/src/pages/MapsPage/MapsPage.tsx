import DistrictFinder from "../../components/DistrictFinder/DistrictFinder";
import PageHeader from "../../components/PageHeader/PageHeader";
import style from "./MapsPage.module.css";

const MapsPage = () => {
    return (
        <div className={`page pageScroll ${style.mapsPage}`}>
            <div className={style.mapsPage__content}>
                <PageHeader
                    eyebrow="Utah State Legislature"
                    title="Find Your Legislators"
                    subtitle="Enter your home address to see your Utah House and Senate districts and who represents you."
                />
                <DistrictFinder />
            </div>
        </div>
    );
};

export default MapsPage;
