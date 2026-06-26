// import { useState, useEffect } from "react";
// import {
//     getLegislatorDetails,
//     getLegislatorVotes,
//     getLegislatorSponsoredBills,
// } from "../../services/legislatorService";
// import type { Legislator } from "../../models/Legislator";
// import type { LegislatorVote } from "../../models/LegislatorVote";
// import { Container, Col, Row } from "react-bootstrap";
// import { useParams } from "react-router-dom";
// import GeneralTable from "../../components/GeneralTable/GeneralTable";
// import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
// import { FilterType, createDataTableColumn } from "../../models/DataTableUtils";
// import Badge from "../../components/Badge/Badge";
// import PropertyGroup from "../../components/PropertyGroup/PropertyGroup";
// import { type Bill, normalizeSessionId } from "../../models/Bill";
// import ExpandableSection from "../../components/ExpandableSection/ExpandableSection";

// import downIcon from "../../assets/icon_expand_down.svg";
// import rightIcon from "../../assets/icon_expand_right.svg";

// import style from "./LegislatorDetailsPage.module.css";

// //Create all columns for SPONSORED BILLS TABLE

// const LegislatorDetailsPage = () => {
//     const [legislatorDetails, setLegislatorDetails] = useState<Legislator>();

//     let { legislatorId } = useParams<string>();
//     if (!legislatorId) {
//         legislatorId = "";
//     }

//     useEffect(() => {
//         const fetchLegislatorDetails = async () => {
//             try {
//                 const detailsResponse =
//                     await getLegislatorDetails(legislatorId);
//                 setLegislatorDetails(detailsResponse);
//             } catch (error) {
//                 console.log(error);
//             }
//         };

//         fetchLegislatorDetails();
//     }, []);

//     return (
//         <>
//             <div className="page pageScroll">
//                 {/* Legislator Details Container*/}
//                 <div className="verticalStack largeGap defaultPadding">
//                     <div className="section outline">
//                         <div className="filledHeader">
//                             {legislatorDetails?.formatName}
//                         </div>
//                         <Container fluid>
//                             <Row
//                                 className={`${style.legislatorDetails__rowPadding}`}
//                             >
//                                 {/* Profile Pic */}
//                                 <Col
//                                     className={
//                                         style.legislatorDetails__centerImage
//                                     }
//                                 >
//                                     <img
//                                         className={
//                                             style.legislativeDetails__profileImg
//                                         }
//                                         src={legislatorDetails?.image}
//                                         alt={legislatorDetails?.fullName}
//                                     />
//                                 </Col>
//                                 {/* House and Party */}
//                                 <Col>
//                                     <PropertyGroup
//                                         title="Chamber"
//                                         value={legislatorDetails?.house}
//                                     ></PropertyGroup>
//                                     <PropertyGroup
//                                         title="Party"
//                                         value={
//                                             <Badge
//                                                 type="party"
//                                                 value={legislatorDetails?.party}
//                                             ></Badge>
//                                         }
//                                     ></PropertyGroup>
//                                 </Col>
//                                 {/* Counties */}
//                                 <Col>
//                                     <PropertyGroup
//                                         title="District"
//                                         value={legislatorDetails?.district}
//                                     ></PropertyGroup>
//                                     <PropertyGroup
//                                         title="Counties"
//                                         value={legislatorDetails?.counties}
//                                     ></PropertyGroup>
//                                 </Col>
//                                 <Col>
//                                     <PropertyGroup
//                                         title="Email"
//                                         value={legislatorDetails?.email}
//                                     ></PropertyGroup>
//                                     <PropertyGroup
//                                         title="Phone"
//                                         value={legislatorDetails?.phone}
//                                     ></PropertyGroup>
//                                 </Col>
//                                 <Col>
//                                     <PropertyGroup
//                                         title="Service Start"
//                                         value={legislatorDetails?.serviceStart}
//                                     ></PropertyGroup>
//                                     <PropertyGroup
//                                         title="Official Link"
//                                         value={
//                                             <a
//                                                 className="link"
//                                                 href={legislatorDetails?.link}
//                                             >
//                                                 Government Bio
//                                             </a>
//                                         }
//                                     ></PropertyGroup>
//                                 </Col>
//                             </Row>
//                         </Container>
//                     </div>

//                     <ExpandableSection
//                         header="Voting History"
//                         onExpand={loadLegislatorVotes}
//                     >
//                         <div className="defaultPadding height800">
//                             {
//                                 <GeneralTable
//                                     columns={(helpers) =>
//                                         createLegislatorDetailsColumns(helpers)
//                                     }
//                                     data={legislatorVotes}
//                                     defaultSortId="sessionId"
//                                     defaultSortAscending={false}
//                                 />
//                             }
//                         </div>
//                     </ExpandableSection>

//                     <ExpandableSection
//                         header="Sponsored Bills"
//                         onExpand={loadSponsoredBills}
//                     >
//                         <div className="defaultPadding height800">
//                             <GeneralTable
//                                 columns={(helpers) =>
//                                     createSponsoredBillsColumns(helpers)
//                                 }
//                                 data={sponsoredBills}
//                                 defaultSortId="sessionId"
//                                 defaultSortAscending={false}
//                             />
//                         </div>
//                     </ExpandableSection>
//                 </div>
//             </div>
//         </>
//     );
// };

// export default LegislatorDetailsPage;
