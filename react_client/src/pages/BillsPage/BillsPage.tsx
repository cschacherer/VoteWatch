import { useState, useEffect } from "react";
import { getAllBills, getBillDetails } from "../../services/billService";

import style from "./BillsPage.module.css";

const BillsPage = () => {
    useEffect(() => {
        const fetchBills = async () => {
            try {
                const response = await getAllBills();
                console.log(response);
            } catch (e) {
                if (e instanceof Error) {
                    console.error(`Error getting all bills: ${e.message}`);
                } else {
                    console.error("Unknown error getting all bills", e);
                }
            }
        };

        fetchBills();
    }, []);

    return (
        <>
            <div>
                <h1>Bills Page Body</h1>
            </div>
        </>
    );
};

export default BillsPage;
