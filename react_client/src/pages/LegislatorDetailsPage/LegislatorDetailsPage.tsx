import { useState, useEffect } from "react";
import {
    getLegislatorDetails,
    getLegislatorVotes,
    getLegislatorSponsoredBills,
} from "../../services/legislatorService";
import type { Legislator } from "../../models/Legislator";
import type { LegislatorVote } from "../../models/LegislatorVote";
import { Container, Col, Row } from "react-bootstrap";
import { useParams } from "react-router-dom";
import GeneralTable from "../../components/GeneralTable/GeneralTable";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";
import Badge from "../../components/Badge/Badge";
import PropertyGroup from "../../components/PropertyGroup/PropertyGroup";
import { type Bill, normalizeSessionId } from "../../models/Bill";
import ExpandableSection from "../../components/ExpandableSection/ExpandableSection";

import downIcon from "../../assets/icon_expand_down.svg";
import rightIcon from "../../assets/icon_expand_right.svg";

import style from "./LegislatorDetailsPage.module.css";

//Create all columns for VOTE TABLE
function createLegislatorDetailsColumns({
    filterBadgeClick,
}: {
    filterBadgeClick: (key: string, value: string) => void;
}) {
    return [
        createDataTableColumn<LegislatorVote>({
            id: "sessionId",
            name: "Session Id",
            selector: (row: LegislatorVote) =>
                normalizeSessionId(row.bill.sessionId),
            width: "150px",
            cell: (row) => (
                <Badge
                    type="sessionId"
                    value={row.bill.sessionId}
                    onClick={(value) => filterBadgeClick("sessionId", value)}
                ></Badge>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "id",
            name: "Bill Id",
            selector: (row: LegislatorVote) => row.bill.id,
            width: "120px",
            cell: (row: LegislatorVote) => (
                <a
                    className="noTextDecoration"
                    href={`/bills/${row.bill.sessionId}/${row.bill.id}`}
                >
                    <Badge type="billId" value={row.bill.id}></Badge>
                </a>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "shortTitle",
            name: "Title",
            selector: (row: LegislatorVote) => row.bill.shortTitle,
            width: "170px",
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
                    onClick={(value) =>
                        filterBadgeClick("vote", value.toLowerCase())
                    }
                />
            ),
            filterConfig: {
                type: FilterType.Select,
                options: ["Yes", "No", "Absent"],
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "passed",
            name: "Passed",
            selector: (row: LegislatorVote) =>
                row.bill.passed ? "passed" : "false",
            width: "120px",
            cell: (row: LegislatorVote) => (
                <Badge
                    type="passed"
                    value={row.bill.passed}
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
        // createDataTableColumn<LegislatorVote>({
        //     id: "summary",
        //     name: "Summary",
        //     selector: (row: LegislatorVote) => row.bill.summary.oneSentence,
        //     sortable: true,
        //     grow: 2,
        //     minWidth: "300px",
        //     wrap: true,
        //     filterConfig: {
        //         type: FilterType.Text,
        //     },
        // }),
        createDataTableColumn<LegislatorVote>({
            id: "summary",
            name: "Summary",
            selector: (row: LegislatorVote) =>
                row.bill?.summary?.oneSentence ?? "",
            grow: 2,
            minWidth: "250px",
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        // createDataTableColumn<LegislatorVote>({
        //     id: "generalProvisions",
        //     name: "General Provisions",
        //     selector: (row: LegislatorVote) => row.bill.generalProvisions,
        //     grow: 1,
        //     minWidth: "250px",
        //     filterConfig: {
        //         type: FilterType.Text,
        //     },
        // }),
        // createDataTableColumn<LegislatorVote>({
        //     id: "highlightedProvisions",
        //     name: "Highlighted Provisions",
        //     selector: (row: LegislatorVote) => row.bill.highlightedProvisions,
        //     grow: 2,
        //     minWidth: "350px",
        //     cell: (row: LegislatorVote) => (
        //         <CollapsibleCell text={row.bill.highlightedProvisions} />
        //     ),
        //     filterConfig: {
        //         type: FilterType.Text,
        //     },
        // }),
        createDataTableColumn<LegislatorVote>({
            id: "year",
            name: "Year",
            selector: (row: LegislatorVote) => row.bill.year,
            width: "0px",
            filterConfig: {
                type: FilterType.Number,
            },
        }),

        createDataTableColumn<LegislatorVote>({
            id: "subjects",
            name: "Subjects",
            selector: (row: LegislatorVote) => row.bill.subjects,
            minWidth: "250px",
            grow: 1,
            cell: (row: LegislatorVote) => (
                <CollapsibleCell
                    items={row.bill.subjects}
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

//Create all columns for SPONSORED BILLS TABLE

const LegislatorDetailsPage = () => {
    const [legislatorDetails, setLegislatorDetails] = useState<Legislator>();
    const [legislatorVotes, setLegislatorVotes] = useState<LegislatorVote[]>(
        [],
    );
    const [sponsoredBills, setSponsoredBills] = useState<Bill[]>([]);

    const [legislatorVotesLoaded, setLegislatorVotesLoaded] = useState(false);
    const [sponsoredBillsLoaded, setSponsoredBillsLoaded] = useState(false);

    let { legislatorId } = useParams<string>();
    if (!legislatorId) {
        legislatorId = "";
    }

    const loadLegislatorVotes = async () => {
        if (legislatorVotesLoaded) return;

        try {
            const votesResponse = await getLegislatorVotes(legislatorId);
            setLegislatorVotes(votesResponse);

            setLegislatorVotesLoaded(true);
        } catch (error) {
            console.log(error);
        }
    };

    const loadSponsoredBills = async () => {
        if (sponsoredBillsLoaded) return;

        try {
            const sponsoredResponse =
                await getLegislatorSponsoredBills(legislatorId);

            setSponsoredBills(sponsoredResponse);
            setSponsoredBillsLoaded(true);
        } catch (error) {
            console.log(error);
        }
    };

    //this needs to be in here because we have to access the legislator id
    function createSponsoredBillsColumns({
        filterBadgeClick,
    }: {
        filterBadgeClick: (key: string, value: string) => void;
    }) {
        return [
            createDataTableColumn<Bill>({
                id: "sessionId",
                name: "Session Id",
                selector: (row: Bill) => normalizeSessionId(row.sessionId),
                width: "150px",
                cell: (row) => (
                    <Badge
                        type="sessionId"
                        value={row.sessionId}
                        onClick={(value) =>
                            filterBadgeClick("sessionId", value)
                        }
                    ></Badge>
                ),
                filterConfig: {
                    type: FilterType.Text,
                },
            }),
            createDataTableColumn<Bill>({
                id: "sponsored",
                name: "Sponsored",
                selector: (row: Bill) => row.billSponsor || row.floorSponsor,
                width: "130px",
                cell: (row: Bill) =>
                    row.billSponsor == legislatorId ? (
                        <div>Sponsor</div>
                    ) : (
                        <div>Floor Sponsor</div>
                    ),
                filterConfig: {
                    type: FilterType.Text,
                },
            }),
            createDataTableColumn<Bill>({
                id: "id",
                name: "Bill Id",
                selector: (row: Bill) => row.id,
                width: "120px",
                cell: (row: Bill) => (
                    <a
                        className="noTextDecoration"
                        href={`/bills/${row.sessionId}/${row.id}`}
                    >
                        <Badge type="billId" value={row.id}></Badge>
                    </a>
                ),
                filterConfig: {
                    type: FilterType.Text,
                },
            }),
            createDataTableColumn<Bill>({
                id: "shortTitle",
                name: "Title",
                selector: (row: Bill) => row.shortTitle,
                minWidth: "170px",
                filterConfig: {
                    type: FilterType.Text,
                },
            }),

            createDataTableColumn<Bill>({
                id: "passed",
                name: "Passed",
                selector: (row: Bill) => (row.passed ? "Passed" : "Failed"),
                width: "150px",
                cell: (row: Bill) => (
                    <Badge
                        type="passed"
                        value={row.passed}
                        onClick={(value) => filterBadgeClick("passed", value)}
                    />
                ),
                filterConfig: {
                    type: FilterType.Select,
                    options: ["Passed", "Failed"],
                },
            }),
            createDataTableColumn<Bill>({
                id: "summary",
                name: "Summary",
                selector: (row: Bill) => row.summary.oneSentence,
                sortable: true,
                grow: 2,
                minWidth: "300px",
                wrap: true,
                filterConfig: {
                    type: FilterType.Text,
                },
            }),
            // createDataTableColumn<Bill>({
            //     id: "generalProvisions",
            //     name: "General Provisions",
            //     selector: (row: Bill) => row.generalProvisions,
            //     grow: 2,
            //     minWidth: "250px",
            //     filterConfig: {
            //         type: FilterType.Text,
            //     },
            // }),
            // createDataTableColumn<Bill>({
            //     id: "highlightedProvisions",
            //     name: "Highlighted Provisions",
            //     selector: (row: Bill) => row.highlightedProvisions,
            //     grow: 2,
            //     minWidth: "350px",
            //     cell: (row: Bill) => (
            //         <CollapsibleCell text={row.highlightedProvisions} />
            //     ),
            //     filterConfig: {
            //         type: FilterType.Text,
            //     },
            // }),
            createDataTableColumn<Bill>({
                id: "year",
                name: "Year",
                selector: (row: Bill) => row.year,
                width: "0px",
                filterConfig: {
                    type: FilterType.Number,
                },
            }),

            createDataTableColumn<Bill>({
                id: "subjects",
                name: "Subjects",
                selector: (row: Bill) => row.subjects,
                minWidth: "250px",
                cell: (row: Bill) => (
                    <CollapsibleCell
                        items={row.subjects}
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

    useEffect(() => {
        const fetchLegislatorDetails = async () => {
            try {
                const detailsResponse =
                    await getLegislatorDetails(legislatorId);
                setLegislatorDetails(detailsResponse);
            } catch (error) {
                console.log(error);
            }
        };

        fetchLegislatorDetails();
    }, []);

    return (
        <>
            <div className="page pageScroll">
                {/* Legislator Details Container*/}
                <div className="verticalStack largeGap defaultPadding">
                    <div className="section outline">
                        <div className="filledHeader">
                            {legislatorDetails?.formatName}
                        </div>
                        <Container fluid>
                            <Row
                                className={`${style.legislatorDetails__rowPadding}`}
                            >
                                {/* Profile Pic */}
                                <Col
                                    className={
                                        style.legislatorDetails__centerImage
                                    }
                                >
                                    <img
                                        className={
                                            style.legislativeDetails__profileImg
                                        }
                                        src={legislatorDetails?.image}
                                        alt={legislatorDetails?.fullName}
                                    />
                                </Col>
                                {/* House and Party */}
                                <Col>
                                    <PropertyGroup
                                        title="Chamber"
                                        value={legislatorDetails?.house}
                                    ></PropertyGroup>
                                    <PropertyGroup
                                        title="Party"
                                        value={
                                            <Badge
                                                type="party"
                                                value={legislatorDetails?.party}
                                            ></Badge>
                                        }
                                    ></PropertyGroup>
                                </Col>
                                {/* Counties */}
                                <Col>
                                    <PropertyGroup
                                        title="District"
                                        value={legislatorDetails?.district}
                                    ></PropertyGroup>
                                    <PropertyGroup
                                        title="Counties"
                                        value={legislatorDetails?.counties}
                                    ></PropertyGroup>
                                </Col>
                                <Col>
                                    <PropertyGroup
                                        title="Email"
                                        value={legislatorDetails?.email}
                                    ></PropertyGroup>
                                    <PropertyGroup
                                        title="Phone"
                                        value={legislatorDetails?.phone}
                                    ></PropertyGroup>
                                </Col>
                                <Col>
                                    <PropertyGroup
                                        title="Service Start"
                                        value={legislatorDetails?.serviceStart}
                                    ></PropertyGroup>
                                    <PropertyGroup
                                        title="Official Link"
                                        value={
                                            <a
                                                className="link"
                                                href={legislatorDetails?.link}
                                            >
                                                Government Bio
                                            </a>
                                        }
                                    ></PropertyGroup>
                                </Col>
                            </Row>
                        </Container>
                    </div>

                    <ExpandableSection
                        header="Voting History"
                        onExpand={loadLegislatorVotes}
                    >
                        <div className="defaultPadding height800">
                            {
                                <GeneralTable
                                    columns={(helpers) =>
                                        createLegislatorDetailsColumns(helpers)
                                    }
                                    data={legislatorVotes}
                                    defaultSortId="sessionId"
                                    defaultSortAscending={false}
                                />
                            }
                        </div>
                    </ExpandableSection>

                    <ExpandableSection
                        header="Sponsored Bills"
                        onExpand={loadSponsoredBills}
                    >
                        <div className="defaultPadding height800">
                            <GeneralTable
                                columns={(helpers) =>
                                    createSponsoredBillsColumns(helpers)
                                }
                                data={sponsoredBills}
                                defaultSortId="sessionId"
                                defaultSortAscending={false}
                            />
                        </div>
                    </ExpandableSection>
                </div>
            </div>
        </>
    );
};

export default LegislatorDetailsPage;
