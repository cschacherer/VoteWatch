import { useState, useEffect, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { getBillDetails, getBillVotes } from "../../services/billService";
import { getLegislatorDetails } from "../../services/legislatorService";
import { type Bill, normalizeSessionId } from "../../models/Bill";
import type { Legislator } from "../../models/Legislator";
import { type Vote, VoteValue } from "../../models/Vote";
import { formatDate } from "../../models/DataTableUtils";
import Badge from "../../components/Badge/Badge";
import { BadgeType } from "../../components/Badge/Badge";
import PolicyChip from "../../components/PolicyChip/PolicyChip";
import PillTabs from "../../components/PillTabs/PillTabs";

import style from "./BillDetailsPage.module.css";

type Chamber = "H" | "S";

const chamberNames: Record<Chamber, string> = { H: "House", S: "Senate" };

const voteColumns: { value: VoteValue; label: string; className: string }[] = [
    { value: VoteValue.Yes, label: "Yes", className: style.voteColumn__yes },
    { value: VoteValue.No, label: "No", className: style.voteColumn__no },
    {
        value: VoteValue.Absent,
        label: "Absent / Not Voting",
        className: style.voteColumn__absent,
    },
];

const partyDotStyles: Record<string, string> = {
    Republican: style.partyDot__rep,
    Democrat: style.partyDot__dem,
};

//the AI summary sometimes says "None" or "N/A" for empty sections - treat those as empty
const hasContent = (text?: string) =>
    !!text &&
    !["", "none", "n/a", "none.", "not specified"].includes(
        text.trim().toLowerCase(),
    );

//a white card with a title - used for each section of the page
const Card = ({
    title,
    tag,
    children,
}: {
    title: string;
    tag?: string;
    children: ReactNode;
}) => (
    <section className={style.card}>
        <div className={style.card__header}>
            <h2 className={style.card__title}>{title}</h2>
            {tag && <span className={style.card__tag}>{tag}</span>}
        </div>
        {children}
    </section>
);

//photo, name, and role for the bill's sponsor or floor sponsor
const SponsorCard = ({
    role,
    legislator,
}: {
    role: string;
    legislator?: Legislator;
}) => {
    if (!legislator) return null;

    return (
        <Link className={style.sponsor} to={`/legislators/${legislator.id}`}>
            <img
                className={style.sponsor__photo}
                src={legislator.image}
                alt=""
            />
            <div>
                <div className={style.sponsor__role}>{role}</div>
                <div className={style.sponsor__name}>
                    {legislator.formatName}
                </div>
                <div className={style.sponsor__meta}>
                    {legislator.party} · {legislator.house} District{" "}
                    {legislator.district}
                </div>
            </div>
        </Link>
    );
};

const BillDetailsPage = () => {
    const [billDetails, setBillDetails] = useState<Bill>();
    const [billVotes, setBillVotes] = useState<Vote[]>([]);
    const [mainSponsor, setMainSponsor] = useState<Legislator>();
    const [floorSponsor, setFloorSponsor] = useState<Legislator>();
    const [loading, setLoading] = useState(true);
    const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(
        null,
    );

    let { sessionId, billId } = useParams<string>();
    if (!sessionId || !billId) {
        sessionId = "";
        billId = "";
    }

    useEffect(() => {
        const fetchBillDetails = async () => {
            try {
                const [detailsResponse, votesResponse] = await Promise.all([
                    getBillDetails(sessionId, billId),
                    getBillVotes(sessionId, billId),
                ]);
                setBillDetails(detailsResponse);
                setBillVotes(votesResponse);

                const [sponsor, floor] = await Promise.all([
                    detailsResponse?.billSponsor
                        ? getLegislatorDetails(detailsResponse.billSponsor)
                        : undefined,
                    detailsResponse?.floorSponsor
                        ? getLegislatorDetails(detailsResponse.floorSponsor)
                        : undefined,
                ]);
                setMainSponsor(sponsor);
                setFloorSponsor(floor);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchBillDetails();
    }, [sessionId, billId]);

    //the legislator id is empty if the legislator is no longer in office
    const currentVotes = billVotes.filter((vote) => vote.legislatorId !== "");
    const chamberVotes = (chamber: Chamber) =>
        currentVotes.filter((vote) => vote.house === chamber);
    const countVotes = (votes: Vote[], value: VoteValue) =>
        votes.filter((vote) => vote.vote === value).length;

    const chambersWithVotes = (["H", "S"] as Chamber[]).filter(
        (chamber) => chamberVotes(chamber).length > 0,
    );
    //default to the chamber the bill started in (HB/HJR... = House, SB/SJR... = Senate) if it has a vote
    const originChamber: Chamber = billId.toUpperCase().startsWith("S")
        ? "S"
        : "H";
    const activeChamber: Chamber | undefined =
        selectedChamber ??
        (chambersWithVotes.includes(originChamber)
            ? originChamber
            : chambersWithVotes[0]);
    const activeVotes = activeChamber ? chamberVotes(activeChamber) : [];

    const summary = billDetails?.summary;
    const sessionLabel = billDetails
        ? String(normalizeSessionId(billDetails.sessionId))
        : "";

    if (loading) {
        return (
            <div className={`page pageScroll ${style.billDetails}`}>
                <div className={style.billDetails__content}>
                    <div className={style.loading}>Loading bill...</div>
                </div>
            </div>
        );
    }

    if (!billDetails) {
        return (
            <div className={`page pageScroll ${style.billDetails}`}>
                <div className={style.billDetails__content}>
                    <Link className={style.backLink} to="/bills">
                        ← All bills
                    </Link>
                    <div className={style.loading}>
                        Couldn't find {billId} in {sessionId}.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`page pageScroll ${style.billDetails}`}>
            <div className={style.billDetails__content}>
                <Link className={style.backLink} to="/bills">
                    ← All bills
                </Link>

                {/* Overview */}
                <section className={style.hero}>
                    <span className={style.hero__eyebrow}>
                        {billDetails.id} · {sessionLabel}
                    </span>
                    <h1 className={style.hero__title}>
                        {billDetails.shortTitle}
                    </h1>
                    <div className={style.hero__status}>
                        <Badge
                            type={BadgeType.Passed}
                            value={billDetails.passed}
                        />
                        {billDetails.passed && billDetails.datePassed && (
                            <span>
                                Passed {formatDate(billDetails.datePassed)}
                            </span>
                        )}
                        {billDetails.effectiveDate && (
                            <span>
                                Effective{" "}
                                {formatDate(billDetails.effectiveDate)}
                            </span>
                        )}
                    </div>
                    {hasContent(summary?.oneSentence) && (
                        <p className={style.hero__lead}>
                            {summary?.oneSentence}
                        </p>
                    )}

                    {(mainSponsor || floorSponsor) && (
                        <div className={style.sponsors}>
                            <SponsorCard
                                role="Sponsor"
                                legislator={mainSponsor}
                            />
                            <SponsorCard
                                role="Floor Sponsor"
                                legislator={floorSponsor}
                            />
                        </div>
                    )}

                    <div className={style.hero__actions}>
                        {billDetails.pdfLink && (
                            <a
                                className={`${style.actionButton} ${style.actionButton__primary}`}
                                href={billDetails.pdfLink}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Read full text (PDF) {"↗︎"}
                            </a>
                        )}
                        {billDetails.link && (
                            <a
                                className={style.actionButton}
                                href={billDetails.link}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Official bill page {"↗︎"}
                            </a>
                        )}
                    </div>
                </section>

                <div className={style.columns}>
                    {/* Main column */}
                    <div className={style.columns__main}>
                        {summary && hasContent(summary.overview) && (
                            <Card title="Summary" tag="AI generated">
                                <p className={style.paragraph}>
                                    {summary.overview}
                                </p>

                                {summary.keyChanges.length > 0 && (
                                    <>
                                        <h3 className={style.subheading}>
                                            Key changes
                                        </h3>
                                        <ul className={style.list}>
                                            {summary.keyChanges.map(
                                                (item, index) => (
                                                    <li key={index}>{item}</li>
                                                ),
                                            )}
                                        </ul>
                                    </>
                                )}

                                {summary.groupsAffected.some(hasContent) && (
                                    <>
                                        <h3 className={style.subheading}>
                                            Who's affected
                                        </h3>
                                        <ul className={style.list}>
                                            {summary.groupsAffected
                                                .filter(hasContent)
                                                .map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                        </ul>
                                    </>
                                )}

                                {hasContent(summary.money) && (
                                    <>
                                        <h3 className={style.subheading}>
                                            Money or funding impact
                                        </h3>
                                        <p className={style.paragraph}>
                                            {summary.money}
                                        </p>
                                    </>
                                )}

                                {hasContent(summary.unclearItems) && (
                                    <>
                                        <h3 className={style.subheading}>
                                            Unclear from the text
                                        </h3>
                                        <p className={style.paragraph}>
                                            {summary.unclearItems}
                                        </p>
                                    </>
                                )}
                            </Card>
                        )}

                        {(hasContent(billDetails.generalProvisions) ||
                            hasContent(billDetails.highlightedProvisions)) && (
                            <Card title="Official provisions">
                                {hasContent(billDetails.generalProvisions) && (
                                    <>
                                        <h3 className={style.subheading}>
                                            General provisions
                                        </h3>
                                        <p className={style.paragraph}>
                                            {billDetails.generalProvisions}
                                        </p>
                                    </>
                                )}
                                {hasContent(
                                    billDetails.highlightedProvisions,
                                ) && (
                                    <>
                                        <h3 className={style.subheading}>
                                            Highlighted provisions
                                        </h3>
                                        <p
                                            className={`${style.paragraph} preWrap`}
                                        >
                                            {/* the source text has blank lines between bullets - collapse them */}
                                            {billDetails.highlightedProvisions.replace(
                                                /\n\s*\n/g,
                                                "\n",
                                            )}
                                        </p>
                                    </>
                                )}
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className={style.columns__side}>
                        <Card title="Status">
                            <dl className={style.facts}>
                                <dt>Last action</dt>
                                <dd>
                                    {billDetails.lastAction || "—"}
                                    {billDetails.lastActionDate && (
                                        <span className={style.facts__date}>
                                            {formatDate(
                                                billDetails.lastActionDate,
                                            )}
                                        </span>
                                    )}
                                </dd>
                                <dt>Session</dt>
                                <dd>{sessionLabel}</dd>
                            </dl>
                        </Card>

                        {billDetails.policies.length > 0 && (
                            <Card title="Policies" tag="AI generated">
                                <div className={style.policyList}>
                                    {billDetails.policies.map((policy) => (
                                        <PolicyChip
                                            key={policy.policyTopic}
                                            policy={policy}
                                        />
                                    ))}
                                </div>
                            </Card>
                        )}

                        {(billDetails.subjects ?? []).length > 0 && (
                            <Card title="Subjects">
                                <div className={style.tagList}>
                                    {[...new Set(billDetails.subjects)].map(
                                        (subject) => (
                                            <Badge
                                                key={subject}
                                                type={BadgeType.Subjects}
                                                value={subject}
                                            />
                                        ),
                                    )}
                                </div>
                            </Card>
                        )}
                    </aside>
                </div>

                {/* Votes */}
                <Card title="How legislators voted">
                    {chambersWithVotes.length === 0 ? (
                        <p className={style.empty}>
                            No floor votes are recorded for this bill. Bills
                            that don't reach a final (third reading) vote won't
                            have one.
                        </p>
                    ) : (
                        <>
                            <PillTabs
                                options={chambersWithVotes.map((chamber) => {
                                    const votes = chamberVotes(chamber);
                                    return {
                                        value: chamber,
                                        label: `${chamberNames[chamber]}  ${countVotes(votes, VoteValue.Yes)}–${countVotes(votes, VoteValue.No)}`,
                                    };
                                })}
                                selectedValue={activeChamber ?? ""}
                                onSelect={(value) =>
                                    setSelectedChamber(value as Chamber)
                                }
                            />

                            {/* proportional yes / no / absent bar */}
                            <div
                                className={style.tallyBar}
                                role="img"
                                aria-label={voteColumns
                                    .map(
                                        (column) =>
                                            `${column.label}: ${countVotes(activeVotes, column.value)}`,
                                    )
                                    .join(", ")}
                            >
                                {voteColumns.map((column) => {
                                    const count = countVotes(
                                        activeVotes,
                                        column.value,
                                    );
                                    return count > 0 ? (
                                        <div
                                            key={column.value}
                                            className={`${style.tallyBar__segment} ${column.className}`}
                                            style={{ flexGrow: count }}
                                        />
                                    ) : null;
                                })}
                            </div>

                            <div className={style.voteColumns}>
                                {voteColumns.map((column) => {
                                    const votes = activeVotes
                                        .filter(
                                            (vote) =>
                                                vote.vote === column.value,
                                        )
                                        .sort((a, b) =>
                                            a.legislatorName.localeCompare(
                                                b.legislatorName,
                                            ),
                                        );
                                    return (
                                        <div
                                            key={column.value}
                                            className={`${style.voteColumn} ${column.className}`}
                                        >
                                            <div
                                                className={
                                                    style.voteColumn__header
                                                }
                                            >
                                                <span>{column.label}</span>
                                                <span
                                                    className={
                                                        style.voteColumn__count
                                                    }
                                                >
                                                    {votes.length}
                                                </span>
                                            </div>
                                            <ul className={style.voterList}>
                                                {votes.map((vote) => (
                                                    <li key={vote.legislatorId}>
                                                        <Link
                                                            to={`/legislators/${vote.legislatorId}`}
                                                            title={vote.party}
                                                        >
                                                            <span
                                                                className={`${style.partyDot} ${partyDotStyles[vote.party] ?? ""}`}
                                                            />
                                                            {vote.formatName}
                                                        </Link>
                                                    </li>
                                                ))}
                                                {votes.length === 0 && (
                                                    <li
                                                        className={
                                                            style.voterList__empty
                                                        }
                                                    >
                                                        None
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={style.legend}>
                                <span>
                                    <span
                                        className={`${style.partyDot} ${style.partyDot__rep}`}
                                    />
                                    Republican
                                </span>
                                <span>
                                    <span
                                        className={`${style.partyDot} ${style.partyDot__dem}`}
                                    />
                                    Democrat
                                </span>
                                <span>
                                    <span className={style.partyDot} />
                                    Other
                                </span>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default BillDetailsPage;
