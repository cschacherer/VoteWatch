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
import Badge from "../../components/Badge/Badge";
import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";

import style from "./LegislatorDetailsPage.module.css";

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

    const columns = [
        createDataTableColumn<LegislatorVote>({
            id: "billId",
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
                <Badge type="vote" value={row.vote} />
            ),
            filterConfig: {
                type: FilterType.Select,
                options: ["Yes", "No", "Absent"],
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "passed",
            name: "Passed",
            selector: (row: LegislatorVote) => row.vote,
            width: "150px",
            cell: (row: LegislatorVote) => (
                <Badge type="passed" value={row.vote} />
            ),
            filterConfig: {
                type: FilterType.Select,
                options: ["Passed", "Failed"],
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "billGeneralProvision",
            name: "General Provisions",
            selector: (row: LegislatorVote) => row.bill.generalProvisions,
            grow: 2,
            minWidth: "250px",
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "billHighlightedProvisions",
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
            id: "billLastAction",
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
            id: "billYear",
            name: "Year",
            selector: (row: LegislatorVote) => row.bill.year,
            width: "100px",
            filterConfig: {
                type: FilterType.Number,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "billSessionId",
            name: "Session Id",
            selector: (row: LegislatorVote) => row.bill.sessionId,
            width: "130px",
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "billSubjects",
            name: "Subjects",
            selector: (row: LegislatorVote) => row.bill.subjects,
            minWidth: "250px",
            cell: (row: LegislatorVote) => (
                <CollapsibleCell items={row.bill.subjects} />
            ),
            filterConfig: {
                type: FilterType.Text,
            },
        }),
        createDataTableColumn<LegislatorVote>({
            id: "billLink",
            name: "Utah Gov Link",
            selector: (row) => row.bill.link,
            sortable: false,
            width: "150px",
            cell: (row: LegislatorVote) => (
                <a
                    href={row.bill.link}
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                    Official Link
                </a>
            ),
        }),
    ];

    return (
        <>
            <div className={style.legislatorDetailsPage__pageContainer}>
                <div>
                    <h1>Legislator's Details !</h1>
                </div>
                {/* Legislator Details */}
                <Container
                    fluid
                    className={style.legislatorDetailsPage__detailsContainer}
                >
                    <Row
                        className={`${style.legislatorDetailsPage__rowPadding}`}
                    >
                        {/* Name and Profile Pic */}
                        <Col>
                            <div
                                className={`${style.legislatorDetailsPage__title}`}
                            >
                                {legislatorDetails?.fullName}
                                <img
                                    src={legislatorDetails?.image}
                                    alt={legislatorDetails?.fullName}
                                    style={{ width: 100, borderRadius: "10%" }}
                                />
                            </div>
                        </Col>
                        {/* House and Party */}
                        <Col>
                            <Row
                                className={
                                    style.legislatorDetailsPage__rowPadding
                                }
                            >
                                <div
                                    className={
                                        style.legislatorDetailsPage__sectionTitle
                                    }
                                >
                                    Chamber
                                </div>
                                <div>{legislatorDetails?.house}</div>
                            </Row>

                            <Row
                                className={
                                    style.legislatorDetailsPage__rowPadding
                                }
                            >
                                <div
                                    className={
                                        style.legislatorDetailsPage__sectionTitle
                                    }
                                >
                                    Party
                                </div>
                                <div>
                                    <Badge
                                        type="party"
                                        value={legislatorDetails?.party}
                                    ></Badge>
                                </div>
                            </Row>
                        </Col>
                        {/* Counties */}
                        <Col>
                            <Row
                                className={
                                    style.legislatorDetailsPage__rowPadding
                                }
                            >
                                <div
                                    className={
                                        style.legislatorDetailsPage__sectionTitle
                                    }
                                >
                                    District
                                </div>
                                <div>{legislatorDetails?.district}</div>
                            </Row>
                            <Row
                                className={
                                    style.legislatorDetailsPage__rowPadding
                                }
                            >
                                <div
                                    className={
                                        style.legislatorDetailsPage__sectionTitle
                                    }
                                >
                                    Counties
                                </div>
                                <div>{legislatorDetails?.counties}</div>
                            </Row>
                        </Col>
                        <Col>
                            <Row
                                className={
                                    style.legislatorDetailsPage__rowPadding
                                }
                            >
                                <div
                                    className={
                                        style.legislatorDetailsPage__sectionTitle
                                    }
                                >
                                    Email
                                </div>
                                <div>{legislatorDetails?.email}</div>
                            </Row>
                            <Row
                                className={
                                    style.legislatorDetailsPage__rowPadding
                                }
                            >
                                <div
                                    className={
                                        style.legislatorDetailsPage__sectionTitle
                                    }
                                >
                                    Cell
                                </div>
                                <div>{legislatorDetails?.cell}</div>
                            </Row>
                        </Col>
                        <Col>
                            <Row
                                className={
                                    style.legislatorDetailsPage__rowPadding
                                }
                            >
                                <div
                                    className={
                                        style.legislatorDetailsPage__sectionTitle
                                    }
                                >
                                    Service Start
                                </div>
                                <div>{legislatorDetails?.serviceStart}</div>
                            </Row>
                            <Row
                                className={
                                    style.legislatorDetailsPage__rowPadding
                                }
                            >
                                <div
                                    className={
                                        style.legislatorDetailsPage__sectionTitle
                                    }
                                >
                                    Official Link
                                </div>
                                <div>{legislatorDetails?.link}</div>
                            </Row>
                        </Col>
                    </Row>
                </Container>
                {/* Legislator Voting History Table */}
                <GeneralTable
                    columns={columns}
                    data={legislatorVotes}
                    defaultSortId="billId"
                ></GeneralTable>
            </div>
        </>
    );
};

export default LegislatorDetailsPage;
