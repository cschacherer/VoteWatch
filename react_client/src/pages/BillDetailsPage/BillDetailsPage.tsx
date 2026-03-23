import { useState, useEffect } from "react";
import { getBillDetails, getBillVotes } from "../../services/billService";
import type { Bill } from "../../models/Bill";
import { type Vote, VoteValue } from "../../models/Vote";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import VoteTable from "../../components/VoteTable/VoteTable";

import { useLocation, useNavigate, useParams } from "react-router-dom";

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
            <div className={style.billDetailsPage__pageContainer}>
                {/* Bill Details */}
                <Container
                    fluid
                    className={style.billDetailsPage__detailsContainer}
                >
                    <Row
                        className={`${style.billDetailsPage__title} ${style.billDetailsPage__rowPadding}`}
                    >
                        <div>
                            {billDetails?.id} - {billDetails?.shortTitle}
                        </div>
                    </Row>
                    <Row className={style.billDetailsPage__rowPadding}>
                        <div className={style.billDetailsPage__sectionTitle}>
                            Session Id
                        </div>
                        <div>{billDetails?.sessionId}</div>
                    </Row>
                    <Row className={style.billDetailsPage__rowPadding}>
                        <div className={style.billDetailsPage__sectionTitle}>
                            General Provisions
                        </div>
                        <div>{billDetails?.generalProvisions}</div>
                    </Row>
                    <Row className={style.billDetailsPage__rowPadding}>
                        <div className={style.billDetailsPage__sectionTitle}>
                            Highlighted Provisions
                        </div>
                        <pre className={style.billDetailsPage__preSection}>
                            {billDetails?.highlightedProvisions}
                        </pre>
                    </Row>
                    <Row className={style.billDetailsPage__rowPadding}>
                        <div className={style.billDetailsPage__sectionTitle}>
                            Last Action
                        </div>
                        <div>
                            {`${billDetails?.lastAction} - ${billDetails?.lastActionDate}`}
                        </div>
                    </Row>
                    <Row className={style.billDetailsPage__rowPadding}>
                        <div className={style.billDetailsPage__sectionTitle}>
                            Subjects
                        </div>
                        <div>{billDetails?.subjects}</div>
                    </Row>

                    {/* House Vote Table */}
                    <Row className={`${style.billDetailsPage__rowPadding} g-0`}>
                        <Container fluid className="p-0">
                            <Row>
                                <text
                                    className={
                                        style.billDetailsPage__sectionTitle
                                    }
                                >
                                    House Vote
                                </text>
                            </Row>
                            {/* YEAS */}
                            <VoteTable
                                voteList={billVotes}
                                house="H"
                                voteValue={VoteValue.Yes}
                                title="Yeas"
                            ></VoteTable>
                            {/* NAYS */}
                            <VoteTable
                                voteList={billVotes}
                                house="H"
                                voteValue={VoteValue.No}
                                title="Nays"
                            ></VoteTable>
                            {/* ABSENT */}
                            <VoteTable
                                voteList={billVotes}
                                house="H"
                                voteValue={VoteValue.Absent}
                                title="Absent / Abstained"
                            ></VoteTable>
                        </Container>
                    </Row>

                    {/* Senate Vote Table */}
                    <Row Row className={style.billDetailsPage__rowPadding}>
                        <Container fluid>
                            <Row>
                                <div
                                    className={
                                        style.billDetailsPage__sectionTitle
                                    }
                                >
                                    Senate Vote
                                </div>
                            </Row>
                            {/* YEAS */}
                            <VoteTable
                                voteList={billVotes}
                                house="S"
                                voteValue={VoteValue.Yes}
                                title="Yeas"
                            ></VoteTable>
                            {/* NAYS */}
                            <VoteTable
                                voteList={billVotes}
                                house="S"
                                voteValue={VoteValue.No}
                                title="Nays"
                            ></VoteTable>
                            {/* ABSENT */}
                            <VoteTable
                                voteList={billVotes}
                                house="S"
                                voteValue={VoteValue.Absent}
                                title="Absent / Abstained"
                            ></VoteTable>
                        </Container>
                    </Row>
                </Container>
            </div>
        </>
    );
};

export default BillDetailsPage;
