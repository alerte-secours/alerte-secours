export default function shallowCompare(a1, a2) {
  if (!a1 || !a2) {
    return a1 === a2;
  }
  return (
    a1.length == a2.length &&
    a1.every((element, index) => element === a2[index])
  );
}
