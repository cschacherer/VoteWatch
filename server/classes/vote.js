const VoteValue = Object.freeze({
    yes: 'yes',
    no: 'no',
    absent: 'absent',
});


class Vote {
    constructor(voteObject) {
        this.year = voteObject.year;
        this.billId = voteObject.billId;
        this.house = voteObject.house;
        this.legislatorId = voteObject.legislatorId;
        this.legislatorName = voteObject.legislatorName;
        this.vote = voteObject.voteValue;
    }
}

export { Vote, VoteValue }; 