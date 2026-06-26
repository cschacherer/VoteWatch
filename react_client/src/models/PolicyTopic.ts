export type PolicyTopic = {
    topic: string;
    policyDirections: string[];
    policyCouples: PolicyCouples[];
};

export type PolicyCouples = {
    policyCoupleName: string;
    includedPolicyDirections: string[];
};

export const createPolicyTopic = (
    topic: string,
    policyDirections: string[],
    policyCouples: PolicyCouples[],
): PolicyTopic => {
    return {
        topic,
        policyDirections,
        policyCouples,
    };
};

export const createPolicyCouple = (
    policyCoupleName: string,
    includedPolicyDirections: string[],
): PolicyCouples => {
    return {
        policyCoupleName,
        includedPolicyDirections,
    };
};

export function createPolicyTopics() {
    return [
        createPolicyTopic(
            "housing_land_use",
            [
                "increase_housing_supply",
                "restrict_housing_supply",
                "increase_tenant_protections",
                "reduce_tenant_protections",
                "increase_housing_subsidies",
                "reduce_housing_subsidies",
            ],
            [
                createPolicyCouple("housing_supply", [
                    "increase_housing_supply",
                    "restrict_housing_supply",
                ]),
                createPolicyCouple("tenant_protections", [
                    "increase_tenant_protections",
                    "reduce_tenant_protections",
                ]),
                createPolicyCouple("housing_subsidies", [
                    "increase_housing_subsidies",
                    "reduce_housing_subsidies",
                ]),
            ],
        ),

        createPolicyTopic(
            "environment_natural_resources",
            [
                "increase_environmental_protection",
                "reduce_environmental_protection",
                "increase_environmental_regulation",
                "reduce_environmental_regulation",
                "increase_conservation_funding",
                "reduce_conservation_funding",
            ],
            [
                createPolicyCouple("environmental_protection", [
                    "increase_environmental_protection",
                    "reduce_environmental_protection",
                ]),
                createPolicyCouple("environmental_regulation", [
                    "increase_environmental_regulation",
                    "reduce_environmental_regulation",
                ]),
                createPolicyCouple("conservation_funding", [
                    "increase_conservation_funding",
                    "reduce_conservation_funding",
                ]),
            ],
        ),
        createPolicyTopic(
            "energy",
            [
                "promote_clean_energy",
                "promote_fossil_energy",
                "increase_energy_regulation",
                "reduce_energy_regulation",
                "energy_cost_increase",
                "energy_cost_decrease",
            ],
            [
                createPolicyCouple("promote_energy_type", [
                    "promote_clean_energy",
                    "promote_fossil_energy",
                ]),
                createPolicyCouple("energy_regulation", [
                    "increase_energy_regulation",
                    "reduce_energy_regulation",
                ]),
                createPolicyCouple("energy_cost", [
                    "energy_cost_increase",
                    "energy_cost_decrease",
                ]),
            ],
        ),

        createPolicyTopic(
            "taxes_government_spending",
            [
                "increase_taxes",
                "decrease_taxes",
                "increase_government_spending",
                "decrease_government_spending",
                "reallocate_spending",
                "create_tax_incentives",
            ],
            [
                createPolicyCouple("taxes", [
                    "increase_taxes",
                    "decrease_taxes",
                ]),
                createPolicyCouple("government_spending", [
                    "increase_government_spending",
                    "decrease_government_spending",
                ]),
            ],
        ),

        createPolicyTopic(
            "criminal_justice_public_safety",
            [
                "increase_law_enforcement_authority",
                "decrease_law_enforcement_authority",
                "increase_penalties",
                "reduce_penalties",
                "increase_rehabilitation",
                "increase_public_safety_funding",
            ],
            [
                createPolicyCouple("law_enforcement_authority", [
                    "increase_law_enforcement_authority",
                    "decrease_law_enforcement_authority",
                ]),
                createPolicyCouple("penalties", [
                    "increase_penalties",
                    "reduce_penalties",
                ]),
            ],
        ),

        createPolicyTopic(
            "civil_rights_liberties",
            [
                "expand_civil_rights",
                "restrict_civil_rights",
                "increase_privacy_protections",
                "reduce_privacy_protections",
                "expand_voting_access",
                "restrict_voting_access",
            ],
            [
                createPolicyCouple("civil_rights", [
                    "expand_civil_rights",
                    "restrict_civil_rights",
                ]),
                createPolicyCouple("privacy_protections", [
                    "increase_privacy_protections",
                    "reduce_privacy_protections",
                ]),
                createPolicyCouple("voting_access", [
                    "expand_voting_access",
                    "restrict_voting_access",
                ]),
            ],
        ),

        createPolicyTopic(
            "redistricting_elections",
            [
                "increase_redistricting_independence",
                "reduce_redistricting_independence",
                "increase_redistricting_transparency",
                "reduce_redistricting_transparency",
                "expand_voter_representation",
                "restrict_voter_representation",
                "increase_legislative_control_over_redistricting",
                "reduce_legislative_control_over_redistricting",
            ],
            [
                createPolicyCouple("redistricting_independence", [
                    "increase_redistricting_independence",
                    "reduce_redistricting_independence",
                ]),
                createPolicyCouple("redistricting_transparency", [
                    "increase_redistricting_transparency",
                    "reduce_redistricting_transparency",
                ]),
                createPolicyCouple("voter_representation", [
                    "expand_voter_representation",
                    "restrict_voter_representation",
                ]),
                createPolicyCouple("legislative_control_over_redistricting", [
                    "increase_legislative_control_over_redistricting",
                    "reduce_legislative_control_over_redistricting",
                ]),
            ],
        ),

        createPolicyTopic(
            "healthcare_public_health",
            [
                "expand_healthcare_access",
                "restrict_healthcare_access",
                "increase_healthcare_funding",
                "reduce_healthcare_funding",
                "increase_public_health_regulation",
                "reduce_public_health_regulation",
            ],
            [
                createPolicyCouple("healthcare_access", [
                    "expand_healthcare_access",
                    "restrict_healthcare_access",
                ]),
                createPolicyCouple("healthcare_funding", [
                    "increase_healthcare_funding",
                    "reduce_healthcare_funding",
                ]),
                createPolicyCouple("public_health_regulation", [
                    "increase_public_health_regulation",
                    "reduce_public_health_regulation",
                ]),
            ],
        ),

        createPolicyTopic(
            "education",
            [
                "increase_education_funding",
                "reduce_education_funding",
                "expand_school_choice",
                "restrict_school_choice",
                "increase_state_control",
                "increase_local_control",
            ],
            [
                createPolicyCouple("education_funding", [
                    "increase_education_funding",
                    "reduce_education_funding",
                ]),
                createPolicyCouple("school_choice", [
                    "expand_school_choice",
                    "restrict_school_choice",
                ]),
                createPolicyCouple("education_control", [
                    "increase_state_control",
                    "increase_local_control",
                ]),
            ],
        ),

        createPolicyTopic(
            "labor_employment",
            [
                "increase_worker_protections",
                "reduce_worker_protections",
                "increase_wages",
                "reduce_wages",
                "expand_labor_market_access",
                "restrict_labor_market_access",
            ],
            [
                createPolicyCouple("worker_protections", [
                    "increase_worker_protections",
                    "reduce_worker_protections",
                ]),
                createPolicyCouple("wages", ["increase_wages", "reduce_wages"]),
                createPolicyCouple("labor_market_access", [
                    "expand_labor_market_access",
                    "restrict_labor_market_access",
                ]),
            ],
        ),

        createPolicyTopic(
            "business_economic_regulation",
            [
                "increase_business_regulation",
                "reduce_business_regulation",
                "increase_business_incentives",
                "reduce_business_incentives",
                "expand_market_access",
                "restrict_market_access",
            ],
            [
                createPolicyCouple("business_regulation", [
                    "increase_business_regulation",
                    "reduce_business_regulation",
                ]),
                createPolicyCouple("business_incentives", [
                    "increase_business_incentives",
                    "reduce_business_incentives",
                ]),
                createPolicyCouple("market_access", [
                    "expand_market_access",
                    "restrict_market_access",
                ]),
            ],
        ),

        createPolicyTopic(
            "infrastructure_transportation",
            [
                "increase_infrastructure_spending",
                "reduce_infrastructure_spending",
                "expand_transportation_access",
                "restrict_transportation_access",
                "increase_maintenance_investment",
            ],
            [
                createPolicyCouple("infrastructure_spending", [
                    "increase_infrastructure_spending",
                    "reduce_infrastructure_spending",
                ]),
                createPolicyCouple("transportation_access", [
                    "expand_transportation_access",
                    "restrict_transportation_access",
                ]),
            ],
        ),

        createPolicyTopic(
            "government_operations_transparency",
            [
                "increase_government_transparency",
                "reduce_government_transparency",
                "increase_government_accountability",
                "reduce_government_accountability",
                "expand_government_authority",
                "limit_government_authority",
            ],
            [
                createPolicyCouple("government_transparency", [
                    "increase_government_transparency",
                    "reduce_government_transparency",
                ]),
                createPolicyCouple("government_accountability", [
                    "increase_government_accountability",
                    "reduce_government_accountability",
                ]),
                createPolicyCouple("government_authority", [
                    "expand_government_authority",
                    "limit_government_authority",
                ]),
            ],
        ),

        createPolicyTopic(
            "great_salt_lake",
            [
                "increase_great_salt_lake_conservation",
                "reduce_great_salt_lake_conservation",
                "increase_water_conservation",
                "reduce_water_conservation",
                "increase_great_salt_lake_funding",
                "reduce_great_salt_lake_funding",
                "increase_water_use_regulation",
                "reduce_water_use_regulation",
            ],
            [
                createPolicyCouple("great_salt_lake_conservation", [
                    "increase_great_salt_lake_conservation",
                    "reduce_great_salt_lake_conservation",
                ]),
                createPolicyCouple("water_conservation", [
                    "increase_water_conservation",
                    "reduce_water_conservation",
                ]),
                createPolicyCouple("great_salt_lake_funding", [
                    "increase_great_salt_lake_funding",
                    "reduce_great_salt_lake_funding",
                ]),
                createPolicyCouple("water_use_regulation", [
                    "increase_water_use_regulation",
                    "reduce_water_use_regulation",
                ]),
            ],
        ),

        createPolicyTopic(
            "immigration",
            [
                "expand_immigrant_access",
                "restrict_immigrant_access",
                "increase_immigration_enforcement",
                "reduce_immigration_enforcement",
                "expand_refugee_or_migrant_services",
                "reduce_refugee_or_migrant_services",
                "increase_employment_verification_requirements",
                "reduce_employment_verification_requirements",
            ],
            [
                createPolicyCouple("immigrant_access", [
                    "expand_immigrant_access",
                    "restrict_immigrant_access",
                ]),
                createPolicyCouple("immigration_enforcement", [
                    "increase_immigration_enforcement",
                    "reduce_immigration_enforcement",
                ]),
                createPolicyCouple("refugee_or_migrant_services", [
                    "expand_refugee_or_migrant_services",
                    "reduce_refugee_or_migrant_services",
                ]),
                createPolicyCouple("employment_verification_requirements", [
                    "increase_employment_verification_requirements",
                    "reduce_employment_verification_requirements",
                ]),
            ],
        ),

        createPolicyTopic(
            "artificial_intelligence",
            [
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
            ],
            [
                createPolicyCouple("ai_regulation", [
                    "increase_ai_regulation",
                    "reduce_ai_regulation",
                ]),
                createPolicyCouple("ai_transparency_requirements", [
                    "increase_ai_transparency_requirements",
                    "reduce_ai_transparency_requirements",
                ]),
                createPolicyCouple("ai_privacy_protections", [
                    "increase_ai_privacy_protections",
                    "reduce_ai_privacy_protections",
                ]),
                createPolicyCouple("ai_development", [
                    "promote_ai_development",
                    "restrict_ai_development",
                ]),
                createPolicyCouple("government_ai_use", [
                    "increase_government_ai_use",
                    "limit_government_ai_use",
                ]),
            ],
        ),
    ];
}
