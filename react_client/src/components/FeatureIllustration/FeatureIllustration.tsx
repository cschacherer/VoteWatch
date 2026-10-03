import { useId } from "react";

import style from "./FeatureIllustration.module.css";

type FeatureIllustrationProps = {
    //which page the picture previews
    variant: "map" | "bills" | "trends";
};

//colors match the app - party red/blue, House blue / Senate amber outlines, and the purple -> teal
//policy gradient used by every score bar
const REPUBLICAN = "#dc2626";
const DEMOCRAT = "#2563eb";
const HOUSE = "#2563eb";
const SENATE = "#d97706";
const POLICY_LEFT = "#6d28d9";
const POLICY_RIGHT = "#0f766e";
const INK = "#0f172a";
const MUTED = "#cbd5e1";
const FAINT = "#e2e8f0";

//a gray placeholder line of text
const TextLine = ({
    x,
    y,
    width,
    color = MUTED,
    height = 8,
}: {
    x: number;
    y: number;
    width: number;
    color?: string;
    height?: number;
}) => (
    <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={height / 2}
        fill={color}
    />
);

//the purple -> teal policy track with party dots and an optional legislator marker
const ScoreTrack = ({
    x,
    y,
    width,
    gradientId,
    republican,
    democrat,
    legislator,
}: {
    x: number;
    y: number;
    width: number;
    gradientId: string;
    republican: number;
    democrat: number;
    legislator?: number;
}) => {
    const at = (score: number) => x + (score / 100) * width;
    return (
        <g>
            <rect
                x={x}
                y={y - 4}
                width={width}
                height={8}
                rx={4}
                fill={`url(#${gradientId})`}
            />
            <line
                x1={x + width / 2}
                y1={y - 9}
                x2={x + width / 2}
                y2={y + 9}
                stroke="#94a3b8"
                strokeWidth={2}
            />
            <circle
                cx={at(republican)}
                cy={y}
                r={7}
                fill={REPUBLICAN}
                stroke="white"
                strokeWidth={2.5}
            />
            <circle
                cx={at(democrat)}
                cy={y}
                r={7}
                fill={DEMOCRAT}
                stroke="white"
                strokeWidth={2.5}
            />
            {legislator !== undefined && (
                <circle
                    cx={at(legislator)}
                    cy={y}
                    r={9}
                    fill="white"
                    stroke={INK}
                    strokeWidth={3.5}
                />
            )}
        </g>
    );
};

//MAP - Utah with a few districts, the House and Senate districts for an address outlined, a pin,
//and the two legislator cards
const MapPicture = () => (
    <>
        {/* Utah - the notch is the top-right corner Wyoming takes */}
        <path
            d="M40 40 H170 V95 H250 V290 H40 Z"
            fill="#f8fafc"
            stroke="#94a3b8"
            strokeWidth={2.5}
            strokeLinejoin="round"
        />
        {/* district lines */}
        <path
            d="M40 120 H250 M40 200 H250 M110 40 V290 M180 95 V290 M110 160 H180 M180 240 H250"
            stroke={FAINT}
            strokeWidth={2}
            fill="none"
        />
        {/* Senate district (bigger) and the House district inside it */}
        <rect
            x={110}
            y={120}
            width={70}
            height={80}
            fill={SENATE}
            fillOpacity={0.12}
            stroke={SENATE}
            strokeWidth={3}
        />
        <rect
            x={110}
            y={160}
            width={70}
            height={40}
            fill={HOUSE}
            fillOpacity={0.16}
            stroke={HOUSE}
            strokeWidth={3}
        />
        {/* pin */}
        <path
            d="M145 150 c-9 0 -15 7 -15 15 c0 11 15 25 15 25 s15 -14 15 -25 c0 -8 -6 -15 -15 -15 z"
            fill={INK}
        />
        <circle cx={145} cy={165} r={5} fill="white" />

        {/* legislator cards */}
        {[
            { y: 104, color: HOUSE, party: REPUBLICAN },
            { y: 184, color: SENATE, party: DEMOCRAT },
        ].map((card) => (
            <g key={card.y}>
                <rect
                    x={276}
                    y={card.y}
                    width={168}
                    height={64}
                    rx={12}
                    fill="white"
                    stroke={FAINT}
                    strokeWidth={1.5}
                />
                <rect
                    x={276}
                    y={card.y}
                    width={5}
                    height={64}
                    rx={2.5}
                    fill={card.color}
                />
                <circle cx={308} cy={card.y + 32} r={16} fill={FAINT} />
                <circle cx={308} cy={card.y + 27} r={6} fill="#94a3b8" />
                <path d={`M296 ${card.y + 44} q12 -14 24 0`} fill="#94a3b8" />
                <TextLine
                    x={334}
                    y={card.y + 16}
                    width={56}
                    color={card.color}
                    height={7}
                />
                <TextLine x={334} y={card.y + 30} width={88} color="#64748b" />
                <rect
                    x={334}
                    y={card.y + 44}
                    width={38}
                    height={10}
                    rx={5}
                    fill={card.party}
                    fillOpacity={0.18}
                />
            </g>
        ))}
    </>
);

