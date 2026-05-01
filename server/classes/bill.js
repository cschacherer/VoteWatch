function lowerCaseKeys(obj) {
    return Object.fromEntries(
        Object.entries(obj || {}).map(([key, value]) => [
            key.toLowerCase(),
            value,
        ]),
    );
}

class Bill {
    //have to handle 2026, 2025, and 2024 json differences from api
    constructor(billObject, sessionId = "") {
        if (!billObject) return;

        //this will normalize key spelling differences between the returned json objects
        const bill = lowerCaseKeys(billObject);

        this.id = bill.billnumber || bill.bill || null;
        this.shortTitle = bill.shorttitle || null;
        this.generalProvisions = bill.generalprovisions || null;
        this.highlightedProvisions =
            bill.highlightedprovisions || bill.hilightedprovisions || null;

        this.moneyAppropriated = bill.moniesappropriated || bill.monies || "";
        this.fullText = bill.fulltext || null;
        this.year = bill.year || null;
        this.sessionId = bill.sessionid || sessionId || null; //for 2024, session id was not part of the billObject
        this.passed = bill.passed ?? false;
        this.datePassed = bill.datepassed || null;
        this.effectiveDate = bill.effectivedate || null;
        this.lastAction = bill.lastaction || "";
        this.lastActionDate = bill.lastactiondate || "";
        this.billSponsor = bill.primesponsor || bill.sponsor || null;
        this.floorSponsor = bill.floorsponsor || "";
        this.trackingId = bill.trackingid || "";

        this.subjects =
            bill.subjects || this.getSubjects(bill.billversionlist) || "";
        const actionHistory =
            bill.actionhistorylist || bill.actionhistory || [];

        this.houseVoteUrl = this.getHouseVoteUrl(actionHistory) || "";
        this.senateVoteUrl = this.getSenateVoteUrl(actionHistory) || "";

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
                const voteUrl = `https://le.utah.gov/DynaBill/svotes.jsp?sessionid=${this.sessionId}&voteid=${voteId}&house=H`;
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
                const voteUrl = `https://le.utah.gov/DynaBill/svotes.jsp?sessionid=${this.sessionId}&voteid=${voteId}&house=S`;
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
