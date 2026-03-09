export default function promiseObject(obj) {
  return Promise.all(
    Object.entries(obj).map(async ([k, v]) => [k, await v]),
  ).then(Object.fromEntries);
}
