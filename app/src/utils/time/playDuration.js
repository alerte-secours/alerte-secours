export default function playDuration(durationInMs) {
  const durationInSeconds = Math.floor(durationInMs / 1000);
  const h = Math.floor(durationInSeconds / 3600)
      .toString()
      .padStart(2, "0"),
    m = Math.floor((durationInSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0"),
    s = Math.floor(durationInSeconds % 60)
      .toString()
      .padStart(2, "0");

  return (h > 0 ? `${h}h` : "") + (m > 0 || h > 0 ? `${m}:` : "") + `${s}`;
}
