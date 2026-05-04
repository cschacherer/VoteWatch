import lowerCaseKeys from "../helper.js";

class BillPolicyTopic {
    constructor(policyObject) {
        if (!policyObject) {
            return;
        }

        const policy = lowerCaseKeys(policy_object);

        this.session_id = policy_object.session_id;
        this.bill_id = policy_object.bill_id;
        this.policy_topic = policy_object.policy_topic;
        this.policy_topic_strength = policy_object.policy_topic_strength;
        this.impact_level = policy_object.impact_level;
        this.confidence = policy_object.confidence;
        this.neutral_summary = policy_object.neutral_summary;
        this.include_in_scorecard = policy_object.include_in_scorecard;
    }
}
