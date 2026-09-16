export class PolicyTopic {
    constructor(
        topic,
        policyDirections,
        policyCouples = [],
        policySingles = [],
    ) {
        this.topic = topic;
        this.policyDirections = policyDirections;
        this.policyCouples = policyCouples;
        this.policySingles = policySingles;
    }
}

export class PolicyTopicCouple {
    constructor(
        policyCoupleName,
        nameLabel,
        leftLabel,
        rightLabel,
        leftPolicyDirection,
        rightPolicyDirection,
    ) {
        this.policyCoupleName = policyCoupleName;
        this.nameLabel = nameLabel;
        this.leftLabel = leftLabel;
        this.rightLabel = rightLabel;
        this.leftPolicyDirection = leftPolicyDirection;
        this.rightPolicyDirection = rightPolicyDirection;
    }
}

export class PolicyTopicSingle {
    constructor(
        policySingleName,
        nameLabel,
        leftLabel,
        rightLabel,
        policyDirection,
    ) {
        this.policySingleName = policySingleName;
        this.nameLabel = nameLabel;
        this.leftLabel = leftLabel;
        this.rightLabel = rightLabel;
        this.policyDirection = policyDirection;
    }
}

export function createPolicyTopics() {
    return [
        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "housing_supply",
                    "Housing Supply",
                    "Restrict",
                    "Increase",
                    "restrict_housing_supply",
                    "increase_housing_supply",
                ),
                new PolicyTopicCouple(
                    "tenant_protections",
                    "Tenant Protections",
                    "Reduce",
                    "Increase",
                    "reduce_tenant_protections",
                    "increase_tenant_protections",
                ),
                new PolicyTopicCouple(
                    "housing_subsidies",
                    "Housing Subsidies",
                    "Reduce",
                    "Increase",
                    "reduce_housing_subsidies",
                    "increase_housing_subsidies",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "environmental_protection",
                    "Environmental Protection",
                    "Reduce",
                    "Increase",
                    "reduce_environmental_protection",
                    "increase_environmental_protection",
                ),
                new PolicyTopicCouple(
                    "environmental_regulation",
                    "Environmental Regulation",
                    "Reduce",
                    "Increase",
                    "reduce_environmental_regulation",
                    "increase_environmental_regulation",
                ),
                new PolicyTopicCouple(
                    "conservation_funding",
                    "Conservation Funding",
                    "Reduce",
                    "Increase",
                    "reduce_conservation_funding",
                    "increase_conservation_funding",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "promote_energy_type",
                    "Promote Energy Type",
                    "Fossil",
                    "Clean",
                    "promote_fossil_energy",
                    "promote_clean_energy",
                ),
                new PolicyTopicCouple(
                    "energy_regulation",
                    "Energy Regulation",
                    "Reduce",
                    "Increase",
                    "reduce_energy_regulation",
                    "increase_energy_regulation",
                ),
                new PolicyTopicCouple(
                    "energy_cost",
                    "Energy Cost",
                    "Decrease",
                    "Increase",
                    "energy_cost_decrease",
                    "energy_cost_increase",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "taxes",
                    "Taxes",
                    "Decrease",
                    "Increase",
                    "decrease_taxes",
                    "increase_taxes",
                ),
                new PolicyTopicCouple(
                    "government_spending",
                    "Government Spending",
                    "Decrease",
                    "Increase",
                    "decrease_government_spending",
                    "increase_government_spending",
                ),
            ],
            [
                new PolicyTopicSingle(
                    "reallocate_spending",
                    "Reallocate Spending",
                    "Oppose",
                    "Support",
                    "reallocate_spending",
                ),
                new PolicyTopicSingle(
                    "create_tax_incentives",
                    "Create Tax Incentives",
                    "Oppose",
                    "Support",
                    "create_tax_incentives",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "law_enforcement_authority",
                    "Law Enforcement Authority",
                    "Decrease",
                    "Increase",
                    "decrease_law_enforcement_authority",
                    "increase_law_enforcement_authority",
                ),
                new PolicyTopicCouple(
                    "penalties",
                    "Penalties",
                    "Reduce",
                    "Increase",
                    "reduce_penalties",
                    "increase_penalties",
                ),
            ],
            [
                new PolicyTopicSingle(
                    "increase_rehabilitation",
                    "Increase Rehabilitation",
                    "Oppose",
                    "Support",
                    "increase_rehabilitation",
                ),
                new PolicyTopicSingle(
                    "increase_public_safety_funding",
                    "Increase Public Safety Funding",
                    "Oppose",
                    "Support",
                    "increase_public_safety_funding",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "civil_rights",
                    "Civil Rights",
                    "Restrict",
                    "Expand",
                    "restrict_civil_rights",
                    "expand_civil_rights",
                ),
                new PolicyTopicCouple(
                    "privacy_protections",
                    "Privacy Protections",
                    "Reduce",
                    "Increase",
                    "reduce_privacy_protections",
                    "increase_privacy_protections",
                ),
                new PolicyTopicCouple(
                    "voting_access",
                    "Voting Access",
                    "Restrict",
                    "Expand",
                    "restrict_voting_access",
                    "expand_voting_access",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "redistricting_independence",
                    "Redistricting Independence",
                    "Reduce",
                    "Increase",
                    "reduce_redistricting_independence",
                    "increase_redistricting_independence",
                ),
                new PolicyTopicCouple(
                    "redistricting_transparency",
                    "Redistricting Transparency",
                    "Reduce",
                    "Increase",
                    "reduce_redistricting_transparency",
                    "increase_redistricting_transparency",
                ),
                new PolicyTopicCouple(
                    "voter_representation",
                    "Voter Representation",
                    "Restrict",
                    "Expand",
                    "restrict_voter_representation",
                    "expand_voter_representation",
                ),
                new PolicyTopicCouple(
                    "legislative_control_over_redistricting",
                    "Legislative Control",
                    "Reduce",
                    "Increase",
                    "reduce_legislative_control_over_redistricting",
                    "increase_legislative_control_over_redistricting",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "healthcare_access",
                    "Healthcare Access",
                    "Restrict",
                    "Expand",
                    "restrict_healthcare_access",
                    "expand_healthcare_access",
                ),
                new PolicyTopicCouple(
                    "healthcare_funding",
                    "Healthcare Funding",
                    "Reduce",
                    "Increase",
                    "reduce_healthcare_funding",
                    "increase_healthcare_funding",
                ),
                new PolicyTopicCouple(
                    "public_health_regulation",
                    "Public Health Regulation",
                    "Reduce",
                    "Increase",
                    "reduce_public_health_regulation",
                    "increase_public_health_regulation",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "education_funding",
                    "Education Funding",
                    "Reduce",
                    "Increase",
                    "reduce_education_funding",
                    "increase_education_funding",
                ),
                new PolicyTopicCouple(
                    "school_choice",
                    "School Choice",
                    "Restrict",
                    "Expand",
                    "restrict_school_choice",
                    "expand_school_choice",
                ),
                new PolicyTopicCouple(
                    "education_control",
                    "Education Control",
                    "Local",
                    "State",
                    "increase_local_control",
                    "increase_state_control",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "worker_protections",
                    "Worker Protections",
                    "Reduce",
                    "Increase",
                    "reduce_worker_protections",
                    "increase_worker_protections",
                ),
                new PolicyTopicCouple(
                    "wages",
                    "Wages",
                    "Reduce",
                    "Increase",
                    "reduce_wages",
                    "increase_wages",
                ),
                new PolicyTopicCouple(
                    "labor_market_access",
                    "Labor Market Access",
                    "Restrict",
                    "Expand",
                    "restrict_labor_market_access",
                    "expand_labor_market_access",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "business_regulation",
                    "Business Regulation",
                    "Reduce",
                    "Increase",
                    "reduce_business_regulation",
                    "increase_business_regulation",
                ),
                new PolicyTopicCouple(
                    "business_incentives",
                    "Business Incentives",
                    "Reduce",
                    "Increase",
                    "reduce_business_incentives",
                    "increase_business_incentives",
                ),
                new PolicyTopicCouple(
                    "market_access",
                    "Market Access",
                    "Restrict",
                    "Expand",
                    "restrict_market_access",
                    "expand_market_access",
                ),
            ],
        ),

        new PolicyTopic(
            "infrastructure_transportation",
            [
                "increase_infrastructure_spending",
                "reduce_infrastructure_spending",
                "expand_transportation_access",
                "restrict_transportation_access",
                "increase_maintenance_investment",
            ],
            [
                new PolicyTopicCouple(
                    "infrastructure_spending",
                    "Infrastructure Spending",
                    "Reduce",
                    "Increase",
                    "reduce_infrastructure_spending",
                    "increase_infrastructure_spending",
                ),
                new PolicyTopicCouple(
                    "transportation_access",
                    "Transportation Access",
                    "Restrict",
                    "Expand",
                    "restrict_transportation_access",
                    "expand_transportation_access",
                ),
            ],
            [
                new PolicyTopicSingle(
                    "increase_maintenance_investment",
                    "Increase Maintenance Investment",
                    "Oppose",
                    "Support",
                    "increase_maintenance_investment",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "government_transparency",
                    "Government Transparency",
                    "Reduce",
                    "Increase",
                    "reduce_government_transparency",
                    "increase_government_transparency",
                ),
                new PolicyTopicCouple(
                    "government_accountability",
                    "Government Accountability",
                    "Reduce",
                    "Increase",
                    "reduce_government_accountability",
                    "increase_government_accountability",
                ),
                new PolicyTopicCouple(
                    "government_authority",
                    "Government Authority",
                    "Limit",
                    "Expand",
                    "limit_government_authority",
                    "expand_government_authority",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "great_salt_lake_conservation",
                    "Great Salt Lake Conservation",
                    "Reduce",
                    "Increase",
                    "reduce_great_salt_lake_conservation",
                    "increase_great_salt_lake_conservation",
                ),
                new PolicyTopicCouple(
                    "water_conservation",
                    "Water Conservation",
                    "Reduce",
                    "Increase",
                    "reduce_water_conservation",
                    "increase_water_conservation",
                ),
                new PolicyTopicCouple(
                    "great_salt_lake_funding",
                    "Great Salt Lake Funding",
                    "Reduce",
                    "Increase",
                    "reduce_great_salt_lake_funding",
                    "increase_great_salt_lake_funding",
                ),
                new PolicyTopicCouple(
                    "water_use_regulation",
                    "Water Use Regulation",
                    "Reduce",
                    "Increase",
                    "reduce_water_use_regulation",
                    "increase_water_use_regulation",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "immigrant_access",
                    "Immigrant Access",
                    "Restrict",
                    "Expand",
                    "restrict_immigrant_access",
                    "expand_immigrant_access",
                ),
                new PolicyTopicCouple(
                    "immigration_enforcement",
                    "Immigration Enforcement",
                    "Reduce",
                    "Increase",
                    "reduce_immigration_enforcement",
                    "increase_immigration_enforcement",
                ),
                new PolicyTopicCouple(
                    "refugee_or_migrant_services",
                    "Refugee/Migrant Services",
                    "Reduce",
                    "Expand",
                    "reduce_refugee_or_migrant_services",
                    "expand_refugee_or_migrant_services",
                ),
                new PolicyTopicCouple(
                    "employment_verification_requirements",
                    "Employment Verification",
                    "Reduce",
                    "Increase",
                    "reduce_employment_verification_requirements",
                    "increase_employment_verification_requirements",
                ),
            ],
        ),

        new PolicyTopic(
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
                new PolicyTopicCouple(
                    "ai_regulation",
                    "AI Regulation",
                    "Reduce",
                    "Increase",
                    "reduce_ai_regulation",
                    "increase_ai_regulation",
                ),
                new PolicyTopicCouple(
                    "ai_transparency_requirements",
                    "AI Transparency",
                    "Reduce",
                    "Increase",
                    "reduce_ai_transparency_requirements",
                    "increase_ai_transparency_requirements",
                ),
                new PolicyTopicCouple(
                    "ai_privacy_protections",
                    "AI Privacy Protections",
                    "Reduce",
                    "Increase",
                    "reduce_ai_privacy_protections",
                    "increase_ai_privacy_protections",
                ),
                new PolicyTopicCouple(
                    "ai_development",
                    "AI Development",
                    "Restrict",
                    "Promote",
                    "restrict_ai_development",
                    "promote_ai_development",
                ),
                new PolicyTopicCouple(
                    "government_ai_use",
                    "Government AI Use",
                    "Limit",
                    "Increase",
                    "limit_government_ai_use",
                    "increase_government_ai_use",
                ),
            ],
        ),
    ];
}
