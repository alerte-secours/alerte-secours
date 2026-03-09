export default function isAbortError(error) {
  if (error.networkError?.name === "AbortError") {
    return true;
  }
  if (error.networkError?.message === "Software caused connection abort") {
    return true;
  }
  if (error.networkError?.message === "Connection reset") {
    return true;
  }
  return false;
}
