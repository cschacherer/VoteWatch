export type PolicyTopic = {
    topic: string;
    policyDirections: string[];
};

export const createPolicyTopic = (
    topic: string,
    policyDirections: string[],
): PolicyTopic => {
    return {
        topic,
        policyDirections,
    };
};

export function createPolicyTopics() {
    return [
        createPolicyTopic("housing_land_use", [
            "increase_housing_supply",
            "restrict_housing_supply",
            "increase_tenant_protections",
            "reduce_tenant_protections",
            "increase_housing_subsidies",
            "reduce_housing_subsidies",
        ]),

        createPolicyTopic("environment_natural_resources", [
            "increase_environmental_protection",
            "reduce_environmental_protection",
            "increase_environmental_regulation",
            "reduce_environmental_regulation",
            "increase_conservation_funding",
            "reduce_conservation_funding",
        ]),

        createPolicyTopic("energy", [
            "promote_clean_energy",
            "promote_fossil_energy",
            "increase_energy_regulation",
            "reduce_energy_regulation",
            "energy_cost_increase",
            "energy_cost_decrease",
        ]),

        createPolicyTopic("taxes_government_spending", [
            "increase_taxes",
            "decrease_taxes",
            "increase_government_spending",
            "decrease_government_spending",
            "reallocate_spending",
            "create_tax_incentives",
        ]),

        createPolicyTopic("criminal_justice_public_safety", [
            "increase_law_enforcement_authority",
            "decrease_law_enforcement_authority",
            "increase_penalties",
            "reduce_penalties",
            "increase_rehabilitation",
            "increase_public_safety_funding",
        ]),

        createPolicyTopic("civil_rights_liberties", [
            "expand_civil_rights",
            "restrict_civil_rights",
            "increase_privacy_protections",
            "reduce_privacy_protections",
            "expand_voting_access",
            "restrict_voting_access",
        ]),

        createPolicyTopic("redistricting_elections", [
            "increase_redistricting_independence",
            "reduce_redistricting_independence",
            "increase_redistricting_transparency",
            "reduce_redistricting_transparency",
            "expand_voter_representation",
            "restrict_voter_representation",
            "increase_legislative_control_over_redistricting",
            "reduce_legislative_control_over_redistricting",
        ]),

        createPolicyTopic("healthcare_public_health", [
            "expand_healthcare_access",
            "restrict_healthcare_access",
            "increase_healthcare_funding",
            "reduce_healthcare_funding",
            "increase_public_health_regulation",
            "reduce_public_health_regulation",
        ]),

        createPolicyTopic("education", [
            "increase_education_funding",
            "reduce_education_funding",
            "expand_school_choice",
            "restrict_school_choice",
            "increase_state_control",
            "increase_local_control",
        ]),

        createPolicyTopic("labor_employment", [
            "increase_worker_protections",
            "reduce_worker_protections",
            "increase_wages",
            "reduce_wages",
            "expand_labor_market_access",
            "restrict_labor_market_access",
        ]),

        createPolicyTopic("business_economic_regulation", [
            "increase_business_regulation",
            "reduce_business_regulation",
            "increase_business_incentives",
            "reduce_business_incentives",
            "expand_market_access",
            "restrict_market_access",
        ]),

        createPolicyTopic("infrastructure_transportation", [
            "increase_infrastructure_spending",
            "reduce_infrastructure_spending",
            "expand_transportation_access",
            "restrict_transportation_access",
            "increase_maintenance_investment",
        ]),

        createPolicyTopic("government_operations_transparency", [
            "increase_government_transparency",
            "reduce_government_transparency",
            "increase_government_accountability",
            "reduce_government_accountability",
            "expand_government_authority",
            "limit_government_authority",
        ]),

        createPolicyTopic("great_salt_lake", [
            "increase_great_salt_lake_conservation",
            "reduce_great_salt_lake_conservation",
            "increase_water_conservation",
            "reduce_water_conservation",
            "increase_great_salt_lake_funding",
            "reduce_great_salt_lake_funding",
            "increase_water_use_regulation",
            "reduce_water_use_regulation",
        ]),

        createPolicyTopic("immigration", [
            "expand_immigrant_access",
            "restrict_immigrant_access",
            "increase_immigration_enforcement",
            "reduce_immigration_enforcement",
            "expand_refugee_or_migrant_services",
            "reduce_refugee_or_migrant_services",
            "increase_employment_verification_requirements",
            "reduce_employment_verification_requirements",
        ]),

        createPolicyTopic("artificial_intelligence", [
            "increase_ai_regulation",
            "reduce_ai_regulation",
            "increase_ai_transparency_requirements",
            "reduce_ai_transparency_requirements",
            "increase_ai_privacy_protections",
            "reduce_ai_privacy_protections",
            "promote_ai_development",
            "restrict_ai_development",
            "increase_government_ai_use",
            "limit_government_ai_use",
        ]),
    ];
}
