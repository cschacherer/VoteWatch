import lowerCaseKeys from "../helper.js";

const VoteValue = Object.freeze({
    yes: "yes",
    no: "no",
    absent: "absent",
});

class Vote {
    constructor(voteObject) {
        if (!voteObject) return;

        //this will normalize key spelling differences between the returned json objects
        const vote_object = lowerCaseKeys(voteObject);

        this.session_id = vote_object.session_id || voteObject.sessionid;
        this.bill_id = vote_object.bill_id || voteObject.billid || null;
        this.legislator_id =
            vote_object.legislator_id || vote_object.legislatorid || null;
        this.vote = vote_object.vote_value || vote_object.votevalue || null;
        this.link = `https://le.utah.gov/~${this.year}/bills/static/${this.bill_id}.html`;
    }
}

export { Vote, VoteValue };
