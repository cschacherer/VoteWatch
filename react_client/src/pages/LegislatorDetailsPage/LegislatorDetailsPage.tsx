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
import { createDataTableColumn } from "../../models/DataTableUtils";
import Badge from "../../components/Badge/Badge";
import BillCell from "../../components/BillCell/BillCell";
import {
    billCellSearchText,
    policyChipSearchText,
} from "../../utils/searchText";
import { formatPolicyName } from "../../utils/stringFormat";
import PolicyChip from "../../components/PolicyChip/PolicyChip";
import ChipSelect from "../../components/ChipSelect/ChipSelect";
import ListPage from "../../components/ListPage/ListPage";
import { StatCards } from "../../components/PageHeader/PageHeader";
import PillTabs from "../../components/PillTabs/PillTabs";
import FilterCard, {
    ClearFiltersButton,
    FilterRow,
} from "../../components/FilterCard/FilterCard";
import ToggleSwitch from "../../components/ToggleSwitch/ToggleSwitch";
import FilterChip from "../../components/FilterChip/FilterChip";
import SearchableDropdown, {
    type DropdownOption,
} from "../../components/SearchableDropdown/SearchableDropdown";
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

type BillStatus = "passed" | "failed";

const statusOf = (bill: Bill): BillStatus =>
    bill.passed ? "passed" : "failed";

//clicking a value in a row selects the matching filter at the top of the page
type BillClickHandlers = {
    onSessionSelect: (sessionId: string) => void;
    onStatusSelect: (status: BillStatus) => void;
    onSubjectSelect: (subject: string) => void;
    onPolicySelect: (topic: string, direction: string | null) => void;
};

//hidden - only used for the default newest-session-first sort
function createSessionSortColumn<T>(getBill: (row: T) => Bill) {
    return createDataTableColumn<T>({
        id: "sessionId",
        name: "Session",
        selector: (row: T) => normalizeSessionId(getBill(row).sessionId),
        omit: true,
    });
}

function createBillColumn<T>(
    getBill: (row: T) => Bill,
    { onSessionSelect }: BillClickHandlers,
) {
    return createDataTableColumn<T>({
        id: "bill",
        name: "Bill",
        selector: (row: T) => getBill(row).id + getBill(row).shortTitle,
        searchText: (row: T) => billCellSearchText(getBill(row)),
        width: "280px",
        cell: (row: T) => (
            <BillCell
                id={getBill(row).id}
                sessionId={getBill(row).sessionId}
                shortTitle={getBill(row).shortTitle}
                onSessionClick={onSessionSelect}
            />
        ),
    });
}

//columns shared by both tables - passed, summary, policies, and subjects
function createSharedBillColumns<T>(
    getBill: (row: T) => Bill,
    { onStatusSelect, onSubjectSelect, onPolicySelect }: BillClickHandlers,
) {
    return [
        createDataTableColumn<T>({
            id: "passed",
            name: "Passed",
            selector: (row: T) => statusOf(getBill(row)),
            width: "130px",
            cell: (row: T) => (
                <Badge
                    type="passed"
                    value={getBill(row).passed}
                    onClick={() => onStatusSelect(statusOf(getBill(row)))}
                />
            ),
        }),
        createDataTableColumn<T>({
            id: "summary",
            name: "Summary",
            selector: (row: T) => getBill(row).summary?.oneSentence ?? "",
            grow: 2,
            minWidth: "300px",
        }),
        createDataTableColumn<T>({
            id: "policy",
            name: "Policies",
            selector: (row: T) => getBill(row).policies,
            searchText: (row: T) =>
                getBill(row).policies.flatMap(policyChipSearchText),
            minWidth: "300px",
            sortable: false,
            grow: 1.5,
            cell: (row: T) => {
                return (
                    <div className={style.policyList}>
                        {getBill(row).policies.map((policy) => (
                            <PolicyChip
                                key={policy.policyTopic}
                                policy={policy}
                                onTopicClick={(p) =>
                                    onPolicySelect(p.policyTopic, null)
                                }
                                onDirectionClick={(p) =>
                                    onPolicySelect(
                                        p.policyTopic,
                                        p.policyDirection,
                                    )
                                }
                            ></PolicyChip>
                        ))}
                    </div>
                );
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
                    onBadgeClick={(value) => onSubjectSelect(value)}
                />
            ),
        }),
    ];
}

