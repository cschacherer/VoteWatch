//party median helpers for policy score charts - kept out of the component files so those only export
//components, which Vite's Fast Refresh needs to hot reload them

export type SpectrumScore = {
    score: number;
    party: string;
    //how many votes this legislator's score is based on
    includedVotes: number;
};

//parties with fewer scored members than this don't get a median marker - too few to be meaningful
export const MIN_PARTY_MEMBERS = 3;

const partyOrder = ["Republican", "Democrat"];

export function median(values: number[]) {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2;
}

//median score for each party with enough scored members
export function partyMedians(scores: SpectrumScore[]) {
    const medians = new Map<string, number>();
    for (const party of partyOrder) {
        const partyScores = scores
            .filter((s) => s.party === party)
            .map((s) => s.score);
        const value = median(partyScores);
        if (value !== null && partyScores.length >= MIN_PARTY_MEMBERS) {
            medians.set(party, value);
        }
    }
    return medians;
}
