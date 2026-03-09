async function to(maybePromiseFn, errorExt) {
  let result, error;
  try {
    if (typeof maybePromiseFn === "function") {
      maybePromiseFn = maybePromiseFn();
    }
    result = await maybePromiseFn;
    error = null;
  } catch (e) {
    error = e;
    if (errorExt) {
      Object.assign(error, errorExt);
    }
  }
  return [error, result];
}
export default to;