//Create all columns for VOTE TABLE
function createVoteColumns(
    onVoteSelect: (vote: VoteValue) => void,
    handlers: BillClickHandlers,
) {
    const getBill = (row: LegislatorVote) => row.bill;

    return [
        createBillColumn(getBill, handlers),
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
        }),
        ...createSharedBillColumns(getBill, handlers),
        createSessionSortColumn(getBill),
    ];
}

//Create all columns for SPONSORED BILLS TABLE
function createSponsoredColumns(
    getRole: (bill: Bill) => SponsorRole,
    onRoleSelect: (role: SponsorRole) => void,
    handlers: BillClickHandlers,
) {
    const getBill = (row: Bill) => row;

    return [
        createBillColumn(getBill, handlers),
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
        }),
        ...createSharedBillColumns(getBill, handlers),
        createSessionSortColumn(getBill),
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

//every session belongs to one year - "2025S2" -> 2025
const sessionYear = (sessionId: string) => Number(sessionId.slice(0, 4));

//"2025 Special Session 1" -> "Special Session 1" (the year is already picked above)
const sessionLabel = (sessionId: string) =>
    String(normalizeSessionId(sessionId)).replace(/^\d{4}\s*/, "");

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

    //the tab and scores year/session live in the URL (?tab=scores&year=2025&session=2025S1) so other
    //pages can link straight to them
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get("tab") as DetailsView | null;
    const view: DetailsView =
        tabParam && detailsViews.includes(tabParam) ? tabParam : "votes";
    const scoresYear = searchParams.get("year");
    const scoresSession = searchParams.get("session");

    //an empty or null value removes that param
    const updateParams = (changes: Record<string, string | null>) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(changes).forEach(([key, value]) =>
            value ? next.set(key, value) : next.delete(key),
        );
        setSearchParams(next, { replace: true });
    };
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedSession, setSelectedSession] = useState<string | null>(null);
    const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
    const [selectedRole, setSelectedRole] = useState<SponsorRole | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<BillStatus | null>(
        null,
    );
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedDirection, setSelectedDirection] = useState<string | null>(
        null,
    );

    const [primaryOnly, setPrimaryOnly] = useState(false);

    //direction belongs to a topic, so they're always set together
    const selectPolicy = (topic: string | null, direction: string | null) => {
        setSelectedTopic(topic);
        setSelectedDirection(direction);
    };

    //how many filters are on - "primary only" counts because it changes which bills match. Vote and
    //role only count on their own tab, since each only filters that tab's table
    const activeFilterCount = [
        selectedYear !== null,
        selectedSession !== null,
        view === "votes" ? selectedVote !== null : selectedRole !== null,
        selectedStatus !== null,
        selectedSubject !== null,
        selectedTopic !== null,
        selectedDirection !== null,
        primaryOnly,
    ].filter(Boolean).length;

    const clearAllFilters = () => {
        setSelectedYear(null);
        setSelectedSession(null);
        setSelectedVote(null);
        setSelectedRole(null);
        setSelectedStatus(null);
        setSelectedSubject(null);
        selectPolicy(null, null);
        setPrimaryOnly(false);
    };

    //clicking a value in a table row filters to just that value - every other filter goes back to
    //"All". The state updates are batched, so the clicked filter set after the clear wins
    const filterFromRow = (applyFilter: () => void) => {
        clearAllFilters();
        applyFilter();
    };

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

    const matchesYear = (sessionId: string) =>
        selectedYear === null || sessionYear(sessionId) === selectedYear;
    const matchesSession = (sessionId: string) =>
        !selectedSession || sessionId === selectedSession;
    //the year, then optionally one of that year's sessions
    const matchesTime = (sessionId: string) =>
        matchesYear(sessionId) && matchesSession(sessionId);

    //the year and session filters apply to the stats and both tabs
    const sessionVotes = legislatorVotes.filter((v) =>
        matchesTime(v.bill.sessionId),
    );
    const sessionSponsored = sponsoredBills.filter((b) =>
        matchesTime(b.sessionId),
    );

    const matchesStatus = (bill: Bill) =>
        !selectedStatus || statusOf(bill) === selectedStatus;
    const matchesSubject = (bill: Bill) =>
        !selectedSubject || (bill.subjects ?? []).includes(selectedSubject);
    //the policies that count for filtering - all of them, or only primary when the switch is on
    const eligiblePolicies = (bill: Bill) =>
        primaryOnly
            ? bill.policies.filter(
                  (policy) => policy.policyTopicStrength === "primary",
              )
            : bill.policies;
    const matchesPolicy = (bill: Bill) =>
        !selectedTopic ||
        eligiblePolicies(bill).some(
            (policy) =>
                policy.policyTopic === selectedTopic &&
                (!selectedDirection ||
                    policy.policyDirection === selectedDirection),
        );
    const matchesVote = (vote: VoteValue) =>
        !selectedVote || vote === selectedVote;
    const matchesRole = (bill: Bill) =>
        !selectedRole || getRole(bill) === selectedRole;

    const tableVotes = legislatorVotes.filter(
        (v) =>
            matchesTime(v.bill.sessionId) &&
            matchesVote(v.vote) &&
            matchesStatus(v.bill) &&
            matchesSubject(v.bill) &&
            matchesPolicy(v.bill),
    );
    const tableSponsored = sponsoredBills.filter(
        (b) =>
            matchesTime(b.sessionId) &&
            matchesRole(b) &&
            matchesStatus(b) &&
            matchesSubject(b) &&
            matchesPolicy(b),
    );

    //the open tab's rows as { bill, vote or role }, so the filter counts below work for either tab
    const viewRows =
        view === "votes"
            ? legislatorVotes.map((v) => ({
                  bill: v.bill,
                  matchesOwnFilter: matchesVote(v.vote),
                  ownKey: v.vote as string,
              }))
            : sponsoredBills.map((b) => ({
                  bill: b,
                  matchesOwnFilter: matchesRole(b),
                  ownKey: getRole(b) as string,
              }));

    //each filter's counts apply every OTHER filter but not its own, so each chip shows how many rows
    //clicking it would give
    //skipping the year also skips the session, since a session only exists inside its year
    const rowsExcept = (
        skip: "year" | "session" | "own" | "status" | "subject" | "policy",
    ) =>
        viewRows.filter(
            (row) =>
                (skip === "year" || matchesYear(row.bill.sessionId)) &&
                (skip === "year" ||
                    skip === "session" ||
                    matchesSession(row.bill.sessionId)) &&
                (skip === "own" || row.matchesOwnFilter) &&
                (skip === "status" || matchesStatus(row.bill)) &&
                (skip === "subject" || matchesSubject(row.bill)) &&
                (skip === "policy" || matchesPolicy(row.bill)),
        );

    const yearCounts = countBy(rowsExcept("year"), (row) =>
        String(sessionYear(row.bill.sessionId)),
    );
    const sessionCounts = countBy(
        rowsExcept("session"),
        (row) => row.bill.sessionId,
    );
    //vote counts on the voting tab, role counts on the sponsored tab
    const ownCounts = countBy(rowsExcept("own"), (row) => row.ownKey);
    const statusCounts = countBy(rowsExcept("status"), (row) =>
        statusOf(row.bill),
    );

    const subjectCounts = new Map<string, number>();
    for (const row of rowsExcept("subject")) {
        for (const subject of new Set(row.bill.subjects ?? [])) {
            subjectCounts.set(subject, (subjectCounts.get(subject) ?? 0) + 1);
        }
    }
    //most common first
    const subjectOptions: DropdownOption[] = [...subjectCounts.keys()]
        .sort(
            (a, b) => (subjectCounts.get(b) ?? 0) - (subjectCounts.get(a) ?? 0),
        )
        .map((subject) => ({
            value: subject,
            label: subject,
            count: subjectCounts.get(subject) ?? 0,
        }));
    //keep the selected subject in the list even if the other filters leave it with no rows
    if (selectedSubject && !subjectCounts.has(selectedSubject)) {
        subjectOptions.unshift({
            value: selectedSubject,
            label: selectedSubject,
            count: 0,
        });
    }

    //topic counts, then the selected topic's direction counts - a bill counts once per topic
    const policyRows = rowsExcept("policy");
    const topicCounts = new Map<string, number>();
    const directionCounts = new Map<string, number>();
    for (const row of policyRows) {
        for (const topic of new Set(
            eligiblePolicies(row.bill).map((policy) => policy.policyTopic),
        )) {
            topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
        }
        for (const direction of new Set(
            eligiblePolicies(row.bill)
                .filter((policy) => policy.policyTopic === selectedTopic)
                .map((policy) => policy.policyDirection),
        )) {
            directionCounts.set(
                direction,
                (directionCounts.get(direction) ?? 0) + 1,
            );
        }
    }
    const topicOptions = [...topicCounts.keys()].sort((a, b) =>
        a.localeCompare(b),
    );
    //keep the selected topic and direction visible even if the other filters leave them with no rows
    if (selectedTopic && !topicCounts.has(selectedTopic)) {
        topicOptions.push(selectedTopic);
    }
    //most bills first
    const directionOptions = [...directionCounts.keys()].sort(
        (a, b) => (directionCounts.get(b) ?? 0) - (directionCounts.get(a) ?? 0),
    );
    if (selectedDirection && !directionCounts.has(selectedDirection)) {
        directionOptions.push(selectedDirection);
    }

    //newest first - from both lists so the chips don't change when switching tabs
    const allSessions = [
        ...new Set([
            ...legislatorVotes.map((v) => v.bill.sessionId),
            ...sponsoredBills.map((b) => b.sessionId),
        ]),
    ].sort((a, b) => b.localeCompare(a));
    const yearOptions = [...new Set(allSessions.map(sessionYear))];
    //the selected year's sessions - the session row shows once a year is picked
    const yearSessions =
        selectedYear === null
            ? []
            : allSessions.filter((id) => sessionYear(id) === selectedYear);

    //picking a year clears the session, since the old session may belong to a different year
    const selectYear = (year: number | null) => {
        setSelectedYear(year);
        setSelectedSession(null);
    };

    //clicking a session badge in a row selects its year and the session itself
    const selectSessionFromRow = (sessionId: string) => {
        setSelectedYear(sessionYear(sessionId));
        setSelectedSession(sessionId);
    };

    //the stat cards describe the legislator, so they only follow the year and session filters
    const voteCounts = countBy(sessionVotes, (v) => v.vote);

    const yesCount = voteCounts.get(VoteValue.Yes) ?? 0;
    const noCount = voteCounts.get(VoteValue.No) ?? 0;
    const absentCount = voteCounts.get(VoteValue.Absent) ?? 0;
    const castCount = yesCount + noCount;

    const billClickHandlers: BillClickHandlers = {
        onSessionSelect: (sessionId) =>
            filterFromRow(() => selectSessionFromRow(sessionId)),
        onStatusSelect: (status) =>
            filterFromRow(() => setSelectedStatus(status)),
        onSubjectSelect: (subject) =>
            filterFromRow(() => setSelectedSubject(subject)),
        onPolicySelect: (topic, direction) =>
            filterFromRow(() => selectPolicy(topic, direction)),
    };

    const stats = [
        { label: "Votes Cast", value: castCount.toLocaleString() },
        { label: "Voted Yes", value: formatPercent(yesCount, castCount) },
        {
            label: "Missed Votes",
            value: `${absentCount} (${formatPercent(absentCount, sessionVotes.length)})`,
        },
        {
            label: "Sponsored",
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
                                    type="basic"
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
                                    {legislatorDetails.email}
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
                    { value: "scores", label: "Voting Analysis" },
                ]}
                selectedValue={view}
                onSelect={(value) => updateParams({ tab: value })}
            />

            {view === "scores" && (
                <LegislatorPolicyScores
                    legislatorId={legislatorId}
                    legislatorName={legislatorDetails?.formatName}
                    year={scoresYear}
                    session={scoresSession}
                    //a new year clears the session, since the old one belongs to a different year
                    onYearChange={(year) =>
                        updateParams({ year, session: null })
                    }
                    onSessionChange={(session) => updateParams({ session })}
                />
            )}

            {view !== "scores" && (
                <FilterCard
                    title="Filter"
                    action={
                        <ClearFiltersButton
                            count={activeFilterCount}
                            onClick={clearAllFilters}
                        />
                    }
                >
                    <FilterRow label="Year">
                        <FilterChip
                            label="All Years"
                            active={selectedYear === null}
                            onClick={() => selectYear(null)}
                        />
                        {yearOptions.map((year) => (
                            <FilterChip
                                key={year}
                                label={String(year)}
                                count={yearCounts.get(String(year)) ?? 0}
                                active={selectedYear === year}
                                onClick={() =>
                                    selectYear(
                                        selectedYear === year ? null : year,
                                    )
                                }
                            />
                        ))}
                    </FilterRow>

                    {/* once a year is picked, its sessions - even a year with only a General Session */}
                    {selectedYear !== null && (
                        <FilterRow label="Session">
                            <FilterChip
                                label={`All ${selectedYear}`}
                                active={!selectedSession}
                                onClick={() => setSelectedSession(null)}
                            />
                            {yearSessions.map((session) => (
                                <FilterChip
                                    key={session}
                                    label={sessionLabel(session)}
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
                    )}

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
                                    count={ownCounts.get(vote) ?? 0}
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
                                        count={ownCounts.get(role) ?? 0}
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

                    <FilterRow label="Status">
                        <FilterChip
                            label="All Bills"
                            active={!selectedStatus}
                            onClick={() => setSelectedStatus(null)}
                        />
                        {(["passed", "failed"] as BillStatus[]).map(
                            (status) => (
                                <FilterChip
                                    key={status}
                                    label={
                                        status === "passed"
                                            ? "Passed"
                                            : "Did Not Pass"
                                    }
                                    count={statusCounts.get(status) ?? 0}
                                    active={selectedStatus === status}
                                    onClick={() =>
                                        setSelectedStatus(
                                            selectedStatus === status
                                                ? null
                                                : status,
                                        )
                                    }
                                />
                            ),
                        )}
                    </FilterRow>

                    <FilterRow
                        label="Topic"
                        action={
                            <ToggleSwitch
                                label="Primary policies only"
                                title="Only match bills where the topic or direction is the bill's primary policy"
                                checked={primaryOnly}
                                onChange={setPrimaryOnly}
                            />
                        }
                    >
                        <ChipSelect
                            options={topicOptions.map((topic) => ({
                                value: topic,
                                label: formatPolicyName(topic),
                                count: topicCounts.get(topic) ?? 0,
                            }))}
                            selectedValue={selectedTopic}
                            onSelect={(topic) => selectPolicy(topic, null)}
                            allLabel="All Topics"
                            searchPlaceholder="Search topics..."
                        />
                    </FilterRow>

                    {selectedTopic && (
                        <FilterRow label="Direction">
                            <FilterChip
                                label={`All ${formatPolicyName(selectedTopic)}`}
                                active={!selectedDirection}
                                onClick={() =>
                                    selectPolicy(selectedTopic, null)
                                }
                            />
                            {directionOptions.map((direction) => (
                                <FilterChip
                                    key={direction}
                                    label={formatPolicyName(direction)}
                                    count={directionCounts.get(direction) ?? 0}
                                    active={selectedDirection === direction}
                                    onClick={() =>
                                        selectPolicy(
                                            selectedTopic,
                                            selectedDirection === direction
                                                ? null
                                                : direction,
                                        )
                                    }
                                />
                            ))}
                        </FilterRow>
                    )}

                    <FilterRow label="Subject">
                        <SearchableDropdown
                            options={subjectOptions}
                            selectedValue={selectedSubject}
                            onSelect={setSelectedSubject}
                            allLabel="All Subjects"
                            searchPlaceholder={`Search ${subjectOptions.length} subjects...`}
                        />
                    </FilterRow>
                </FilterCard>
            )}

            {/* keyed by view so each table keeps its own search text and sort */}
            {view === "votes" ? (
                <GeneralTable
                    key="votes"
                    columns={createVoteColumns(
                        (vote) => filterFromRow(() => setSelectedVote(vote)),
                        billClickHandlers,
                    )}
                    data={tableVotes}
                    defaultSortId="sessionId"
                    defaultSortAscending={false}
                    loading={votesLoading}
                />
            ) : view === "sponsored" ? (
                <GeneralTable
                    key="sponsored"
                    keyField="rowKey"
                    columns={createSponsoredColumns(
                        getRole,
                        (role) => filterFromRow(() => setSelectedRole(role)),
                        billClickHandlers,
                    )}
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
