class Legislator {
    constructor(legislatorObject) {
        this.id = legislatorObject.id;
        this.fullName = legislatorObject.fullName;
        this.formatName = legislatorObject.formatName;
        this.image = legislatorObject.image;
        this.house = legislatorObject.house;
        this.party = legislatorObject.party;
        this.district = legislatorObject.district;
        this.counties = legislatorObject.counties;
        this.email = legislatorObject.email;
        this.cell = legislatorObject.cell;
        this.serviceStart = legislatorObject.serviceStart;
        this.link = this.house === 'H' ? `https://house.utleg.gov/rep/${this.id}` : `https://senate.utah.gov/sen/${this.id}`;
    }
}

export default Legislator; 