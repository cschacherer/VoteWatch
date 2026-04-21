import { useState, useEffect } from "react";
import {
    getLegislatorDetails,
    getLegislatorVotes,
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

import style from "./LegislatorDetailsPage.module.css";

//set all column tables here
// 🔥 Column factory
function createLegislatorDetailsColumns({
    filterBadgeClick,
}: {
    filterBadgeClick: (key: string, value: string) => void;
}) {
    return [
        createDataTableColumn<LegislatorVote>({
            id: "id",
            name: "Bill Id",
            selector: (row: LegislatorVote) => row.bill.id,
            width: "120px",
            cell: (row: LegislatorVote) => (
                <a
                    href={`/bills/${row.bill.id}`}
                    style={{ color: "#2563eb", textDecoration: "none" }}
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
            minWidth: "170px",
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
            id: "vote",
            name: "Passed",
            selector: (row: LegislatorVote) => row.vote,
            width: "150px",
            cell: (row: LegislatorVote) => (
                <Badge
                    type="passed"
                    value={row.vote}
                    onClick={(value) =>
                        filterBadgeClick("passed", value.toLowerCase())
                    }
                />
            ),
            filterConfig: {
                type: FilterType.Select,
                options: ["Passed", "Failed"],
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "generalProvisions",
            name: "General Provisions",
            selector: (row: LegislatorVote) => row.bill.generalProvisions,
            grow: 2,
            minWidth: "250px",
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "highlightedProvisions",
            name: "Highlighted Provisions",
            selector: (row: LegislatorVote) => row.bill.highlightedProvisions,
            grow: 2,
            minWidth: "350px",
            cell: (row: LegislatorVote) => (
                <CollapsibleCell text={row.bill.highlightedProvisions} />
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "lastAction",
            name: "Last Action",
            selector: (row: LegislatorVote) =>
                `${row.bill.lastAction} ${row.bill.lastActionDate}`,
            width: "150px",
            cell: (row: LegislatorVote) => (
                <div className={style.bills__lastActionCell}>
                    <div>{row.bill.lastAction}</div>
                    <div>{row.bill.lastActionDate}</div>
                </div>
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "year",
            name: "Year",
            selector: (row: LegislatorVote) => row.bill.year,
            width: "100px",
            filterConfig: {
                type: FilterType.Number,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "sessionId",
            name: "Session Id",
            selector: (row: LegislatorVote) => row.bill.sessionId,
            width: "130px",
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "subjects",
            name: "Subjects",
            selector: (row: LegislatorVote) => row.bill.subjects,
            minWidth: "250px",
            cell: (row: LegislatorVote) => (
                <CollapsibleCell
                    items={row.bill.subjects}
                    onBadgeClick={(value) =>
                        filterBadgeClick("subjects", value.toLowerCase())
                    }
                />
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "link",
            name: "Official Links",
            selector: (row) => row.bill.link,
            sortable: false,
            width: "150px",
            cell: (row: LegislatorVote) => (
                <a
                    href={row.bill.link}
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                    Government Bill
                </a>
            ),
        }),
    ];
}

const LegislatorDetailsPage = () => {
    const [legislatorDetails, setLegislatorDetails] = useState<Legislator>();
    const [legislatorVotes, setLegislatorVotes] = useState<LegislatorVote[]>(
        [],
    );

    let { legislatorId } = useParams<string>();
    if (!legislatorId) {
        legislatorId = "";
    }

    useEffect(() => {
        const fetchLegislatorDetails = async () => {
            try {
                const detailsResponse =
                    await getLegislatorDetails(legislatorId);
                console.log(detailsResponse);
                setLegislatorDetails(detailsResponse);

                const votesResponse = await getLegislatorVotes(legislatorId);
                console.log(votesResponse);
                setLegislatorVotes(votesResponse);
            } catch (error) {
                console.log(error);
            }
        };

        fetchLegislatorDetails();
    }, []);

    return (
        <>
            <div className="page pageScroll">
                <div className="pageTitle">Legislator Details</div>

                {/* Legislator Details Container*/}
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
                                className={style.legislatorDetails__centerImage}
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
                                            href={legislatorDetails?.link}
                                            style={{
                                                color: "#2563eb",
                                                textDecoration: "underline",
                                            }}
                                        >
                                            Government Bio
                                        </a>
                                    }
                                ></PropertyGroup>
                            </Col>
                        </Row>
                    </Container>
                </div>

                <div className="section">
                    {/* Legislator Voting History Table */}
                    <div
                        className={style.legislativeDetails__votingHistoryTitle}
                    >
                        Voting History
                    </div>
                    <GeneralTable
                        columns={(helpers) =>
                            createLegislatorDetailsColumns(helpers)
                        }
                        data={legislatorVotes}
                        defaultSortId="billId"
                    ></GeneralTable>
                </div>
            </div>
        </>
    );
};

export default LegislatorDetailsPage;
