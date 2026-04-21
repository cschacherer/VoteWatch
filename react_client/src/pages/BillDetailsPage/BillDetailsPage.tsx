import { useState, useEffect } from "react";
import { getBillDetails, getBillVotes } from "../../services/billService";
import type { Bill } from "../../models/Bill";
import { type Vote, VoteValue } from "../../models/Vote";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import BillVoteTable from "../../components/VoteTable/BillVoteTable";
import { useParams } from "react-router-dom";
import PropertyGroup from "../../components/PropertyGroup/PropertyGroup";

import style from "./BillDetailsPage.module.css";

const BillDetailsPage = () => {
    const [billDetails, setBillDetails] = useState<Bill>();
    const [billVotes, setBillVotes] = useState<Vote[]>([]);
    let { sessionId, billId } = useParams<string>();
    if (!sessionId || !billId) {
        sessionId = "";
        billId = "";
    }

    useEffect(() => {
        const fetchBillDetails = async () => {
            try {
                const detailsResponse = await getBillDetails(sessionId, billId);
                console.log(detailsResponse);
                setBillDetails(detailsResponse);

                const votesResponse = await getBillVotes(sessionId, billId);
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
            <div className="page pageScroll">
                <div className="pageTitle">Bill Details</div>
                <div className="section outline">
                    <div className="filledHeader">
                        {billDetails?.id} - {billDetails?.shortTitle}
                    </div>
                    {/* Bill Details */}
                    <Container fluid>
                        <Row>
                            <Col>
                                <PropertyGroup
                                    title="Year"
                                    value={billDetails?.year}
                                ></PropertyGroup>
                                <PropertyGroup
                                    title="Session Id"
                                    value={billDetails?.sessionId}
                                ></PropertyGroup>
                            </Col>
                            <Col>
                                <PropertyGroup
                                    title="Passed"
                                    value={billDetails?.passed}
                                ></PropertyGroup>
                                <PropertyGroup
                                    title="Last Action"
                                    value={`${billDetails?.lastAction} - ${billDetails?.lastActionDate}`}
                                ></PropertyGroup>
                            </Col>
                            <Col>
                                <PropertyGroup
                                    title="Offical Links"
                                    value={
                                        <div className="verticalStack">
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
                                                href={
                                                    billDetails?.senateVoteUrl
                                                }
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
                                        </div>
                                    }
                                ></PropertyGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <PropertyGroup
                                    title="Subjects"
                                    value={billDetails?.subjects}
                                ></PropertyGroup>
                                <PropertyGroup
                                    title="General Provisions"
                                    value={billDetails?.generalProvisions}
                                ></PropertyGroup>
                                <PropertyGroup
                                    title="Highlighted Provisions"
                                    value={billDetails?.highlightedProvisions}
                                ></PropertyGroup>
                                <PropertyGroup
                                    title="House Vote"
                                    value={
                                        <div className="verticalStack">
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
                                        </div>
                                    }
                                ></PropertyGroup>
                                <PropertyGroup
                                    title="Senate Vote"
                                    value={
                                        <div className="verticalStack">
                                            {" "}
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
                                        </div>
                                    }
                                ></PropertyGroup>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </div>
        </>
    );
};

export default BillDetailsPage;
