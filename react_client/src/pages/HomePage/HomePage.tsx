import { Link } from "react-router-dom";
import style from "./HomePage.module.css";
import landscape_pic from "../../assets/landscape-card.webp";
import senate_bill_pic from "../../assets/senatebill-card.webp";
import legislature_pic from "../../assets/legislature-card.webp";

//hero image lives in public/ (not imported) so index.html can preload it by a fixed URL before any JS
//runs - keep these paths in sync with the preload in index.html
const HERO_IMAGE = "/images/capitol-hero-1600.webp";
const HERO_SRCSET =
    "/images/capitol-hero-800.webp 800w, /images/capitol-hero-1600.webp 1600w";
const HERO_SIZES = "(max-width: 1240px) 100vw, 1200px";

const featureCards = [
    {
        title: "Find Your Representatives",
        description:
            "Enter your address to see your Utah House and Senate districts and who represents you.",
        image: landscape_pic,
        link: "/maps",
    },
    {
        title: "See Legislative Bills",
        description:
            "Browse every bill with plain-English summaries, policy topics, and how each legislator voted.",
        image: senate_bill_pic,
        link: "/bills",
    },
    {
        title: "Analyze Legislators' Votes",
        description:
            "See where each legislator lands on key policy issues, based on the bills they voted for and against.",
        image: legislature_pic,
        link: "/analysis",
    },
];

const HomePage = () => {
    return (
        <div className={`page pageScroll ${style.home}`}>
            <div className={style.home__content}>
                {/* Hero Section */}
                <section className={style.hero}>
                    <img
                        className={style.hero__image}
                        src={HERO_IMAGE}
                        srcSet={HERO_SRCSET}
                        sizes={HERO_SIZES}
                        alt=""
                        fetchPriority="high"
                        decoding="async"
                    />
                    <div className={style.hero__content}>
                        <span className={style.hero__eyebrow}>
                            Nonpartisan · Utah State Legislature
                        </span>
                        <h1 className={style.hero__title}>
                            Hold Your Legislators Accountable
                        </h1>
                        <p className={style.hero__subtitle}>
                            See what's on the table in the Utah House and
                            Senate, and how your representatives actually voted
                            — all in one place.
                        </p>
                        <div className={style.hero__actions}>
                            <Link
                                className={`${style.button} ${style.button__primary}`}
                                to="/maps"
                            >
                                Find Your Legislators
                            </Link>
                            <Link
                                className={`${style.button} ${style.button__secondary}`}
                                to="/bills"
                            >
                                Browse Bills
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Mission Section */}
                <section className={style.mission}>
                    <div>
                        <span className={style.sectionEyebrow}>
                            Why VoteWatch
                        </span>
                        <h2 className={style.sectionTitle}>
                            Following your government shouldn't be this hard
                        </h2>
                    </div>
                    <div className={style.mission__text}>
                        <p>
                            It shouldn't be so hard to figure out what your
                            elected officials are voting on—but right now, it
                            is. Important information about Utah Senate and
                            House bills is often buried in complicated
                            government websites that are tough to navigate and
                            even harder to follow. This site puts the key
                            details about bills and votes in one place so you
                            can actually see what's happening.
                        </p>
                        <p>
                            This is a non-partisan project built around one
                            idea: making government more transparent and easier
                            to understand. There's no agenda here—just a
                            straightforward way to track what your
                            representatives are doing, whether you're following
                            a specific issue or just want to stay informed.
                        </p>
                    </div>
                </section>

                {/* Feature Cards */}
                <section className={style.features}>
                    {featureCards.map((card) => (
                        <Link
                            key={card.link}
                            className={style.card}
                            to={card.link}
                        >
                            <div className={style.card__imageWrapper}>
                                <img
                                    className={style.card__image}
                                    src={card.image}
                                    alt=""
                                    //below the fold - don't compete with the hero for bandwidth
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                            <div className={style.card__body}>
                                <h3 className={style.card__title}>
                                    {card.title}
                                </h3>
                                <p className={style.card__description}>
                                    {card.description}
                                </p>
                                <span className={style.card__cta}>
                                    Explore →
                                </span>
                            </div>
                        </Link>
                    ))}
                </section>
            </div>
        </div>
    );
};

export default HomePage;
