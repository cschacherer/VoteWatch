import { useState, useEffect } from "react";
import { getAllBills } from "../../services/billService";
import { type Bill, normalizeSessionId } from "../../models/Bill";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import Badge from "../../components/Badge/Badge";
import { BadgeType } from "../../components/Badge/Badge";
import { createDataTableColumn } from "../../models/DataTableUtils";
import PolicyChip from "../../components/PolicyChip/PolicyChip";
import { formatPolicyName } from "../../utils/stringFormat";
import BillCell from "../../components/BillCell/BillCell";
import {
    billCellSearchText,
    policyChipSearchText,
} from "../../utils/searchText";
import SearchableDropdown, {
    type DropdownOption,
} from "../../components/SearchableDropdown/SearchableDropdown";
import ListPage from "../../components/ListPage/ListPage";
import PageHeader from "../../components/PageHeader/PageHeader";
import FilterCard, {
    ClearFiltersButton,
    FilterRow,
} from "../../components/FilterCard/FilterCard";
import FilterChip from "../../components/FilterChip/FilterChip";
import ChipSelect from "../../components/ChipSelect/ChipSelect";
import ToggleSwitch from "../../components/ToggleSwitch/ToggleSwitch";
import style from "./BillsPage.module.css";

type BillStatus = "passed" | "failed";

//set all column tables here
//clicking a session, status, policy, or subject in a row selects that filter at the top of the page
type BillColumnOptions = {
    showSubjects: boolean;
    onSessionSelect: (sessionId: string) => void;
    onStatusSelect: (status: BillStatus) => void;
    onPolicySelect: (topic: string, direction: string | null) => void;
    onSubjectSelect: (subject: string) => void;
};

function createBillColumns({
    showSubjects,
    onSessionSelect,
    onStatusSelect,
    onPolicySelect,
    onSubjectSelect,
}: BillColumnOptions) {
    return [
        createDataTableColumn<Bill>({
            id: "sessionId",
            name: "Session Id",
            selector: (row: Bill) => normalizeSessionId(row.sessionId),
            //hidden - only used for the default newest-session-first sort
            omit: true,
        }),
        createDataTableColumn<Bill>({
            id: "fullId",
            name: "Bill",
            selector: (row) => row.id + row.shortTitle,
            searchText: billCellSearchText,
            sortable: true,
            width: "300px",
            wrap: true,
            cell: (row) => (
                <BillCell
                    id={row.id}
                    sessionId={row.sessionId}
                    shortTitle={row.shortTitle}
                    onSessionClick={onSessionSelect}
                />
            ),
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
                    onClick={() =>
                        onStatusSelect(row.passed ? "passed" : "failed")
                    }
                />
            ),
        }),
        createDataTableColumn<Bill>({
            id: "policy",
            name: "Policies",
            selector: (row: Bill) => row.policies,
            searchText: (row: Bill) =>
                row.policies.flatMap(policyChipSearchText),
            minWidth: "300px",
            sortable: false,
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
        }),
    ];
}

