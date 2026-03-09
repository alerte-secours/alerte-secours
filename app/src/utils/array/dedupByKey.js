export default function dedupByKey(arr, key) {
  const unique = new Map(arr.map((item) => [item[key], item]));
  return [...unique.values()];
}