//BILLS - a filter card with chips (one picked) above a table of bills with status and policy tags
const BillsPicture = () => (
    <>
        {/* filter card */}
        <rect
            x={30}
            y={30}
            width={420}
            height={78}
            rx={14}
            fill="white"
            stroke={FAINT}
            strokeWidth={1.5}
        />
        <TextLine x={48} y={48} width={70} color={INK} height={8} />
        {[
            { x: 48, w: 46, active: true },
            { x: 100, w: 70, active: false },
            { x: 176, w: 84, active: true },
            { x: 266, w: 64, active: false },
            { x: 336, w: 56, active: false },
        ].map((chip) => (
            <rect
                key={chip.x}
                x={chip.x}
                y={70}
                width={chip.w}
                height={22}
                rx={11}
                fill={chip.active ? "#eff6ff" : "white"}
                stroke={chip.active ? DEMOCRAT : MUTED}
                strokeWidth={1.5}
            />
        ))}
        <TextLine x={58} y={78} width={26} color={DEMOCRAT} height={6} />
        <TextLine x={186} y={78} width={64} color={DEMOCRAT} height={6} />

        {/* bill rows */}
        <rect
            x={30}
            y={124}
            width={420}
            height={170}
            rx={14}
            fill="white"
            stroke={FAINT}
            strokeWidth={1.5}
        />
        {[
            { y: 136, passed: true, policy: POLICY_RIGHT },
            { y: 188, passed: false, policy: POLICY_LEFT },
            { y: 240, passed: true, policy: POLICY_RIGHT },
        ].map((row, index) => (
            <g key={row.y}>
                {index > 0 && (
                    <line
                        x1={30}
                        y1={row.y - 6}
                        x2={450}
                        y2={row.y - 6}
                        stroke="#f1f5f9"
                        strokeWidth={1.5}
                    />
                )}
                <rect
                    x={46}
                    y={row.y + 4}
                    width={50}
                    height={18}
                    rx={9}
                    fill="white"
                    stroke={DEMOCRAT}
                    strokeWidth={1.5}
                />
                <TextLine
                    x={56}
                    y={row.y + 10}
                    width={30}
                    color={DEMOCRAT}
                    height={6}
                />
                <TextLine x={46} y={row.y + 30} width={92} color="#64748b" />
                <TextLine x={156} y={row.y + 8} width={120} />
                <TextLine x={156} y={row.y + 22} width={96} />
                <rect
                    x={288}
                    y={row.y + 8}
                    width={50}
                    height={18}
                    rx={9}
                    fill={row.passed ? "#dcfce7" : "#fee2e2"}
                    stroke={row.passed ? "#16a34a" : REPUBLICAN}
                    strokeWidth={1.5}
                />
                <rect
                    x={352}
                    y={row.y + 2}
                    width={84}
                    height={34}
                    rx={8}
                    fill="#f8fafc"
                    stroke={FAINT}
                    strokeWidth={1.5}
                />
                <TextLine
                    x={360}
                    y={row.y + 9}
                    width={52}
                    color={INK}
                    height={6}
                />
                <TextLine
                    x={360}
                    y={row.y + 22}
                    width={64}
                    color={row.policy}
                    height={6}
                />
            </g>
        ))}
    </>
);

//TRENDS - the whole legislature (party medians on several policies) above one legislator compared to them
const TrendsPicture = ({ gradientId }: { gradientId: string }) => (
    <>
        {/* whole legislature */}
        <rect
            x={30}
            y={26}
            width={420}
            height={140}
            rx={14}
            fill="white"
            stroke={FAINT}
            strokeWidth={1.5}
        />
        <TextLine x={48} y={44} width={110} color={INK} height={9} />
        {[
            { y: 82, republican: 82, democrat: 38 },
            { y: 112, republican: 60, democrat: 74 },
            { y: 142, republican: 90, democrat: 56 },
        ].map((track) => (
            <g key={track.y}>
                <TextLine x={48} y={track.y - 4} width={70} />
                <ScoreTrack
                    x={140}
                    y={track.y}
                    width={290}
                    gradientId={gradientId}
                    republican={track.republican}
                    democrat={track.democrat}
                />
            </g>
        ))}

        {/* one legislator */}
        <rect
            x={30}
            y={182}
            width={420}
            height={112}
            rx={14}
            fill="white"
            stroke={FAINT}
            strokeWidth={1.5}
        />
        <circle cx={70} cy={222} r={20} fill={FAINT} />
        <circle cx={70} cy={216} r={7} fill="#94a3b8" />
        <path d="M56 236 q14 -16 28 0" fill="#94a3b8" />
        <TextLine x={102} y={208} width={110} color={INK} height={9} />
        <rect
            x={102}
            y={226}
            width={46}
            height={12}
            rx={6}
            fill={REPUBLICAN}
            fillOpacity={0.18}
        />
        <TextLine x={330} y={212} width={100} color={DEMOCRAT} height={7} />
        <ScoreTrack
            x={60}
            y={268}
            width={370}
            gradientId={gradientId}
            republican={78}
            democrat={45}
            legislator={88}
        />
    </>
);

//a small drawing that previews one of the app's pages, for the Home page feature sections
const FeatureIllustration = ({ variant }: FeatureIllustrationProps) => {
    //gradient ids must be unique on the page
    const gradientId = `policy-gradient-${useId().replace(/:/g, "")}`;

    return (
        <svg
            className={style.illustration}
            viewBox="0 0 480 320"
            role="img"
            aria-label={
                variant === "map"
                    ? "A map of Utah with a House and Senate district outlined and two legislator cards"
                    : variant === "bills"
                      ? "Bill filters above a table of bills with pass status and policy tags"
                      : "Party score sliders for the legislature above one legislator's score"
            }
        >
            <defs>
                <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor={POLICY_LEFT} />
                    <stop offset="50%" stopColor={FAINT} />
                    <stop offset="100%" stopColor={POLICY_RIGHT} />
                </linearGradient>
            </defs>
            {variant === "map" && <MapPicture />}
            {variant === "bills" && <BillsPicture />}
            {variant === "trends" && <TrendsPicture gradientId={gradientId} />}
        </svg>
    );
};

export default FeatureIllustration;
