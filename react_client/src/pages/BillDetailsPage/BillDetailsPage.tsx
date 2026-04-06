import { useState, useEffect } from "react";
import { getBillDetails, getBillVotes } from "../../services/billService";
import type { Bill } from "../../models/Bill";
import { type Vote, VoteValue } from "../../models/Vote";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import BillVoteTable from "../../components/VoteTable/BillVoteTable";

import { useParams } from "react-router-dom";

import style from "./BillDetailsPage.module.css";

const BillDetailsPage = () => {
    const [billDetails, setBillDetails] = useState<Bill>();
    const [billVotes, setBillVotes] = useState<Vote[]>([]);
    let { billId } = useParams<string>();
    if (!billId) {
        billId = "";
    }

    useEffect(() => {
        const fetchBillDetails = async () => {
            try {
                const detailsResponse = await getBillDetails(billId);
                console.log(detailsResponse);
                setBillDetails(detailsResponse);

                const year = String(detailsResponse.year);

                const votesResponse = await getBillVotes(billId, year);
                console.log(votesResponse);
                setBillVotes(votesResponse);
            } catch (error) {
                console.log(error);
            }
        };

        fetchBillDetails();
    }, []);

    return (
        <>
            <div className={style.billDetails__pageContainer}>
                <h2 className={style.billDetails__header}>Bill Details</h2>
                {/* Bill Details */}
                <Container
                    fluid
                    className={style.billDetails__detailsContainer}
                >
                    <Row>
                        <div className={style.billDetails__title}>
                            {billDetails?.id} - {billDetails?.shortTitle}
                        </div>
                    </Row>
                    <Row>
                        <Col>
                            <Row className={style.billDetails__rowPadding}>
                                <div
                                    className={style.billDetails__sectionTitle}
                                >
                                    Year
                                </div>
                                <div>{billDetails?.year}</div>
                            </Row>
                            <Row className={style.billDetails__rowPadding}>
                                <div
                                    className={style.billDetails__sectionTitle}
                                >
                                    Session Id
                                </div>
                                <div>{billDetails?.sessionId}</div>
                            </Row>
                        </Col>
                        <Col>
                            <Row className={style.billDetails__rowPadding}>
                                <div
                                    className={style.billDetails__sectionTitle}
                                >
                                    Passed
                                </div>
                                <div>{billDetails?.passed}</div>
                            </Row>
                            <Row className={style.billDetails__rowPadding}>
                                <div
                                    className={style.billDetails__sectionTitle}
                                >
                                    Last Action
                                </div>
                                <div>
                                    {`${billDetails?.lastAction} - ${billDetails?.lastActionDate}`}
                                </div>
                            </Row>
                        </Col>
                        <Col>
                            <Row className={style.billDetails__rowPadding}>
                                <div
                                    className={style.billDetails__sectionTitle}
                                >
                                    Official Links
                                </div>
                                <a
                                    href={billDetails?.houseVoteUrl}
                                    style={{
                                        color: "#2563eb",
                                        textDecoration: "underline",
                                    }}
                                >
                                    House Vote
                                </a>
                                <a
                                    href={billDetails?.senateVoteUrl}
                                    style={{
                                        color: "#2563eb",
                                        textDecoration: "underline",
                                    }}
                                >
                                    Senate Vote
                                </a>
                                <a
                                    href={billDetails?.link}
                                    style={{
                                        color: "#2563eb",
                                        textDecoration: "underline",
                                    }}
                                >
                                    Government Bill
                                </a>
                            </Row>
                        </Col>
                    </Row>
                    <Row className={style.billDetails__rowPadding}>
                        <div className={style.billDetails__sectionTitle}>
                            Subjects
                        </div>
                        <div>{billDetails?.subjects}</div>
                    </Row>

                    <Row className={style.billDetails__rowPadding}>
                        <div className={style.billDetails__sectionTitle}>
                            General Provisions
                        </div>
                        <div>{billDetails?.generalProvisions}</div>
                    </Row>
                    <Row className={style.billDetails__rowPadding}>
                        <div className={style.billDetails__sectionTitle}>
                            Highlighted Provisions
                        </div>
                        <pre className={style.billDetails__preSection}>
                            {billDetails?.highlightedProvisions}
                        </pre>
                    </Row>

                    {/* House Vote Table */}
                    <Row className={`${style.billDetails__rowPadding} g-0`}>
                        <Container fluid className="p-0">
                            <Row>
                                <text
                                    className={style.billDetails__sectionTitle}
                                >
                                    House Vote
                                </text>
                            </Row>
                            {/* YEAS */}
                            <BillVoteTable
                                voteList={billVotes}
                                house="H"
                                voteValue={VoteValue.Yes}
                                title="Yeas"
                            ></BillVoteTable>
                            {/* NAYS */}
                            <BillVoteTable
                                voteList={billVotes}
                                house="H"
                                voteValue={VoteValue.No}
                                title="Nays"
                            ></BillVoteTable>
                            {/* ABSENT */}
                            <BillVoteTable
                                voteList={billVotes}
                                house="H"
                                voteValue={VoteValue.Absent}
                                title="Absent / Abstained"
                            ></BillVoteTable>
                        </Container>
                    </Row>

                    {/* Senate Vote Table */}
                    <Row Row className={style.billDetails__rowPadding}>
                        <Container fluid>
                            <Row>
                                <div
                                    className={style.billDetails__sectionTitle}
                                >
                                    Senate Vote
                                </div>
                            </Row>
                            {/* YEAS */}
                            <BillVoteTable
                                voteList={billVotes}
                                house="S"
                                voteValue={VoteValue.Yes}
                                title="Yeas"
                            ></BillVoteTable>
                            {/* NAYS */}
                            <BillVoteTable
                                voteList={billVotes}
                                house="S"
                                voteValue={VoteValue.No}
                                title="Nays"
                            ></BillVoteTable>
                            {/* ABSENT */}
                            <BillVoteTable
                                voteList={billVotes}
                                house="S"
                                voteValue={VoteValue.Absent}
                                title="Absent / Abstained"
                            ></BillVoteTable>
                        </Container>
                    </Row>
                </Container>
            </div>
        </>
    );
};

export default BillDetailsPage;
