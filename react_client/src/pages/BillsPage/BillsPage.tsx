import { useState, useEffect } from "react";
import { getAllBills } from "../../services/billService";
import { type Bill, normalizeSessionId } from "../../models/Bill";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import Badge from "../../components/Badge/Badge";
import { BadgeType } from "../../components/Badge/Badge";
import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";
import PolicyChip from "../../components/PolicyChip/PolicyChip";
import { formatPolicyName } from "../../utils/stringFormat";
import { Link } from "react-router-dom";
import SearchableDropdown, {
    type DropdownOption,
} from "../../components/SearchableDropdown/SearchableDropdown";
import style from "./BillsPage.module.css";

//set all column tables here
//when primaryOnly is on, the hidden policy topic/direction filter columns only include each bill's primary policy
type BillColumnOptions = {
    primaryOnly: boolean;
    showSubjects: boolean;
    onPolicySelect: (topic: string, direction: string | null) => void;
    onSubjectSelect: (subject: string) => void;
};

function createBillColumns(
    {
        filterBadgeClick,
    }: {
        filterBadgeClick: (key: string, value: any) => void;
    },
    {
        primaryOnly,
        showSubjects,
        onPolicySelect,
        onSubjectSelect,
    }: BillColumnOptions,
) {
    const filterablePolicies = (row: Bill) =>
        primaryOnly
            ? row.policies.filter(
                  (policy) => policy.policyTopicStrength === "primary",
              )
            : row.policies;

    return [
        createDataTableColumn<Bill>({
            id: "sessionId",
            name: "Session Id",
            selector: (row: Bill) => normalizeSessionId(row.sessionId),
            omit: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "billId",
            name: "Bill Id",
            selector: (row) => row.id,
            omit: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "shortTitle",
            name: "Title",
            selector: (row) => row.shortTitle,
            sortable: true,
            wrap: true,
            omit: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "fullId",
            name: "Bill",
            selector: (row) => row.id + row.shortTitle,
            sortable: true,
            width: "300px",
            wrap: true,
            cell: (row) => (
                <div className={style.billCell}>
                    <Link
                        className={style.billCell__id}
                        to={`/bills/${row.sessionId}/${row.id}`}
                    >
                        {row.id}
                    </Link>
                    <Link
                        className={style.billCell__title}
                        to={`/bills/${row.sessionId}/${row.id}`}
                    >
                        {row.shortTitle}
                    </Link>
                    <Badge
                        type="sessionId"
                        value={row.sessionId}
                        onClick={(value) =>
                            filterBadgeClick("sessionId", value)
                        }
                    ></Badge>
                </div>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        // createDataTableColumn<Bill>({
        //     id: "generalProvisions",
        //     name: "General Provisions",
        //     selector: (row) => row.generalProvisions,
        //     sortable: true,
        //     grow: 1,
        //     minWidth: "300px",
        //     wrap: true,
        //     filterConfig: {
        //         type: FilterType.Text,
        //     },
        // }),
        createDataTableColumn<Bill>({
            id: "summary",
            name: "Summary",
            selector: (row) => row.summary.oneSentence,
            sortable: true,
            grow: 2,
            minWidth: "300px",
            wrap: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        // createDataTableColumn<Bill>({
        //     id: "highlightedProvisions",
        //     name: "Highlighted Provisions",
        //     selector: (row) => row.highlightedProvisions,
        //     sortable: true,
        //     grow: 1.5,
        //     minWidth: "350px",
        //     wrap: true,
        //     cell: (row) => <CollapsibleCell text={row.highlightedProvisions} />,
        //     filterConfig: {
        //         type: FilterType.Text,
        //     },
        // }),
        createDataTableColumn<Bill>({
            id: "passed",
            name: "Passed",
            selector: (row) => (row.passed ? "passed" : "failed"),
            sortable: true,
            width: "135px",
            cell: (row) => (
                <Badge
                    type={BadgeType.Passed}
                    value={row.passed}
                    onClick={(value) => filterBadgeClick("passed", value)}
                />
            ),
            filterConfig: {
                type: FilterType.Select,
                options: ["PASSED", "FAILED"],
            },
        }),
        //need this column for filtering, but it is redundant with the session id so we hide it by setting
        //width to zero
        createDataTableColumn<Bill>({
            id: "year",
            name: "Year",
            selector: (row) => row.year,
            sortable: true,
            width: "0px",
            filterConfig: {
                type: FilterType.Number,
            },
        }),

        createDataTableColumn<Bill>({
            id: "policy",
            name: "Policies",
            selector: (row: Bill) => row.policies,
            minWidth: "300px",
            grow: 1.5,
            cell: (row: Bill) => {
                return (
                    <div className={style.policyList}>
                        {row.policies.map((policy) => (
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
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "policyTopic",
            name: "Policy Topics",
            selector: (row: Bill) =>
                filterablePolicies(row)
                    .map((policy) => formatPolicyName(policy.policyTopic))
                    .join(", "),
            omit: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "policyDirection",
            name: "Policy Directions",
            selector: (row: Bill) =>
                filterablePolicies(row)
                    .map((policy) => formatPolicyName(policy.policyDirection))
                    .join(", "),
            omit: true,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<Bill>({
            id: "subjects",
            name: "Subjects",
            selector: (row: Bill) => row.subjects,
            omit: !showSubjects,
            sortable: true,
            grow: 1,
            minWidth: "260px",
            wrap: true,
            cell: (row: Bill) => (
                <CollapsibleCell
                    items={row.subjects}
                    onBadgeClick={(value) => onSubjectSelect(value)}
                />
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
    ];
}

//an on/off switch with a label - the real checkbox is visually hidden and the track is drawn with CSS
const ToggleSwitch = ({
    label,
    title,
    checked,
    onChange,
}: {
    label: string;
    title?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) => (
    <label className={style.toggleSwitch} title={title}>
        <input
            type="checkbox"
            role="switch"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
        />
        <span className={style.toggleSwitch__track}></span>
        {label}
    </label>
);

//a selectable chip in the policy filter rows - clicking the active chip again clears it
const PolicyFilterChip = ({
    label,
    count,
    active,
    onClick,
}: {
    label: string;
    count?: number;
    active: boolean;
    onClick: () => void;
}) => (
    <button
        className={`${style.filterChip} ${active ? style.filterChip__active : ""}`}
        aria-pressed={active}
        onClick={onClick}
    >
        {label}
        {count !== undefined && (
            <span className={style.filterChip__count}>{count}</span>
        )}
    </button>
);

const BillsPage = () => {
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState("all");
    const [primaryOnly, setPrimaryOnly] = useState(false);
    //raw keys, ie "education" and "increase_education_funding" - null means no policy filter
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedDirection, setSelectedDirection] = useState<string | null>(
        null,
    );

    const selectPolicy = (topic: string | null, direction: string | null) => {
        setSelectedTopic(topic);
        setSelectedDirection(direction);
    };

    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [showSubjects, setShowSubjects] = useState(true);

    //counts of the rows currently shown in the table (after search + filters) - kept as numbers
    //so repeated reports from GeneralTable with the same counts don't cause re-renders
    const [shownCount, setShownCount] = useState(0);
    const [shownPassedCount, setShownPassedCount] = useState(0);

    const handleFilteredBills = (rows: Bill[]) => {
        setShownCount(rows.length);
        setShownPassedCount(rows.filter((bill) => bill.passed).length);
    };

    useEffect(() => {
        const fetchBills = async () => {
            try {
                const response = await getAllBills();
                setBills(response);
            } catch (e) {
                if (e instanceof Error) {
                    console.error(`Error getting all bills: ${e.message}`);
                } else {
                    console.error("Unknown error getting all bills", e);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchBills();
    }, []);

    //newest session first - ie 2026GS, 2025S2, 2025S1, 2025GS
    const sessions = [...new Set(bills.map((bill) => bill.sessionId))].sort(
        (a, b) => b.localeCompare(a),
    );

    const sessionBills =
        selectedSession === "all"
            ? bills
            : bills.filter((bill) => bill.sessionId === selectedSession);

    //the policies that count for filtering - all of them, or only primary when the switch is on
    const eligiblePolicies = (bill: Bill) =>
        primaryOnly
            ? bill.policies.filter(
                  (policy) => policy.policyTopicStrength === "primary",
              )
            : bill.policies;

    const billSubjects = (bill: Bill) => bill.subjects ?? [];

    const matchesPolicy = (bill: Bill) =>
        !selectedTopic ||
        eligiblePolicies(bill).some(
            (policy) =>
                policy.policyTopic === selectedTopic &&
                (!selectedDirection ||
                    policy.policyDirection === selectedDirection),
        );

    const matchesSubject = (bill: Bill) =>
        !selectedSubject || billSubjects(bill).includes(selectedSubject);

    const tableBills = sessionBills.filter(
        (bill) => matchesPolicy(bill) && matchesSubject(bill),
    );

    //each filter section's counts apply the session and the OTHER sections' filters but not its own,
    //so every chip shows how many bills clicking it would give
    const billsForPolicyCounts = sessionBills.filter(matchesSubject);
    const billsForSubjectCounts = sessionBills.filter(matchesPolicy);

    const countBillsBy = (
        billList: Bill[],
        getKeys: (bill: Bill) => string[],
    ): Map<string, number> => {
        const counts = new Map<string, number>();
        for (const bill of billList) {
            for (const key of new Set(getKeys(bill))) {
                counts.set(key, (counts.get(key) ?? 0) + 1);
            }
        }
        return counts;
    };

    const topicCounts = countBillsBy(billsForPolicyCounts, (bill) =>
        eligiblePolicies(bill).map((policy) => policy.policyTopic),
    );
    const topicOptions = [...topicCounts.keys()].sort((a, b) =>
        a.localeCompare(b),
    );
    //keep the selected topic visible even if the current session has none
    if (selectedTopic && !topicCounts.has(selectedTopic)) {
        topicOptions.push(selectedTopic);
    }

    const directionCounts = countBillsBy(billsForPolicyCounts, (bill) =>
        eligiblePolicies(bill)
            .filter((policy) => policy.policyTopic === selectedTopic)
            .map((policy) => policy.policyDirection),
    );
    const directionOptions = [...directionCounts.keys()].sort(
        (a, b) => (directionCounts.get(b) ?? 0) - (directionCounts.get(a) ?? 0),
    );
    if (selectedDirection && !directionCounts.has(selectedDirection)) {
        directionOptions.push(selectedDirection);
    }

    const subjectCounts = countBillsBy(billsForSubjectCounts, billSubjects);
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
    //keep the selected subject in the list even if the other filters leave it with no bills
    if (selectedSubject && !subjectCounts.has(selectedSubject)) {
        subjectOptions.unshift({
            value: selectedSubject,
            label: selectedSubject,
            count: 0,
        });
    }

    const passRate = shownCount
        ? Math.round((shownPassedCount / shownCount) * 100)
        : 0;

    const stats = [
        { label: "Bills", value: shownCount.toLocaleString() },
        { label: "Passed", value: shownPassedCount.toLocaleString() },
        { label: "Pass Rate", value: `${passRate}%` },
    ];

    return (
        <div className={`page pageScroll ${style.billsPage}`}>
            <div className={style.billsPage__content}>
                {/* Header */}
                <header className={style.header}>
                    <div>
                        <span className={style.header__eyebrow}>
                            Utah State Legislature
                        </span>
                        <h1 className={style.header__title}>Bills</h1>
                        <p className={style.header__subtitle}>
                            Browse every bill with plain-English summaries,
                            policy topics, and whether it passed.
                        </p>
                    </div>
                    <div className={style.stats}>
                        {stats.map((stat) => (
                            <div key={stat.label} className={style.stat}>
                                <div className={style.stat__value}>
                                    {loading ? "—" : stat.value}
                                </div>
                                <div className={style.stat__label}>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </header>

                {/* Session Tabs */}
                <div className={style.sessionTabs} role="tablist">
                    {["all", ...sessions].map((session) => (
                        <button
                            key={session}
                            role="tab"
                            aria-selected={selectedSession === session}
                            className={`${style.sessionTab} ${selectedSession === session ? style.sessionTab__active : ""}`}
                            onClick={() => setSelectedSession(session)}
                        >
                            {session === "all"
                                ? "All Sessions"
                                : String(normalizeSessionId(session))}
                        </button>
                    ))}
                </div>

                {/* Policy Filters */}
                <section className={style.policyFilters}>
                    <div className={style.policyFilters__header}>
                        <span className={style.policyFilters__title}>
                            Filter by policy
                        </span>
                        <ToggleSwitch
                            label="Primary policies only"
                            title="Only match bills where the topic or direction is the bill's primary policy"
                            checked={primaryOnly}
                            onChange={setPrimaryOnly}
                        />
                    </div>

                    <div className={style.filterRow}>
                        <span className={style.filterRow__label}>Topic</span>
                        <div className={style.chips}>
                            <PolicyFilterChip
                                label="All Topics"
                                active={!selectedTopic}
                                onClick={() => selectPolicy(null, null)}
                            />
                            {topicOptions.map((topic) => (
                                <PolicyFilterChip
                                    key={topic}
                                    label={formatPolicyName(topic)}
                                    count={topicCounts.get(topic) ?? 0}
                                    active={selectedTopic === topic}
                                    onClick={() =>
                                        selectPolicy(
                                            selectedTopic === topic
                                                ? null
                                                : topic,
                                            null,
                                        )
                                    }
                                />
                            ))}
                        </div>
                    </div>

                    {selectedTopic && (
                        <div className={style.filterRow}>
                            <span className={style.filterRow__label}>
                                Direction
                            </span>
                            <div className={style.chips}>
                                <PolicyFilterChip
                                    label={`All ${formatPolicyName(selectedTopic)}`}
                                    active={!selectedDirection}
                                    onClick={() =>
                                        selectPolicy(selectedTopic, null)
                                    }
                                />
                                {directionOptions.map((direction) => (
                                    <PolicyFilterChip
                                        key={direction}
                                        label={formatPolicyName(direction)}
                                        count={
                                            directionCounts.get(direction) ?? 0
                                        }
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
                            </div>
                        </div>
                    )}
                </section>

                {/* Subject Filter */}
                <section
                    className={`${style.policyFilters} ${style.subjectFilter}`}
                >
                    <span className={style.policyFilters__title}>
                        Filter by subject
                    </span>
                    <SearchableDropdown
                        options={subjectOptions}
                        selectedValue={selectedSubject}
                        onSelect={setSelectedSubject}
                        allLabel="All Subjects"
                        searchPlaceholder={`Search ${subjectOptions.length} subjects...`}
                    />
                    <div className={style.subjectFilter__toggle}>
                        <ToggleSwitch
                            label="Show subjects column"
                            title="Show or hide the Subjects column in the table"
                            checked={showSubjects}
                            onChange={setShowSubjects}
                        />
                    </div>
                </section>

                <GeneralTable
                    columns={(helpers) =>
                        createBillColumns(helpers, {
                            primaryOnly,
                            showSubjects,
                            onPolicySelect: selectPolicy,
                            onSubjectSelect: setSelectedSubject,
                        })
                    }
                    data={tableBills}
                    defaultSortId="sessionId"
                    defaultSortAscending={false}
                    loading={loading}
                    onFilteredDataChange={handleFilteredBills}
                ></GeneralTable>
            </div>
        </div>
    );
};

export default BillsPage;
