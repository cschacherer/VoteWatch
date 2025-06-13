class Bill {
    constructor(billObject) {
        this.id = billObject.billNumber;
        this.shortTitle = billObject.shortTitle;
        this.generalProvisions = billObject.generalProvisions;
        this.highlightedProvisions = billObject.highlightedProvisions;
        this.lastAction = billObject.lastAction;
        this.lastActionDate = billObject.lastActionDate;
        this.year = billObject.year;
        this.sessionId = billObject.sessionID;

        //these properties are dependent on other properties above 
        this.link = `https://le.utah.gov/~${this.year}/bills/static/${this.id}.html`;
        this.subjects = this.getSubjects(billObject.billVersionList);
        this.houseVoteUrl = this.getHouseVoteUrl(billObject.actionHistoryList);
        this.senateVoteUrl = this.getSenateVoteUrl(billObject.actionHistoryList);
    }

    getSubjects(billVersionList) {
        try {
            if (billVersionList) {
                const activeVersion = Array.from(billVersionList).find(x => x.activeVersion === true);
                if (activeVersion) {
                    const subjectArray = activeVersion.subjectList?.map(x => x.description);
                    return subjectArray.join(', ');
                }
            }
        } catch (err) {
            console.log(`Error getting subjects from bill. ${err.message}`);
        }
        return null;
    }

    getHouseVoteUrl(actionHistoryList) {
        try {
            let actionItem = actionHistoryList.find(x => x.description.toLowerCase().includes('passed 3rd reading') &&
                x.description.toLowerCase().includes('house/'));
            if (!actionItem) {
                //a more loose option
                actionItem = actionHistoryList.find(x => x.description.toLowerCase().includes('passed') && x.description.toLowerCase().includes('3rd reading') &&
                    x.description.toLowerCase().includes('house/'));
            }
            const voteId = actionItem?.voteID;
            if (voteId) {
                const voteUrl = `https://le.utah.gov/DynaBill/svotes.jsp?sessionid=${this.sessionId}&voteid=${voteId}&house=H`;
                return voteUrl;
            }
        } catch (err) {
            console.log(`Error getting house vote url from bill. ${err.message}`);
        }
        //sometimes a bill will not make it to the 3rd reading to be passed, so it should be null
        return '';
    }

    getSenateVoteUrl(actionHistoryList) {
        try {
            let actionItem = actionHistoryList.find(x => x.description.toLowerCase().includes('passed 3rd reading') &&
                x.description.toLowerCase().includes('senate/'));
            if (!actionItem) {
                //a more loose option
                actionItem = actionHistoryList.find(x => x.description.toLowerCase().includes('passed') && x.description.toLowerCase().includes('3rd reading') &&
                    x.description.toLowerCase().includes('senate/'));
            }
            const voteId = actionItem?.voteID;
            if (voteId) {
                const voteUrl = `https://le.utah.gov/DynaBill/svotes.jsp?sessionid=${this.sessionId}&voteid=${voteId}&house=S`;
                return voteUrl;
            }
        } catch (err) {
            console.log(`Error getting senate vote url from bill. ${err.message}`);
        }
        //sometimes a bill will not make it to the 3rd reading to be passed, so it should be null
        return '';
    }

}

export default Bill;  