import { useState, useEffect } from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import type { Vote, VoteValue } from "../../models/Vote";

import style from "./BillVoteTable.module.css";

type BillVoteTableProps = {
    voteList: Vote[];
    voteValue: VoteValue;
    house: string;
    title: string;
};

const BillVoteTable = ({
    voteList,
    voteValue,
    house,
    title,
}: BillVoteTableProps) => {
    const [voteData, setVoteData] = useState<Vote[]>([]);

    useEffect(() => {
        const filteredVotes = voteList.filter((vote: Vote) => {
            return (
                vote.legislatorId != "" && //the legislator id will be empty if the legislator is no longer elected
                vote.vote == voteValue &&
                vote.house == house
            );
        });

        setVoteData(filteredVotes);
    }, [voteList]);

    return (
        <Row className={style.billVoteTable__container}>
            <Col xs={2} className={style.billVoteTable__rowHeader}>
                {title}
            </Col>
            <Col xs={10}>
                <Row className={`${style.billVoteTable__rowContent} g-0`}>
                    {voteData.map((vote) => (
                        <Col
                            key={vote.legislatorId}
                            xs={6}
                            sm={6}
                            md={4}
                            lg={2}
                            className={style.billVoteTable__voteCell}
                        >
                            <a href={`/legislators/${vote.legislatorId}`}>
                                {vote.legislatorName}
                            </a>
                        </Col>
                    ))}
                </Row>
            </Col>
        </Row>
    );
};

export default BillVoteTable;
