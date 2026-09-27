import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
    getLegislatorDetails,
    getLegislatorVotes,
    getLegislatorSponsoredBills,
} from "../../services/legislatorService";
import type { Legislator } from "../../models/Legislator";
import type { LegislatorVote } from "../../models/LegislatorVote";
import { type Bill, normalizeSessionId } from "../../models/Bill";
import { VoteValue } from "../../models/Vote";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";
import Badge from "../../components/Badge/Badge";
import BillCell from "../../components/BillCell/BillCell";
import ListPage from "../../components/ListPage/ListPage";
import { StatCards } from "../../components/PageHeader/PageHeader";
import PillTabs from "../../components/PillTabs/PillTabs";
import FilterCard, { FilterRow } from "../../components/FilterCard/FilterCard";
import FilterChip from "../../components/FilterChip/FilterChip";
import LegislatorPolicyScores from "../../components/LegislatorPolicyScores/LegislatorPolicyScores";

import style from "./LegislatorDetailsPage.module.css";

type DetailsView = "votes" | "sponsored" | "scores";
const detailsViews: DetailsView[] = ["votes", "sponsored", "scores"];
type SponsorRole = "sponsor" | "floor";

const voteLabels: Record<VoteValue, string> = {
    [VoteValue.Yes]: "Yes",
    [VoteValue.No]: "No",
    [VoteValue.Absent]: "Absent",
};

const roleLabels: Record<SponsorRole, string> = {
    sponsor: "Sponsor",
    floor: "Floor Sponsor",
};

