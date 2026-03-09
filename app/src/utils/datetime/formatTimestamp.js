import moment from "moment";
import "moment/locale/fr";

/**
 * Formats a timestamp into a French localized date-time string (DD/MM/YYYY HH:mm)
 * @param {string} timestamp - ISO 8601 timestamp string
 * @returns {string} Formatted date-time string
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  moment.locale("fr");
  return moment(timestamp).format("DD/MM/YYYY HH:mm");
}
