import { type Bill, type BillPolicy, normalizeSessionId } from "../models/Bill";
import { formatPolicyName } from "./stringFormat";

//the text a table cell shows, for GeneralTable's search (a column's searchText) - keep these in sync
//with what the matching component renders so every search result has a visible match

//BillCell - bill number, title, and session badge
export const billCellSearchText = (bill: Bill) => [
    bill.id,
    bill.shortTitle,
    String(normalizeSessionId(bill.sessionId)),
];

//PolicyChip - topic, strength, direction, and impact
export const policyChipSearchText = (policy: BillPolicy) => [
    formatPolicyName(policy.policyTopic),
    formatPolicyName(policy.policyTopicStrength),
    formatPolicyName(policy.policyDirection),
    `${formatPolicyName(policy.impactLevel)} impact`,
];
