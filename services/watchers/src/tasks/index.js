const commonTasks = require("common/tasks")

module.exports = {
  DEFAULT_SWAG_USERNAME: "defaultSwagUsername",
  EMAIL_VERIFY: "emailVerify",
  ALERT_SUGGEST_CLOSE_NOTIFY: "alertSuggestCloseNotify",
  ALERT_SUGGEST_KEEP_OPEN_NOTIFY: "alertSuggestKeepOpenNotify",
  ALERT_NOTIFY: "alertNotify",
  ALERT_CLOSE: "alertClose",
  ALERT_ARCHIVE: "alertArchive",
  RELATIVE_ALLOW_ASK_NOTIFY: "relativeAllowAskNotify",
  RELATIVE_INVITATION_NOTIFY: "relativeInvitationNotify",
  ALERT_CALL_EMERGENCY_INFO_NOTIFY: "alertCallEmergencyInfoNotify",
  BACKGROUND_GEOLOCATION_LOST_NOTIFY: "backgroundGeolocationLostNotify",
  // Re-export shared task constants from common to avoid duplication
  ...commonTasks,
  // IOS_GEOLOCATION_HEARTBEAT_SYNC: "iosGeolocationHeartbeatSync",
}
