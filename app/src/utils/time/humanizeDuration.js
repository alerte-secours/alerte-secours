export default function humanizeDuration(durationInSeconds, options = {}) {
  const {
    seconds = false,
    padding = 1,
    paddingHours = padding,
    paddingMinutes = padding,
    paddingSeconds = padding,
  } = options;

  const h = Math.floor(durationInSeconds / 3600)
      .toString()
      .padStart(paddingHours, "0"),
    m = Math.floor((durationInSeconds % 3600) / 60)
      .toString()
      .padStart(paddingMinutes, "0"),
    s = Math.floor(durationInSeconds % 60)
      .toString()
      .padStart(paddingSeconds, "0");

  return (
    (h > 0 ? `${h}h` : "") +
    (m > 0 || !(h > 0 && !seconds) ? (h > 0 ? m : `${m} minutes`) : "") +
    (seconds ? `${s}s` : "")
  );
}
