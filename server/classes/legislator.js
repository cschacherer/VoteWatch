import lowerCaseKeys from "../helper.js";

class Legislator {
    constructor(legislatorObject) {
        if (!legislatorObject) return;

        const legislator = lowerCaseKeys(legislatorObject);

        this.id = legislator.id || null;
        this.full_name = legislator.full_name || legislator.fullname || null;
        this.format_name =
            legislator.format_name || legislator.formatname || "";
        this.image = legislator.image || "";
        this.house = legislator.house || "";
        this.party = legislator.party || "";
        this.district = legislator.district || "";
        this.counties = legislator.counties || "";
        this.email = legislator.email || "";
        this.cell = legislator.cell || "";
        this.service_start =
            legislator.service_start || legislator.servicestart || "";
        this.link =
            this.house === "H"
                ? `https://house.utleg.gov/rep/${this.id}`
                : `https://senate.utah.gov/sen/${this.id}`;
    }
}

export default Legislator;
