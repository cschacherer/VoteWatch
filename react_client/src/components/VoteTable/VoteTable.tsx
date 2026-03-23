import { useState, useEffect } from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import type { Vote, VoteValue } from "../../models/Vote";

import style from "./VoteTable.module.css";

type VoteTableProps = {
    voteList: Vote[];
    voteValue: VoteValue;
    house: string;
    title: string;
};

const VoteTable = ({ voteList, voteValue, house, title }: VoteTableProps) => {
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
        <Row className={style.voteTable__rowContainer}>
            <Col xs={2} className={style.voteTable__rowHeader}>
                {title}
            </Col>
            <Col xs={10} className="p-0">
                <Row className={`${style.voteTable__rowContent} g-0`}>
                    {voteData.map((vote) => (
                        <Col
                            key={vote.legislatorId}
                            xs={6}
                            sm={6}
                            md={4}
                            lg={2}
                            className={style.voteTable__voteCell}
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

export default VoteTable;
