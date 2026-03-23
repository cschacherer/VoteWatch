import { useState, useEffect } from "react";
import {
    getLegislatorDetails,
    getLegislatorVotes,
} from "../../services/legislatorService";
import type { Legislator } from "../../models/Legislator";
import type { LegislatorVote } from "../../models/LegislatorVote";

import type { Bill } from "../../models/Bill";
import CollapsibleCell from "../../components/CollapsibleCell/CollapsibleCell";
import FilterPanel from "../../components/FilterPanel/FilterPanel";

import SortableColumn from "../../components/SortableColumn/SortableColumn";
import SortableHeader from "../../components/SortableHeader/SortableHeader";

import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
} from "@tanstack/react-table";

import { type Vote, VoteValue } from "../../models/Vote";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import { useParams } from "react-router-dom";

import style from "./LegislatorDetailsPage.module.css";

const LegislatorDetailsPage = () => {
    const [legislatorDetails, setLegislatorDetails] = useState<Legislator>();
    const [legislatorVotes, setLegislatorVotes] = useState<LegislatorVote[]>(
        [],
    );
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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

    //set all column tables here
    // const columns: ColumnDef<LegislatorVote>[] = [
    //     {
    //         accessorKey: "billId",
    //         header: ({ column }) => (
    //             <SortableHeader column={column} title={"Bill Id"} />
    //         ),
    //         enableSorting: true,
    //         size: 100,
    //         cell: ({ row }) => (
    //             <a
    //                 href={`/bills/${row.original.billId}`}
    //                 target="_self"
    //                 style={{ color: "#2563eb", textDecoration: "underline" }}
    //             >
    //                 {row.original.billId}
    //             </a>
    //         ),
    //     },
    //     SortableColumn<LegislatorVote>({
    //         accessorKey: "shortTitle",
    //         title: "Title",
    //         size: 250,
    //     }),
    //     SortableColumn<LegislatorVote>({
    //         accessorKey: "generalProvisions",
    //         title: "General Provisions",
    //         size: 300,
    //     }),
    //     SortableColumn<LegislatorVote>({
    //         accessorKey: "lastAction",
    //         title: "Last Action",
    //         size: 150,
    //     }),
    //     SortableColumn<LegislatorVote>({
    //         accessorKey: "lastActionDate",
    //         title: "Last Action Date",
    //         size: 150,
    //     }),
    //     SortableColumn<LegislatorVote>({
    //         accessorKey: "year",
    //         title: "Year",
    //         size: 80,
    //     }),
    //     SortableColumn<LegislatorVote>({
    //         accessorKey: "sessionId",
    //         title: "Session Id",
    //         size: 120,
    //     }),

    //     SortableColumn<LegislatorVote>({
    //         accessorKey: "subjects",
    //         title: "Subjects",
    //         size: 250,
    //     }),
    //     {
    //         accessorKey: "houseVoteUrl",
    //         header: "House Vote URL",
    //         size: 100,
    //         cell: ({ row }) => (
    //             <a
    //                 href={row.original.houseVoteUrl}
    //                 target="_self"
    //                 style={{ color: "#2563eb", textDecoration: "underline" }}
    //             >
    //                 {row.original.houseVoteUrl}
    //             </a>
    //         ),
    //     },
    //     {
    //         accessorKey: "senateVoteUrl",
    //         header: "Senate Vote URL",
    //         size: 100,
    //         cell: ({ row }) => (
    //             <a
    //                 href={row.original.senateVoteUrl}
    //                 target="_self"
    //                 style={{ color: "#2563eb", textDecoration: "underline" }}
    //             >
    //                 {row.original.senateVoteUrl}
    //             </a>
    //         ),
    //     },
    //     {
    //         accessorKey: "link",
    //         header: "Utah Gov Link",
    //         size: 100,
    //         cell: ({ row }) => (
    //             <a
    //                 href={row.original.link}
    //                 target="_self"
    //                 style={{ color: "#2563eb", textDecoration: "underline" }}
    //             >
    //                 Official Link
    //             </a>
    //         ),
    //     },
    // ];

    // //use tanstack react-table to use a responsive table (ie changing col widths, sorting, etc)
    // const responsiveTable = useReactTable({
    //     data: bills,
    //     columns,
    //     state: {
    //         sorting,
    //         globalFilter,
    //         columnFilters,
    //     },
    //     onSortingChange: setSorting,
    //     onGlobalFilterChange: setGlobalFilter,
    //     getCoreRowModel: getCoreRowModel(),
    //     getSortedRowModel: getSortedRowModel(),
    //     filterFns: {},
    //     onColumnFiltersChange: setColumnFilters,
    //     getFilteredRowModel: getFilteredRowModel(),
    //     enableColumnResizing: true,
    //     columnResizeMode: "onChange",
    // });

    return (
        <>
            <div className={style.legislatorDetailsPage__pageContainer}>
                {/* Legislator Details */}
                <Container
                    fluid
                    className={style.legislatorDetailsPage__detailsContainer}
                >
                    <Row
                        className={`${style.legislatorDetailsPage__title} ${style.legislatorDetailsPage__rowPadding}`}
                    >
                        <div>{legislatorDetails?.fullName}</div>
                        <img
                            src={legislatorDetails?.image}
                            alt={legislatorDetails?.fullName}
                            style={{ width: 100, borderRadius: "50%" }}
                        />
                    </Row>
                    <Row className={style.legislatorDetailsPage__rowPadding}>
                        <div
                            className={
                                style.legislatorDetailsPage__sectionTitle
                            }
                        >
                            House
                        </div>
                        <div>{legislatorDetails?.house}</div>
                    </Row>
                    <Row className={style.legislatorDetailsPage__rowPadding}>
                        <div
                            className={
                                style.legislatorDetailsPage__sectionTitle
                            }
                        >
                            Party
                        </div>
                        <div>{legislatorDetails?.party}</div>
                    </Row>
                    <Row className={style.legislatorDetailsPage__rowPadding}>
                        <div
                            className={
                                style.legislatorDetailsPage__sectionTitle
                            }
                        >
                            House
                        </div>
                        <div>{legislatorDetails?.house}</div>
                    </Row>
                    <Row className={style.legislatorDetailsPage__rowPadding}>
                        <div
                            className={
                                style.legislatorDetailsPage__sectionTitle
                            }
                        >
                            District
                        </div>
                        <div>{legislatorDetails?.district}</div>
                    </Row>
                    <Row className={style.legislatorDetailsPage__rowPadding}>
                        <div
                            className={
                                style.legislatorDetailsPage__sectionTitle
                            }
                        >
                            Counties
                        </div>
                        <div>{legislatorDetails?.counties}</div>
                    </Row>
                    <Row className={style.legislatorDetailsPage__rowPadding}>
                        <div
                            className={
                                style.legislatorDetailsPage__sectionTitle
                            }
                        >
                            Email
                        </div>
                        <div>{legislatorDetails?.email}</div>
                    </Row>
                    <Row className={style.legislatorDetailsPage__rowPadding}>
                        <div
                            className={
                                style.legislatorDetailsPage__sectionTitle
                            }
                        >
                            Cell
                        </div>
                        <div>{legislatorDetails?.cell}</div>
                    </Row>
                    <Row className={style.legislatorDetailsPage__rowPadding}>
                        <div
                            className={
                                style.legislatorDetailsPage__sectionTitle
                            }
                        >
                            Service Start
                        </div>
                        <div>{legislatorDetails?.serviceStart}</div>
                    </Row>
                    <Row className={style.legislatorDetailsPage__rowPadding}>
                        <div
                            className={
                                style.legislatorDetailsPage__sectionTitle
                            }
                        >
                            Official Link
                        </div>
                        <div>{legislatorDetails?.link}</div>
                    </Row>
                </Container>
            </div>
        </>
    );
};

export default LegislatorDetailsPage;
