export function formatPolicyName(value: string) {
    return value
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

//shortens a pair of opposite policy directions to just the words that differ, ie
//"restrict_housing_supply" / "increase_housing_supply" -> ["Restrict", "Increase"]
//and "energy_cost_increase" / "energy_cost_decrease" -> ["Increase", "Decrease"]
export function shortenDirectionPair(
    leftDirection: string,
    rightDirection: string,
): [string, string] {
    const left = leftDirection.split("_");
    const right = rightDirection.split("_");

    let start = 0;
    while (
        start < left.length - 1 &&
        start < right.length - 1 &&
        left[start] === right[start]
    ) {
        start++;
    }

    let end = 0;
    while (
        end < left.length - start - 1 &&
        end < right.length - start - 1 &&
        left[left.length - 1 - end] === right[right.length - 1 - end]
    ) {
        end++;
    }

    return [
        formatPolicyName(left.slice(start, left.length - end).join("_")),
        formatPolicyName(right.slice(start, right.length - end).join("_")),
    ];
}
