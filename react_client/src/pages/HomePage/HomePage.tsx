import { Link } from "react-router-dom";
import style from "./HomePage.module.css";
import FeatureIllustration from "../../components/FeatureIllustration/FeatureIllustration";

//hero image lives in public/ (not imported) so index.html can preload it by a fixed URL before any JS
//runs - keep these paths in sync with the preload in index.html
const HERO_IMAGE = "/images/capitol-hero-1600.webp";
const HERO_SRCSET =
    "/images/capitol-hero-800.webp 800w, /images/capitol-hero-1600.webp 1600w";
const HERO_SIZES = "(max-width: 1240px) 100vw, 1200px";

type FeatureLink = { label: string; to: string };

type Feature = {
    eyebrow: string;
    title: string;
    description: string;
    illustration: "map" | "bills" | "trends";
    //what you can do there - a checklist
    points?: string[];
    //two ways in, each with its own summary and link (ie the whole legislature vs. one legislator)
    paths?: { title: string; description: string; link: FeatureLink }[];
    links?: FeatureLink[];
};

//one big section per part of the site - what it does, with a picture of it
const features: Feature[] = [
    {
        eyebrow: "Your districts",
        title: "Find who represents you",
        description:
            "Type your address to see your Utah House and Senate districts on the map, along with the two legislators who represent you.",
        illustration: "map",
        points: [
            "Address suggestions as you type",
            "Your House and Senate districts outlined on the map",
            "One click to each legislator's full voting record",
        ],
        links: [{ label: "Find your legislators", to: "/maps" }],
    },
    {
        eyebrow: "Bills",
        title: "Browse, filter, and sort every bill",
        description:
            "Every bill comes with a plain-English summary, and each one is sorted into policy topics so you can go straight to the issues you care about.",
        illustration: "bills",
        points: [
            "Filter by year and session, passed or failed, and subject",
            "Narrow to a policy topic like Education or Housing, then the direction a bill pushes it",
            "Search by bill number, title, or summary",
            "Click any topic, subject, or session in the table to filter by it",
        ],
        links: [{ label: "Browse bills", to: "/bills" }],
    },
    {
        eyebrow: "Voting analysis",
        title: "See the big picture, or one legislator's record",
        description:
            "Every vote is scored on policy issues, from one side of the issue to the other, so you can analyze the legislature two ways.",
        illustration: "trends",
        paths: [
            {
                title: "The whole legislature",
                description:
                    "What passed on each policy, where Republicans and Democrats land, and who showed up to vote — for one year or all of them.",
                link: { label: "Legislature trends", to: "/analysis" },
            },
            {
                title: "One legislator",
                description:
                    "Their voting history, the bills they sponsored, and a score on every policy, side by side with each party's median.",
                link: { label: "Find a legislator", to: "/legislators" },
            },
        ],
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

                {/* Features - one big section per part of the site, picture and text alternating sides */}
                <section className={style.features}>
                    <div className={style.features__header}>
                        <span className={style.sectionEyebrow}>
                            What you can do
                        </span>
                        <h2 className={style.sectionTitle}>
                            Everything the legislature does, in one place
                        </h2>
                    </div>

                    {features.map((feature, index) => (
                        <article
                            key={feature.title}
                            className={`${style.feature} ${index % 2 === 1 ? style.feature__reversed : ""}`}
                        >
                            <div className={style.feature__picture}>
                                <FeatureIllustration
                                    variant={feature.illustration}
                                />
                            </div>

                            <div className={style.feature__body}>
                                <span className={style.feature__eyebrow}>
                                    {feature.eyebrow}
                                </span>
                                <h3 className={style.feature__title}>
                                    {feature.title}
                                </h3>
                                <p className={style.feature__description}>
                                    {feature.description}
                                </p>

                                {feature.points && (
                                    <ul className={style.feature__points}>
                                        {feature.points.map((point) => (
                                            <li key={point}>{point}</li>
                                        ))}
                                    </ul>
                                )}

                                {feature.paths && (
                                    <div className={style.feature__paths}>
                                        {feature.paths.map((path) => (
                                            <div
                                                key={path.title}
                                                className={style.path}
                                            >
                                                <h4
                                                    className={
                                                        style.path__title
                                                    }
                                                >
                                                    {path.title}
                                                </h4>
                                                <p
                                                    className={
                                                        style.path__description
                                                    }
                                                >
                                                    {path.description}
                                                </p>
                                                <Link
                                                    className={style.path__link}
                                                    to={path.link.to}
                                                >
                                                    {path.link.label} →
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {feature.links && (
                                    <div className={style.feature__links}>
                                        {feature.links.map((link) => (
                                            <Link
                                                key={link.to}
                                                className={`${style.button} ${style.button__primary}`}
                                                to={link.to}
                                            >
                                                {link.label} →
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        </div>
    );
};

export default HomePage;
