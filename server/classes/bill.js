import lowerCaseKeys from "../helper.js";

class Bill {
    //have to handle 2026, 2025, and 2024 json differences from api
    constructor(bill_object, session_id = "") {
        if (!bill_object) return;

        //this will normalize key spelling differences between the returned json objects
        const bill = lowerCaseKeys(bill_object);

        this.id = bill.id || bill.billnumber || bill.bill || null;
        this.short_title = bill.short_title || bill.shorttitle || null;
        this.general_provisions =
            bill.general_provisions || bill.generalprovisions || null;
        this.highlighted_provisions =
            bill.highlighted_provisions ||
            bill.highlightedprovisions ||
            bill.hilightedprovisions ||
            null;

        this.money_appropriated =
            bill.money_appropriated ||
            bill.moniesappropriated ||
            bill.monies ||
            "";
        this.full_text = bill.full_text || bill.fulltext || null;
        this.year = bill.year || null;
        this.session_id =
            bill.session_id || bill.sessionid || session_id || null; //for 2024, session id was not part of the billObject
        this.passed = bill.passed ?? false;
        this.date_passed = bill.date_passed || bill.datepassed || null;
        this.effective_date = bill.effective_date || bill.effectivedate || null;
        this.last_action = bill.last_action || bill.lastaction || "";
        this.last_action_date =
            bill.last_action_date || bill.lastactiondate || "";
        this.bill_sponsor =
            bill.bill_sponsor || bill.primesponsor || bill.sponsor || null;
        this.floor_sponsor = bill.floor_sponsor || bill.floorsponsor || "";
        this.tracking_id = bill.tracking_id || bill.trackingid || "";

        this.subjects =
            bill.subjects || this.getSubjects(bill.billversionlist) || "";
        const actionHistory =
            bill.actionhistorylist || bill.actionhistory || [];

        this.house_vote_url =
            bill.house_vote_url || this.getHouseVoteUrl(actionHistory) || "";
        this.senate_vote_url =
            bill.senate_vote_url || this.getSenateVoteUrl(actionHistory) || "";

        //these properties are dependent on other properties above
        this.link =
            this.year && this.id
                ? `https://le.utah.gov/~${this.year}/bills/static/${this.id}.html`
                : "";
    }

    getSubjects(billVersionList) {
        try {
            if (billVersionList) {
                const activeVersion = Array.from(billVersionList).find(
                    (x) => x.activeVersion === true,
                );
                if (activeVersion) {
                    const subjectArray = activeVersion.subjectList?.map(
                        (x) => x.description,
                    );
                    return subjectArray.join(", ");
                }
            }
        } catch (err) {
            console.log(`Error getting subjects from bill. ${err.message}`);
        }
        return null;
    }

    getHouseVoteUrl(actionHistoryList) {
        try {
            if (!actionHistoryList) {
                let y = 0;
            }
            let actionItem = actionHistoryList?.find((x) => {
                if (x.description) {
                    return (
                        x.description
                            .toLowerCase()
                            .includes("passed 3rd reading") &&
                        x.description.toLowerCase().includes("house/")
                    );
                } else if (x.action) {
                    return (
                        x.action.toLowerCase().includes("passed 3rd reading") &&
                        x.action.toLowerCase().includes("house/")
                    );
                }
                return false;
            });
            if (!actionItem) {
                //a more loose option
                actionItem = actionHistoryList.find((x) => {
                    if (x.description) {
                        return (
                            x.description.toLowerCase().includes("passed") &&
                            x.description
                                .toLowerCase()
                                .includes("3rd reading") &&
                            x.description.toLowerCase().includes("house/")
                        );
                    } else if (x.action) {
                        return (
                            x.action.toLowerCase().includes("passed") &&
                            x.action.toLowerCase().includes("3rd reading") &&
                            x.action.toLowerCase().includes("house/")
                        );
                    }
                });
            }
            const voteId = actionItem?.voteID;
            if (voteId) {
                const voteUrl = `https://le.utah.gov/DynaBill/svotes.jsp?sessionid=${this.session_id}&voteid=${voteId}&house=H`;
                return voteUrl;
            }
        } catch (err) {
            console.log(
                `Error getting house vote url from bill. ${err.message}`,
            );
        }
        //sometimes a bill will not make it to the 3rd reading to be passed, so it should be null
        return "";
    }

    getSenateVoteUrl(actionHistoryList) {
        try {
            let actionItem = actionHistoryList.find((x) => {
                if (x.description) {
                    return (
                        x.description
                            .toLowerCase()
                            .includes("passed 3rd reading") &&
                        x.description.toLowerCase().includes("senate/")
                    );
                } else if (x.action) {
                    return (
                        x.action.toLowerCase().includes("passed 3rd reading") &&
                        x.action.toLowerCase().includes("senate/")
                    );
                }
                return false;
            });
            if (!actionItem) {
                //a more loose option
                actionItem = actionHistoryList.find((x) => {
                    if (x.description) {
                        return (
                            x.description.toLowerCase().includes("passed") &&
                            x.description
                                .toLowerCase()
                                .includes("3rd reading") &&
                            x.description.toLowerCase().includes("senate/")
                        );
                    } else if (x.action) {
                        return (
                            x.action.toLowerCase().includes("passed") &&
                            x.action.toLowerCase().includes("3rd reading") &&
                            x.action.toLowerCase().includes("senate/")
                        );
                    }
                });
            }
            const voteId = actionItem?.voteID;
            if (voteId) {
                const voteUrl = `https://le.utah.gov/DynaBill/svotes.jsp?sessionid=${this.session_id}&voteid=${voteId}&house=S`;
                return voteUrl;
            }
        } catch (err) {
            console.log(
                `Error getting senate vote url from bill. ${err.message}`,
            );
        }
        //sometimes a bill will not make it to the 3rd reading to be passed, so it should be null
        return "";
    }
}

export default Bill;
