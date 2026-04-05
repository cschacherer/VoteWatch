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
        {
            name: "Bill Id",
            selector: (row: LegislatorVote) => row.bill.id,
            sortable: true,
            width: "100px",
            cell: (row: LegislatorVote) => (
                <a
                    href={`/bills/${row.bill.id}`}
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                    {row.bill.id}
                </a>
            ),
        },
        {
            name: "Title",
            selector: (row: LegislatorVote) => row.bill.shortTitle,
            sortable: true,
            wrap: true,
            grow: 1,
            minWidth: "170px",
            maxWidth: "250px",
        },
        {
            name: "General Provisions",
            selector: (row: LegislatorVote) => row.bill.generalProvisions,
            sortable: true,
            wrap: true,
            grow: 2,
            minWidth: "250px",
        },
        {
            name: "Highlighted Provisions",
            selector: (row: LegislatorVote) => row.bill.highlightedProvisions,
            sortable: true,
            grow: 2,
            minWidth: "350px",
            wrap: true,
            cell: (row: LegislatorVote) => (
                <CollapsibleCell text={row.bill.highlightedProvisions} />
            ),
        },
        {
            name: "Vote",
            selector: (row: LegislatorVote) => row.vote,
            sortable: true,
            width: "120px",
        },
        {
            name: "Last Action",
            selector: (row: LegislatorVote) => row.bill.lastAction,
            sortable: true,
            width: "150px",
            wrap: true,
            cell: (row: LegislatorVote) => (
                <div className={style.bills__lastActionCell}>
                    <div>{row.bill.lastAction}</div>
                    <div>{row.bill.lastActionDate}</div>
                </div>
            ),
        },
        {
            name: "Year",
            selector: (row: LegislatorVote) => row.bill.year,
            sortable: true,
            width: "100px",
        },
        {
            name: "Session Id",
            selector: (row: LegislatorVote) => row.bill.sessionId,
            sortable: true,
            width: "150px",
        },
        {
            name: "Subjects",
            selector: (row: LegislatorVote) => row.bill.subjects,
            sortable: true,
            grow: 2,
            minWidth: "150px",
            wrap: true,
        },
        {
            name: "Utah Gov Link",
            cell: (row: LegislatorVote) => (
                <a
                    href={row.bill.link}
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                    Official Link
                </a>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            width: "150px",
        },
    ];

    const filters = [
        {
            key: "bill.id",
            label: "Bill Id",
            type: "text",
        },
        {
            key: "bill.shortTitle",
            label: "Title",
            type: "text",
        },
        {
            key: "bill.generalProvisions",
            label: "General Provisions",
            type: "text",
        },
        {
            key: "vote",
            label: "Vote",
            type: "select",
            options: ["Yes", "No", "Absent"], // adjust if needed
        },
        {
            key: "bill.lastAction",
            label: "Last Action",
            type: "text",
        },
        {
            key: "bill.lastActionDate",
            label: "Last Action Date",
            type: "text",
        },
        {
            key: "bill.year",
            label: "Year",
            type: "number",
        },
        {
            key: "bill.sessionId",
            label: "Session Id",
            type: "text",
        },
        {
            key: "bill.subjects",
            label: "Subjects",
            type: "text",
        },
    ];

    return (
        <>
            <div className={style.legislatorDetailsPage__pageContainer}>
                <div>
                    <h1 className={style.legislatorDetailsPage__header}>
                        Legislator's Details !
                    </h1>
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
                                    House
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
                                <div>{legislatorDetails?.party}</div>
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
                    filters={filters}
                ></GeneralTable>
            </div>
        </>
    );
};

export default LegislatorDetailsPage;
