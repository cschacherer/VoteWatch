class Bill {
    constructor(billObject) {
        if (!billObject) return;
        this.id = billObject.billNumber;
        this.shortTitle = billObject.shortTitle;
        this.generalProvisions = billObject.generalProvisions;
        this.highlightedProvisions = billObject.highlightedProvisions;
        this.moneyAppropriated = billObject.moneyAppropriated;
        this.fullText = billObject.fullText;
        this.year = billObject.year;
        this.sessionId = billObject.sessionID;
        this.passed = billObject.passed;
        this.datePassed = billObject.datePassed;
        this.effectiveDate = billObject.effectiveDate;
        this.lastAction = billObject.lastAction;
        this.lastActionDate = billObject.lastActionDate;
        this.billSponsor = billObject.primeSponsor;
        this.floorSponsor = billObject.floorSponsor;
        this.trackingId = billObject.trackingID;

        this.subjects = this.getSubjects(billObject.billVersionList);
        if (billObject.actionHistoryList)
            this.houseVoteUrl = this.getHouseVoteUrl(
                billObject.actionHistoryList,
            );
        else if (billObject.actionhistory)
            this.houseVoteUrl = this.getHouseVoteUrl(billObject.actionhistory);
        else this.houseVoteUrl = "";

        if (billObject.actionHistoryList)
            this.senateVoteUrl = this.getSenateVoteUrl(
                billObject.actionHistoryList,
            );
        else if (billObject.actionhistory)
            this.senateVoteUrl = this.getSenateVoteUrl(
                billObject.actionhistory,
            );
        else this.senateVoteUrl = "";

        //these properties are dependent on other properties above
        this.link = `https://le.utah.gov/~${this.year}/bills/static/${this.id}.html`;
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

    setPassed(passedBillData) {
        this.passed = true;
        this.datePassed = passedBillData.datepassed;
        this.effectiveDate = passedBillData.effectivedate;
    }
}

export default Bill;
