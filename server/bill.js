class Bill {
    constructor(billObject) {
        this.id = billObject.billNumber;
        this.shortTitle = billObject.shortTitle;
        this.generalProvisions = billObject.generalProvisions;
        this.highlightedProvisions = billObject.highlightedProvisions;
        this.lastAction = billObject.lastAction;
        this.lastActionDate = billObject.lastActionDate;
        this.billVersionList = billObject.billVersionList;
        this.year = billObject.year;
        this.link = `https://le.utah.gov/~${this.year}/bills/static/${this.id}.html`;
    }

    get subjects() {
        try {
            if (this.billVersionList) {
                const activeVersion = Array.from(this.billVersionList).filter(x => x.activeVersion === true)[0];
                if (activeVersion) {
                    const subjectArray = activeVersion.subjectList?.map(x => x.description);
                    return subjectArray.join(', ');
                }
            }
        } catch (err) {
            console.log(`Error getting subjects from bill. ${err.message}`);
            return undefined;
        }
    }
}

export default Bill;  