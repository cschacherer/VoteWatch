import type { BillPolicy } from "../../models/Bill";
import { formatPolicyName } from "../../utils/stringFormat";

import style from "./PolicyChip.module.css";

type PolicyChipProps = {
    policy: BillPolicy;
};

const PolicyChip = ({ policy }: PolicyChipProps) => {
    let formattedStrength = formatPolicyName(policy.policyTopicStrength);
    let formattedTopic = formatPolicyName(policy.policyTopic);
    let formattedDirection = formatPolicyName(policy.policyDirection);
    let formattedImpact = formatPolicyName(policy.impactLevel) + " Impact";

    return (
        <div className="smallPaddingVertical">
            <div>
                <strong>
                    {formattedStrength} - {formattedTopic}
                </strong>{" "}
            </div>
            <div>
                {formattedDirection} - {formattedImpact}
            </div>
        </div>
    );
};

export default PolicyChip;
