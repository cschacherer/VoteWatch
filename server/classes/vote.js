const VoteValue = Object.freeze({
    yes: "yes",
    no: "no",
    absent: "absent",
});

class Vote {
    constructor(voteObject) {
        this.year = voteObject.year;
        this.billId = voteObject.billId;
        this.house = voteObject.house;
        this.legislatorId = voteObject.legislatorId;
        this.legislatorName = voteObject.legislatorName;
        this.vote = voteObject.voteValue;
        this.link = `https://le.utah.gov/~${this.year}/bills/static/${this.billId}.html`;
    }
}

export { Vote, VoteValue };
