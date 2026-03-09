import moment from "moment";

const justNowLabel = "à l'instant";
const complementDiffPrefixLabel = "il y a ";
const complementHourPrefixLabel = "aujourd'hui à ";

export default function getTimeDisplay(
  timeString,
  now = new Date(),
  options = {},
) {
  const {
    short,
    shortMinute = short !== undefined ? short : false,
    shortHour = short !== undefined ? short : false,
    shortDay = short !== undefined ? short : true,
  } = options;
  const timeDate = moment(timeString);
  if (timeDate.isSame(now, "minute")) {
    return justNowLabel;
  }
  if (timeDate.isSame(now, "hour")) {
    const diff = moment(now).diff(timeDate, "minutes");
    if (diff <= 0) {
      return justNowLabel;
    }
    return shortMinute
      ? `${diff} min`
      : complementDiffPrefixLabel + `${diff} minutes`;
  }
  if (timeDate.isSame(now, "day")) {
    const timeHourLabel = timeDate.format("HH:mm");
    return shortHour
      ? "à " + timeHourLabel
      : complementHourPrefixLabel + timeHourLabel;
  }
  return shortDay
    ? timeDate.format("ddd Do MMM HH:mm")
    : timeDate.format("ddd Do MMM à HH:mm");
}
