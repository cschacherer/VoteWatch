import { useState, useEffect } from "react";
import styles from "./AnalysisPage.module.css";
import {
    getAllLegislators,
    getLegislatorDetails,
    getLegislatorVotes,
    getLegislatorSponsoredBills,
} from "../../services/legislatorService";
import type { Legislator } from "../../models/Legislator";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";
import Badge from "../../components/Badge/Badge";
import PropertyGroup from "../../components/PropertyGroup/PropertyGroup";
import { type PolicyTopic, createPolicyTopics } from "../../models/PolicyTopic";
import {
    type LegislatorPolicyScore,
    createLegislatorPolicyScore,
} from "../../models/LegislatorPolicyScore";
import { getLegislatorAnalysisByYear } from "../../services/analysisService";

//Create all columns for SPONSORED BILLS TABLE
function createLegislatorPolicyScoreColumns({
    filterBadgeClick,
}: {
    filterBadgeClick: (key: string, value: string) => void;
}) {
    const formatPercent = (val: string | number | undefined) => {
        if (val == null || val === "" || Number.isNaN(Number(val)))
            return "N/A";
        const num = Number(val);
        return `${Math.round(num)}%`;
    };
    return [
        createDataTableColumn<LegislatorPolicyScore>({
            id: "policyTopic",
            name: "Policy Topic",
            selector: (row: LegislatorPolicyScore) => row.policyTopic,
            cell: (row) => (
                <Badge
                    type="basic"
                    value={row.policyTopic}
                    onClick={(value) => filterBadgeClick("policyTopic", value)}
                ></Badge>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorPolicyScore>({
            id: "policyDirection",
            name: "Policy Direction",
            selector: (row: LegislatorPolicyScore) => row.policyDirection,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorPolicyScore>({
            id: "score",
            name: "Score",
            selector: (row: LegislatorPolicyScore) =>
                formatPercent(Number(row.score) * 100),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorPolicyScore>({
            id: "totalVotes",
            name: "Total Yes Votes",
            selector: (row: LegislatorPolicyScore) =>
                `${row.yesVotes} out of ${row.includedVotes}`,
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorPolicyScore>({
            id: "absentPercentage",
            name: "Absent for Vote",
            selector: (row: LegislatorPolicyScore) =>
                formatPercent((row.absentPercentage ?? 0) * 100),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorPolicyScore>({
            id: "seeBills",
            name: "See Bills",
            selector: (row: LegislatorPolicyScore) => `${row.absentPercentage}`,
            cell: (row) => (
                <a
                    className="link"
                    href={`/analysis/${row.legislatorId}/${row.year}/${row.policyTopic}/${row.policyDirection}`}
                >
                    See Bills
                </a>
                // <Badge
                //     type="basic"
                //     value={row.policyTopic}
                //     onClick={(value) => filterBadgeClick("policyTopic", value)}
                // ></Badge>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
    ];
}

const AnalysisPage = () => {
    const [legislatorDetails, setLegislatorDetails] = useState<Legislator>();
    const [legislatorPolicyScores, setlegislatorPolicyScores] = useState<
        LegislatorPolicyScore[]
    >([]);

    const [policyTopics, setPolicyTopics] = useState<PolicyTopic[]>([]);

    const [legislators, setLegislators] = useState<Legislator[]>([]);
    const [selectedLegislatorId, setSelectedLegislatorId] =
        useState<string>("");
    const [selectedYear, setSelectedYear] = useState<string>(
        new Date().getFullYear().toString(),
    );

    const availableYears = [2025, 2026];

    useEffect(() => {
        const init = async () => {
            try {
                const all = await getAllLegislators();
                setLegislators(all);
                if (all && all.length > 0) {
                    const initialId = all[0].id || all[0].legislatorId;
                    setSelectedLegislatorId(initialId);

                    // Immediately fetch details and analysis for the initial legislator
                    try {
                        const details = await getLegislatorDetails(initialId);
                        setLegislatorDetails(details);
                    } catch (err) {
                        console.log(err);
                    }

                    try {
                        const policyScores = await getLegislatorAnalysisByYear(
                            initialId,
                            selectedYear,
                        );
                        setlegislatorPolicyScores(policyScores);
                    } catch (err) {
                        console.log(err);
                    }
                }
            } catch (error) {
                console.log(error);
            }

            const x = createPolicyTopics();
            setPolicyTopics(x);
        };

        init();
    }, []);

    // Load details and analysis whenever selection changes
    useEffect(() => {
        if (!selectedLegislatorId || !selectedYear) return;

        const fetchInformation = async () => {
            try {
                const detailsResponse =
                    await getLegislatorDetails(selectedLegislatorId);
                setLegislatorDetails(detailsResponse);
            } catch (error) {
                console.log(error);
            }
        };

        const loadLegislatorPolicyAnalysis = async () => {
            try {
                const policyScores = await getLegislatorAnalysisByYear(
                    selectedLegislatorId,
                    selectedYear,
                );
                setlegislatorPolicyScores(policyScores);
            } catch (error) {
                console.log(error);
            }
        };

        fetchInformation();
        loadLegislatorPolicyAnalysis();
    }, [selectedLegislatorId, selectedYear]);

    return (
        <>
            <div className="page pageScroll">
                {/* Legislator Details Container*/}
                <div className="verticalStack largeGap defaultPadding">
                    <div className="section outline">
                        <div className="filledHeader">Analysis</div>
                        <div className="defaultPadding">
                            <div
                                className="defaultPadding horizontalRow defaultGap"
                                style={{ alignItems: "center" }}
                            >
                                <div>
                                    <label>Legislator</label>
                                    <br />
                                    <select
                                        className={styles.select}
                                        value={selectedLegislatorId}
                                        onChange={(e) =>
                                            setSelectedLegislatorId(
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {legislators &&
                                        legislators.length > 0 ? (
                                            legislators.map((l) => (
                                                <option key={l.id} value={l.id}>
                                                    {l.formatName}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="">(loading)</option>
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label>Year</label>
                                    <br />
                                    <select
                                        className={styles.select}
                                        value={selectedYear}
                                        onChange={(e) =>
                                            setSelectedYear(e.target.value)
                                        }
                                    >
                                        {availableYears.map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {/* {legislatorPolicyScores.map((item) => (
                                <div className="horizontalRow defaultGap">
                                    <div>{item.policyDirection}</div>
                                    <div>{item.score}</div>
                                </div>
                            ))} */}
                            {/* {policyTopics.map((item) => (
                                <>
                                    <div className="bold">{item.topic}</div>
                                    <ul>
                                        {item.policyDirections.map((x) => (
                                            <li>{x}</li>
                                        ))}
                                    </ul>
                                </>
                            ))} */}
                            <div className="defaultPadding height800">
                                {
                                    <GeneralTable
                                        columns={(helpers) =>
                                            createLegislatorPolicyScoreColumns(
                                                helpers,
                                            )
                                        }
                                        data={legislatorPolicyScores}
                                        defaultSortId="policyTopic"
                                        defaultSortAscending={false}
                                    />
                                }
                            </div>
                            <PropertyGroup
                                title="Policy Topic"
                                value="placeholder"
                            ></PropertyGroup>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AnalysisPage;
