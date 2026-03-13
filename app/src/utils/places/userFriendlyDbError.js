/**
 * Convert a technical DB update error into a user-friendly message using i18n.
 * The raw technical details are already logged via console.warn in updateUsefulPlacesDb.
 */
import i18next from "i18next";

export default function userFriendlyDbError(error) {
  const t = i18next.t.bind(i18next);
  const msg = error?.message || "";
  if (msg.includes("Network") || msg.includes("network")) {
    return t("dbErrorNetwork");
  }
  if (msg.includes("HTTP")) {
    return t("dbErrorServer");
  }
  if (msg.includes("Download failed") || msg.includes("file is empty")) {
    return t("dbErrorDownload");
  }
  if (msg.includes("failed validation")) {
    return t("dbErrorValidation");
  }
  return t("dbErrorGeneric");
}