//hidden columns kept so session and year stay available in the Filters panel
function createHiddenFilterColumns<T>(getBill: (row: T) => Bill) {
    return [
        createDataTableColumn<T>({
            id: "sessionId",
            name: "Session",
            selector: (row: T) => normalizeSessionId(getBill(row).sessionId),
            omit: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<T>({
            id: "year",
            name: "Year",
            selector: (row: T) => getBill(row).year,
            omit: true,
            filterConfig: {
                type: FilterType.Number,
            },
        }),
    ];
}

//columns shared by both tables - summary, passed, and subjects
function createSharedBillColumns<T>(
    getBill: (row: T) => Bill,
    filterBadgeClick: (key: string, value: string) => void,
) {
    return [
        createDataTableColumn<T>({
            id: "passed",
            name: "Passed",
            selector: (row: T) => (getBill(row).passed ? "passed" : "failed"),
            width: "130px",
            cell: (row: T) => (
                <Badge
                    type="passed"
                    value={getBill(row).passed}
                    onClick={(value) =>
                        filterBadgeClick("passed", value.toLowerCase())
                    }
                />
            ),
            filterConfig: {
                type: FilterType.Select,
                options: ["PASSED", "FAILED"],
            },
        }),
        createDataTableColumn<T>({
            id: "summary",
            name: "Summary",
            selector: (row: T) => getBill(row).summary?.oneSentence ?? "",
            grow: 2,
            minWidth: "300px",
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<T>({
            id: "subjects",
            name: "Subjects",
            selector: (row: T) => getBill(row).subjects,
            minWidth: "240px",
            cell: (row: T) => (
                <CollapsibleCell
                    items={getBill(row).subjects}
                    onBadgeClick={(value) =>
                        filterBadgeClick("subjects", value)
                    }
                />
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
    ];
}

//Create all columns for VOTE TABLE
function createVoteColumns(
    {
        filterBadgeClick,
    }: {
        filterBadgeClick: (key: string, value: string) => void;
    },
    onVoteSelect: (vote: VoteValue) => void,
) {
    const getBill = (row: LegislatorVote) => row.bill;

    return [
        createDataTableColumn<LegislatorVote>({
            id: "bill",
            name: "Bill",
            selector: (row: LegislatorVote) =>
                row.bill.id + row.bill.shortTitle,
            width: "280px",
            cell: (row: LegislatorVote) => (
                <BillCell
                    id={row.bill.id}
                    sessionId={row.bill.sessionId}
                    shortTitle={row.bill.shortTitle}
                />
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "vote",
            name: "Vote",
            selector: (row: LegislatorVote) => row.vote,
            width: "120px",
            cell: (row: LegislatorVote) => (
                <Badge
                    type="vote"
                    value={row.vote}
                    onClick={() => onVoteSelect(row.vote)}
                />
            ),
            filterConfig: {
                type: FilterType.Select,
                options: ["Yes", "No", "Absent"],
            },
        }),
        ...createSharedBillColumns(getBill, filterBadgeClick),
        ...createHiddenFilterColumns(getBill),
    ];
}

//Create all columns for SPONSORED BILLS TABLE
function createSponsoredColumns(
    {
        filterBadgeClick,
    }: {
        filterBadgeClick: (key: string, value: string) => void;
    },
    getRole: (bill: Bill) => SponsorRole,
    onRoleSelect: (role: SponsorRole) => void,
) {
    const getBill = (row: Bill) => row;

    return [
        createDataTableColumn<Bill>({
            id: "bill",
            name: "Bill",
            selector: (row: Bill) => row.id + row.shortTitle,
            width: "280px",
            cell: (row: Bill) => (
                <BillCell
                    id={row.id}
                    sessionId={row.sessionId}
                    shortTitle={row.shortTitle}
                />
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "role",
            name: "Role",
            selector: (row: Bill) => roleLabels[getRole(row)],
            width: "150px",
            cell: (row: Bill) => (
                <button
                    className={`${style.roleTag} ${getRole(row) === "sponsor" ? style.roleTag__sponsor : ""}`}
                    onClick={() => onRoleSelect(getRole(row))}
                >
                    {roleLabels[getRole(row)]}
                </button>
            ),
            filterConfig: {
                type: FilterType.Select,
                options: Object.values(roleLabels),
            },
        }),
        ...createSharedBillColumns(getBill, filterBadgeClick),
        ...createHiddenFilterColumns(getBill),
    ];
}

//counts how many items have each key
function countBy<T>(list: T[], getKey: (item: T) => string) {
    const counts = new Map<string, number>();
    for (const item of list) {
        const key = getKey(item);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
}

const formatPercent = (part: number, total: number) =>
    total ? `${Math.round((part / total) * 100)}%` : "—";

const LegislatorDetailsPage = () => {
    const [legislatorDetails, setLegislatorDetails] = useState<Legislator>();
    const [legislatorVotes, setLegislatorVotes] = useState<LegislatorVote[]>(
        [],
    );
    const [sponsoredBills, setSponsoredBills] = useState<Bill[]>([]);
    const [votesLoading, setVotesLoading] = useState(true);
    const [sponsoredLoading, setSponsoredLoading] = useState(true);

    //the tab and scores year live in the URL (?tab=scores&year=2026) so other pages can link straight to them
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get("tab") as DetailsView | null;
    const view: DetailsView =
        tabParam && detailsViews.includes(tabParam) ? tabParam : "votes";
    const scoresYear = searchParams.get("year");

    const updateParams = (changes: Record<string, string>) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(changes).forEach(([key, value]) => next.set(key, value));
        setSearchParams(next, { replace: true });
    };
    const [selectedSession, setSelectedSession] = useState<string | null>(null);
    const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
    const [selectedRole, setSelectedRole] = useState<SponsorRole | null>(null);

    let { legislatorId } = useParams<string>();
    if (!legislatorId) {
        legislatorId = "";
    }

    useEffect(() => {
        const fetchLegislatorDetails = async () => {
            try {
                setLegislatorDetails(await getLegislatorDetails(legislatorId));
            } catch (error) {
                console.log(error);
            }
        };

        const fetchVotes = async () => {
            try {
                setLegislatorVotes(await getLegislatorVotes(legislatorId));
            } catch (error) {
                console.log(error);
            } finally {
                setVotesLoading(false);
            }
        };

        const fetchSponsoredBills = async () => {
            try {
                setSponsoredBills(
                    await getLegislatorSponsoredBills(legislatorId),
                );
            } catch (error) {
                console.log(error);
            } finally {
                setSponsoredLoading(false);
            }
        };

        fetchLegislatorDetails();
        fetchVotes();
        fetchSponsoredBills();
    }, [legislatorId]);

    //a bill's primary sponsor is "sponsor", otherwise this legislator was the floor sponsor
    const getRole = (bill: Bill): SponsorRole =>
        bill.billSponsor === legislatorId ? "sponsor" : "floor";

    const matchesSession = (sessionId: string) =>
        !selectedSession || sessionId === selectedSession;

    //session filter applies to the stats and both tabs
    const sessionVotes = legislatorVotes.filter((v) =>
        matchesSession(v.bill.sessionId),
    );
    const sessionSponsored = sponsoredBills.filter((b) =>
        matchesSession(b.sessionId),
    );

    const tableVotes = sessionVotes.filter(
        (v) => !selectedVote || v.vote === selectedVote,
    );
    const tableSponsored = sessionSponsored.filter(
        (b) => !selectedRole || getRole(b) === selectedRole,
    );

    //each filter's counts apply the other filter but not its own
    const sessionCounts =
        view === "votes"
            ? countBy(
                  legislatorVotes.filter(
                      (v) => !selectedVote || v.vote === selectedVote,
                  ),
                  (v) => v.bill.sessionId,
              )
            : countBy(
                  sponsoredBills.filter(
                      (b) => !selectedRole || getRole(b) === selectedRole,
                  ),
                  (b) => b.sessionId,
              );
    //newest session first - sessions from both lists so the chips don't change when switching tabs
    const sessionOptions = [
        ...new Set([
            ...legislatorVotes.map((v) => v.bill.sessionId),
            ...sponsoredBills.map((b) => b.sessionId),
        ]),
    ].sort((a, b) => b.localeCompare(a));

    const voteCounts = countBy(sessionVotes, (v) => v.vote);
    const roleCounts = countBy(sessionSponsored, getRole);

    const yesCount = voteCounts.get(VoteValue.Yes) ?? 0;
    const noCount = voteCounts.get(VoteValue.No) ?? 0;
    const absentCount = voteCounts.get(VoteValue.Absent) ?? 0;
    const castCount = yesCount + noCount;

    const stats = [
        { label: "Votes Cast", value: castCount.toLocaleString() },
        { label: "Voted Yes", value: formatPercent(yesCount, castCount) },
        {
            label: "Missed Votes",
            value: `${absentCount} (${formatPercent(absentCount, sessionVotes.length)})`,
        },
        {
            label: "Bills Sponsored",
            value: sessionSponsored.length.toLocaleString(),
        },
    ];

    const counties = (legislatorDetails?.counties ?? "")
        .split(",")
        .map((county) => county.trim())
        .filter(Boolean);

    return (
        <ListPage fillLastChild={view !== "scores"}>
            <Link className={style.backLink} to="/legislators">
                ← All legislators
            </Link>

            {/* Profile */}
            <section className={style.profile}>
                <div className={style.profile__main}>
                    {legislatorDetails?.image ? (
                        <img
                            className={style.profile__photo}
                            src={legislatorDetails.image}
                            alt={legislatorDetails.fullName}
                        />
                    ) : (
                        <div className={style.profile__photo}></div>
                    )}
                    <div className={style.profile__info}>
                        <span className={style.profile__eyebrow}>
                            {legislatorDetails
                                ? `${legislatorDetails.house} · District ${legislatorDetails.district}`
                                : "Loading..."}
                        </span>
                        <h1 className={style.profile__name}>
                            {legislatorDetails?.formatName}
                        </h1>
                        <div className={style.profile__tags}>
                            <Badge
                                type="party"
                                value={legislatorDetails?.party}
                            />
                            {counties.map((county) => (
                                <Badge
                                    key={county}
                                    type="subjects"
                                    value={`${county} County`}
                                />
                            ))}
                        </div>
                        {legislatorDetails?.serviceStart && (
                            <div className={style.profile__service}>
                                Serving since {legislatorDetails.serviceStart}
                            </div>
                        )}
                        <div className={style.profile__actions}>
                            {legislatorDetails?.email && (
                                <a
                                    className={`${style.actionButton} ${style.actionButton__primary}`}
                                    href={`mailto:${legislatorDetails.email}`}
                                >
                                    Email
                                </a>
                            )}
                            {legislatorDetails?.phone && (
                                <a
                                    className={style.actionButton}
                                    href={`tel:+1${legislatorDetails.phone}`}
                                >
                                    Call {legislatorDetails.phone}
                                </a>
                            )}
                            {legislatorDetails?.link && (
                                <a
                                    className={style.actionButton}
                                    href={legislatorDetails.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Official bio {"↗︎"}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                <StatCards
                    stats={stats}
                    loading={votesLoading || sponsoredLoading}
                />
            </section>

            <PillTabs
                options={[
                    {
                        value: "votes",
                        label: `Voting History (${sessionVotes.length.toLocaleString()})`,
                    },
                    {
                        value: "sponsored",
                        label: `Sponsored Bills (${sessionSponsored.length.toLocaleString()})`,
                    },
                    { value: "scores", label: "Policy Scores" },
                ]}
                selectedValue={view}
                onSelect={(value) => updateParams({ tab: value })}
            />

            {view === "scores" && (
                <LegislatorPolicyScores
                    legislatorId={legislatorId}
                    legislatorName={legislatorDetails?.formatName}
                    year={scoresYear}
                    onYearChange={(year) => updateParams({ year })}
                />
            )}

            {view !== "scores" && (
                <FilterCard title="Filter">
                    <FilterRow label="Session">
                        <FilterChip
                            label="All Sessions"
                            active={!selectedSession}
                            onClick={() => setSelectedSession(null)}
                        />
                        {sessionOptions.map((session) => (
                            <FilterChip
                                key={session}
                                label={String(normalizeSessionId(session))}
                                count={sessionCounts.get(session) ?? 0}
                                active={selectedSession === session}
                                onClick={() =>
                                    setSelectedSession(
                                        selectedSession === session
                                            ? null
                                            : session,
                                    )
                                }
                            />
                        ))}
                    </FilterRow>

                    {view === "votes" ? (
                        <FilterRow label="Vote">
                            <FilterChip
                                label="All Votes"
                                active={!selectedVote}
                                onClick={() => setSelectedVote(null)}
                            />
                            {Object.values(VoteValue).map((vote) => (
                                <FilterChip
                                    key={vote}
                                    label={voteLabels[vote]}
                                    count={voteCounts.get(vote) ?? 0}
                                    active={selectedVote === vote}
                                    onClick={() =>
                                        setSelectedVote(
                                            selectedVote === vote ? null : vote,
                                        )
                                    }
                                />
                            ))}
                        </FilterRow>
                    ) : (
                        <FilterRow label="Role">
                            <FilterChip
                                label="All Roles"
                                active={!selectedRole}
                                onClick={() => setSelectedRole(null)}
                            />
                            {(Object.keys(roleLabels) as SponsorRole[]).map(
                                (role) => (
                                    <FilterChip
                                        key={role}
                                        label={roleLabels[role]}
                                        count={roleCounts.get(role) ?? 0}
                                        active={selectedRole === role}
                                        onClick={() =>
                                            setSelectedRole(
                                                selectedRole === role
                                                    ? null
                                                    : role,
                                            )
                                        }
                                    />
                                ),
                            )}
                        </FilterRow>
                    )}
                </FilterCard>
            )}

            {/* keyed by view so each table keeps its own search/filters instead of sharing state */}
            {view === "votes" ? (
                <GeneralTable
                    key="votes"
                    columns={(helpers) =>
                        createVoteColumns(helpers, setSelectedVote)
                    }
                    data={tableVotes}
                    defaultSortId="sessionId"
                    defaultSortAscending={false}
                    loading={votesLoading}
                />
            ) : view === "sponsored" ? (
                <GeneralTable
                    key="sponsored"
                    columns={(helpers) =>
                        createSponsoredColumns(
                            helpers,
                            getRole,
                            setSelectedRole,
                        )
                    }
                    data={tableSponsored}
                    defaultSortId="sessionId"
                    defaultSortAscending={false}
                    loading={sponsoredLoading}
                />
            ) : null}
        </ListPage>
    );
};

export default LegislatorDetailsPage;