const BillsPage = () => {
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    //const [selectedSession, setSelectedSession] = useState("all");
    const [primaryOnly, setPrimaryOnly] = useState(false);
    //raw keys, ie "education" and "increase_education_funding" - null means no policy filter
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedDirection, setSelectedDirection] = useState<string | null>(
        null,
    );

    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedSession, setSelectedSession] = useState<string | null>(null);

    const selectPolicy = (topic: string | null, direction: string | null) => {
        setSelectedTopic(topic);
        setSelectedDirection(direction);
    };

    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<BillStatus | null>(
        null,
    );
    const [showSubjects, setShowSubjects] = useState(true);

    //how many filters are on - "primary only" counts because it changes which bills match,
    //"show subjects column" doesn't because it only hides a column
    const activeFilterCount = [
        selectedYear !== null,
        selectedSession !== null,
        selectedTopic !== null,
        selectedDirection !== null,
        selectedStatus !== null,
        selectedSubject !== null,
        primaryOnly,
    ].filter(Boolean).length;

    const clearAllFilters = () => {
        setSelectedYear(null);
        setSelectedSession(null);
        selectPolicy(null, null);
        setSelectedStatus(null);
        setSelectedSubject(null);
        setPrimaryOnly(false);
    };

    //clicking a value in a table row filters to just that value - every other filter goes back to
    //"All". The state updates are batched, so the clicked filter set after the clear wins
    const filterFromRow = (applyFilter: () => void) => {
        clearAllFilters();
        applyFilter();
    };

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

    // ----- TIME FILTERS: year, then optionally one of that year's sessions -----

    //every session belongs to one year - "2025S2" -> 2025
    const sessionYear = (sessionId: string) => Number(sessionId.slice(0, 4));

    //newest year first - ie [2026, 2025]
    const yearOptions = [
        ...new Set(bills.map((bill) => sessionYear(bill.sessionId))),
    ].sort((a, b) => b - a);

    const yearBills =
        selectedYear === null
            ? bills
            : bills.filter(
                  (bill) => sessionYear(bill.sessionId) === selectedYear,
              );

    //sessions in the selected year, newest first - ie 2025S2, 2025S1, 2025GS
    const yearSessions = [
        ...new Set(yearBills.map((bill) => bill.sessionId)),
    ].sort((a, b) => b.localeCompare(a));

    //bills in the selected year and session - every other filter starts from these
    const sessionBills =
        selectedSession === null
            ? yearBills
            : yearBills.filter((bill) => bill.sessionId === selectedSession);

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

    //"2025 Special Session 1" -> "Special Session 1" (the year is already picked above)
    const sessionLabel = (sessionId: string) =>
        String(normalizeSessionId(sessionId)).replace(/^\d{4}\s*/, "");

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

    const billStatus = (bill: Bill): BillStatus =>
        bill.passed ? "passed" : "failed";
    const matchesStatus = (bill: Bill) =>
        !selectedStatus || billStatus(bill) === selectedStatus;

    const tableBills = sessionBills.filter(
        (bill) =>
            matchesPolicy(bill) && matchesSubject(bill) && matchesStatus(bill),
    );

    //each filter's counts apply the session and the OTHER filters but not its own,
    //so every chip shows how many bills clicking it would give
    const billsForPolicyCounts = sessionBills.filter(
        (bill) => matchesSubject(bill) && matchesStatus(bill),
    );
    const billsForSubjectCounts = sessionBills.filter(
        (bill) => matchesPolicy(bill) && matchesStatus(bill),
    );
    const billsForStatusCounts = sessionBills.filter(
        (bill) => matchesPolicy(bill) && matchesSubject(bill),
    );

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

    const statusCounts = countBillsBy(billsForStatusCounts, (bill) => [
        billStatus(bill),
    ]);

    //session chip counts - the selected year with every other filter applied, but not the session itself
    const sessionCounts = countBillsBy(
        yearBills.filter(
            (bill) =>
                matchesPolicy(bill) &&
                matchesSubject(bill) &&
                matchesStatus(bill),
        ),
        (bill) => [bill.sessionId],
    );

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
        <ListPage>
            <PageHeader
                eyebrow="Utah State Legislature"
                title="Bills"
                subtitle="Browse every bill with plain-English summaries, policy topics, and whether it passed."
                stats={stats}
                loading={loading}
            />

            <FilterCard
                title="Bill Filters"
                action={
                    <ClearFiltersButton
                        count={activeFilterCount}
                        onClick={clearAllFilters}
                    />
                }
            >
                <FilterRow label="Year">
                    <ChipSelect
                        options={yearOptions.map((year) => ({
                            value: String(year),
                            label: String(year),
                        }))}
                        selectedValue={
                            selectedYear === null ? null : String(selectedYear)
                        }
                        onSelect={(year) =>
                            selectYear(year === null ? null : Number(year))
                        }
                        allLabel="All Years"
                        searchPlaceholder="Search years..."
                    />
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
                            onClick={() => selectPolicy(selectedTopic, null)}
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
                <FilterRow label="Status">
                    <FilterChip
                        label="All Bills"
                        active={!selectedStatus}
                        onClick={() => setSelectedStatus(null)}
                    />
                    {(["passed", "failed"] as BillStatus[]).map((status) => (
                        <FilterChip
                            key={status}
                            label={
                                status === "passed" ? "Passed" : "Did Not Pass"
                            }
                            count={statusCounts.get(status) ?? 0}
                            active={selectedStatus === status}
                            onClick={() =>
                                setSelectedStatus(
                                    selectedStatus === status ? null : status,
                                )
                            }
                        />
                    ))}
                </FilterRow>
                <FilterRow
                    label="Subject"
                    action={
                        <ToggleSwitch
                            label="Show subjects column"
                            title="Show or hide the Subjects column in the table"
                            checked={showSubjects}
                            onChange={setShowSubjects}
                        />
                    }
                >
                    <SearchableDropdown
                        options={subjectOptions}
                        selectedValue={selectedSubject}
                        onSelect={setSelectedSubject}
                        allLabel="All Subjects"
                        searchPlaceholder={`Search ${subjectOptions.length} subjects...`}
                    />
                </FilterRow>
            </FilterCard>

            <GeneralTable
                keyField="rowKey"
                columns={createBillColumns({
                    showSubjects,
                    onSessionSelect: (sessionId) =>
                        filterFromRow(() => selectSessionFromRow(sessionId)),
                    onStatusSelect: (status) =>
                        filterFromRow(() => setSelectedStatus(status)),
                    onPolicySelect: (topic, direction) =>
                        filterFromRow(() => selectPolicy(topic, direction)),
                    onSubjectSelect: (subject) =>
                        filterFromRow(() => setSelectedSubject(subject)),
                })}
                data={tableBills}
                defaultSortId="sessionId"
                defaultSortAscending={false}
                loading={loading}
                onFilteredDataChange={handleFilteredBills}
            ></GeneralTable>
        </ListPage>
    );
};

export default BillsPage;
