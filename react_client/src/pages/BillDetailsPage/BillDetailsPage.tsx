import { useState, useEffect } from "react";
import { getBillDetails, getBillVotes } from "../../services/billService";
import { getLegislatorDetails } from "../../services/legislatorService";
import type { Bill } from "../../models/Bill";
import type { Legislator } from "../../models/Legislator";
import { type Vote, VoteValue } from "../../models/Vote";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import BillVoteTable from "../../components/VoteTable/BillVoteTable";
import { useParams } from "react-router-dom";
import PropertyGroup from "../../components/PropertyGroup/PropertyGroup";
import Badge from "../../components/Badge/Badge";
import { BadgeType } from "../../components/Badge/Badge";
import { formatDate } from "../../models/DataTableUtils";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";

import style from "./BillDetailsPage.module.css";
import ExpandableSection from "../../components/ExpandableSection/ExpandableSection";

const BillDetailsPage = () => {
    const [billDetails, setBillDetails] = useState<Bill>();
    const [billVotes, setBillVotes] = useState<Vote[]>([]);
    const [mainSponsor, setMainSponsor] = useState<Legislator>();
    const [floorSponsor, setFloorSponsor] = useState<Legislator>();

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

                if (detailsResponse?.billSponsor) {
                    const mainSponsor = await getLegislatorDetails(
                        detailsResponse.billSponsor,
                    );
                    console.log(mainSponsor);
                    setMainSponsor(mainSponsor);
                }

                if (detailsResponse?.floorSponsor) {
                    const floorSponsor = await getLegislatorDetails(
                        detailsResponse.floorSponsor,
                    );
                    console.log(floorSponsor);
                    setFloorSponsor(floorSponsor);
                }
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
                    <Container className="defaultPadding" fluid>
                        {/* <Row>
                            <Col>
                                <PropertyGroup
                                    title="Overview"
                                    value={billDetails?.summary?.oneSentence}
                                ></PropertyGroup>
                            </Col>
                        </Row> */}
                        <Row>
                            <Col>
                                <PropertyGroup
                                    title="Session"
                                    value={
                                        <Badge
                                            type="sessionId"
                                            value={billDetails?.sessionId}
                                        ></Badge>
                                    }
                                ></PropertyGroup>
                            </Col>
                            <Col>
                                <PropertyGroup
                                    title={"Main Sponsor"}
                                    value={
                                        <div className="horizontalRow defaultGap">
                                            <img
                                                className="legislatorIcons"
                                                src={mainSponsor?.image}
                                                alt={mainSponsor?.fullName}
                                            />
                                            <a
                                                className="link"
                                                href={`/legislators/${mainSponsor?.id}`}
                                            >
                                                {mainSponsor?.formatName}
                                            </a>
                                        </div>
                                    }
                                ></PropertyGroup>
                            </Col>
                            <Col>
                                <PropertyGroup
                                    title={"Floor Sponsor"}
                                    value={
                                        <div className="horizontalRow defaultGap">
                                            <img
                                                className="legislatorIcons"
                                                src={floorSponsor?.image}
                                                alt={floorSponsor?.fullName}
                                            />
                                            <a
                                                className="link"
                                                href={`/legislators/${floorSponsor?.id}`}
                                            >
                                                {floorSponsor?.formatName}
                                            </a>
                                        </div>
                                    }
                                ></PropertyGroup>
                            </Col>

                            <Col>
                                <PropertyGroup
                                    title="Offical Links"
                                    value={
                                        <div className="verticalStack">
                                            <a
                                                className="link"
                                                href={billDetails?.houseVoteUrl}
                                            >
                                                House Vote
                                            </a>
                                            <a
                                                className="link"
                                                href={
                                                    billDetails?.senateVoteUrl
                                                }
                                            >
                                                Senate Vote
                                            </a>
                                            <a
                                                className="link"
                                                href={billDetails?.link}
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
                                    title="Passed"
                                    value={
                                        <Badge
                                            type="passed"
                                            value={billDetails?.passed}
                                        />
                                    }
                                ></PropertyGroup>
                            </Col>
                            <Col>
                                <PropertyGroup
                                    title="Last Action"
                                    value={`${billDetails?.lastAction} - ${billDetails?.lastActionDate}`}
                                ></PropertyGroup>
                            </Col>
                            <Col>
                                <PropertyGroup
                                    title="Date Passed"
                                    value={formatDate(billDetails?.datePassed)}
                                ></PropertyGroup>
                            </Col>
                            <Col></Col>
                        </Row>
                        {/* <Row>
                            <Col>
                                <div className="defaultPadding">
                                    <div className="pageTitle">Summary</div>
                                    <div className="verticalStack defaultGap section outlineThin defaultPadding">
                                        <PropertyGroup
                                            title="Overview"
                                            value={
                                                billDetails?.summary
                                                    ?.oneSentence
                                            }
                                        ></PropertyGroup>
                                        <PropertyGroup
                                            title="Summary"
                                            value={
                                                billDetails?.summary?.overview
                                            }
                                        ></PropertyGroup>
                                        <PropertyGroup
                                            title="Key Changes"
                                            value={
                                                <ul className="customList">
                                                    {billDetails?.summary?.keyChanges.map(
                                                        (item) => (
                                                            <li>{item}</li>
                                                        ),
                                                    )}
                                                </ul>
                                            }
                                        ></PropertyGroup>
                                        <PropertyGroup
                                            title="Groups Affected"
                                            value={
                                                <ul className="customList">
                                                    {billDetails?.summary?.groupsAffected.map(
                                                        (item) => (
                                                            <li>{item}</li>
                                                        ),
                                                    )}
                                                </ul>
                                            }
                                        ></PropertyGroup>
                                        <PropertyGroup
                                            title="Money or Funding Impact"
                                            value={billDetails?.summary?.money}
                                        ></PropertyGroup>
                                    </div>
                                </div>
                            </Col>
                        </Row> */}
                    </Container>
                </div>
                <ExpandableSection
                    header="Summary (AI Generated)"
                    children={
                        <div className="verticalStack defaultGap defaultPadding">
                            <PropertyGroup
                                title="Overview"
                                value={billDetails?.summary?.oneSentence}
                            ></PropertyGroup>
                            <PropertyGroup
                                title="Summary"
                                value={billDetails?.summary?.overview}
                            ></PropertyGroup>
                            <PropertyGroup
                                title="Key Changes"
                                value={
                                    <ul className="customList">
                                        {billDetails?.summary?.keyChanges.map(
                                            (item) => (
                                                <li>{item}</li>
                                            ),
                                        )}
                                    </ul>
                                }
                            ></PropertyGroup>
                            <PropertyGroup
                                title="Groups Affected"
                                value={
                                    <ul className="customList">
                                        {billDetails?.summary?.groupsAffected.map(
                                            (item) => (
                                                <li>{item}</li>
                                            ),
                                        )}
                                    </ul>
                                }
                            ></PropertyGroup>
                            <PropertyGroup
                                title="Money or Funding Impact"
                                value={billDetails?.summary?.money}
                            ></PropertyGroup>
                        </div>
                    }
                ></ExpandableSection>
                <ExpandableSection
                    header="Bill Policies (AI Generated)"
                    children={
                        <div className="verticalStack defaultGap defaultPadding">
                            {billDetails?.billPolicies?.map((item) => (
                                <div className="defaultPadding outlineThin">
                                    <PropertyGroup
                                        title="Policy Topic"
                                        value={item.policyTopic}
                                    ></PropertyGroup>
                                    <PropertyGroup
                                        title="Policy Topic Strength"
                                        value={item.policyTopicStrength}
                                    ></PropertyGroup>
                                    <PropertyGroup
                                        title="Policy Direction"
                                        value={item.policyDirection}
                                    ></PropertyGroup>
                                    <PropertyGroup
                                        title="Impact Level"
                                        value={item.impactLevel}
                                    ></PropertyGroup>
                                    <PropertyGroup
                                        title="AI Confidence"
                                        value={item.confidence}
                                    ></PropertyGroup>
                                </div>
                            ))}
                        </div>
                    }
                ></ExpandableSection>
                <ExpandableSection
                    header="Official Documentation"
                    children={
                        <div className="verticalStack defaultGap defaultPadding">
                            <PropertyGroup
                                title="Official Text"
                                value={
                                    <a
                                        className="link"
                                        href={billDetails?.pdfLink}
                                    >
                                        {`${billDetails?.id} (PDF)`}
                                    </a>
                                }
                            ></PropertyGroup>
                            <PropertyGroup
                                title="General Provisions"
                                value={billDetails?.generalProvisions}
                            ></PropertyGroup>
                            <PropertyGroup
                                title="Highlighted Provisions"
                                value={
                                    <div className="preWrap">
                                        {billDetails?.highlightedProvisions}
                                    </div>
                                }
                            ></PropertyGroup>
                            <PropertyGroup
                                title="Subjects"
                                value={
                                    <div className="verticalStack defaultGap">
                                        <div className="subjectBadgeList">
                                            {billDetails?.subjects.map(
                                                (item) => (
                                                    <Badge
                                                        type={BadgeType.Basic}
                                                        value={item}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                }
                            ></PropertyGroup>
                        </div>
                    }
                ></ExpandableSection>
                <ExpandableSection
                    header="Votes"
                    children={
                        <div className="verticalStack defaultGap defaultPadding">
                            <PropertyGroup
                                title="House Vote"
                                value={
                                    <div className="section verticalStack">
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
                                    <div className="section verticalStack">
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
                        </div>
                    }
                ></ExpandableSection>
            </div>
        </>
    );
};

export default BillDetailsPage;
