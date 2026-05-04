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
import { type PolicyTopic, createPolicyTopics } from "../../models/PolicyTopic";

//Create all columns for SPONSORED BILLS TABLE

const AnalysisPage = () => {
    const [legislatorDetails, setLegislatorDetails] = useState<Legislator>();
    const [legislatorVotes, setLegislatorVotes] = useState<LegislatorVote[]>(
        [],
    );
    const [sponsoredBills, setSponsoredBills] = useState<Bill[]>([]);

    const [policyTopics, setPolicyTopics] = useState<PolicyTopic[]>([]);

    const [legislatorVotesLoaded, setLegislatorVotesLoaded] = useState(false);
    const [sponsoredBillsLoaded, setSponsoredBillsLoaded] = useState(false);

    let legislatorId = "ARTHUJ";
    // let { legislatorId } = useParams<string>();
    // if (!legislatorId) {
    //     legislatorId = "";
    // }

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

    useEffect(() => {
        const fetchInformation = async () => {
            try {
                const detailsResponse =
                    await getLegislatorDetails(legislatorId);
                setLegislatorDetails(detailsResponse);
            } catch (error) {
                console.log(error);
            }

            const x = createPolicyTopics();
            setPolicyTopics(x);
        };

        fetchInformation();
    }, []);

    return (
        <>
            <div className="page pageScroll">
                {/* Legislator Details Container*/}
                <div className="verticalStack largeGap defaultPadding">
                    <div className="section outline">
                        <div className="filledHeader">Analysis</div>
                        <div className="defaultPadding">
                            <div>{legislatorDetails?.formatName}</div>
                            {policyTopics.map((item) => (
                                <>
                                    <div className="bold">{item.topic}</div>
                                    <ul>
                                        {item.policyDirections.map((x) => (
                                            <li>{x}</li>
                                        ))}
                                    </ul>
                                </>
                            ))}
                            <PropertyGroup
                                title="Policy Topic"
                                value="placeholder"
                            ></PropertyGroup>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AnalysisPage;
