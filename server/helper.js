export default function lowerCaseKeys(obj) {
    return Object.fromEntries(
        Object.entries(obj || {}).map(([key, value]) => [
            key.toLowerCase(),
            value,
        ]),
    );
}
