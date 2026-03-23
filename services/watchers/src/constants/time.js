module.exports = {
  // Intervals
  ALERT_SUGGEST_CLOSE_INTERVAL:
    process.env.ALERT_SUGGEST_CLOSE_INTERVAL || "1 hour",
  ALERT_SUGGEST_KEEP_OPEN_INTERVAL:
    process.env.ALERT_SUGGEST_KEEP_OPEN_INTERVAL || "23 hours",
  ALERT_AUTO_CLOSE_INTERVAL:
    process.env.ALERT_AUTO_CLOSE_INTERVAL || "24 hours",
  ALERT_AUTO_ARCHIVE_INTERVAL:
    process.env.ALERT_AUTO_ARCHIVE_INTERVAL || "7 days", // must be more than ALERT_NOTIFICATION_EXPIRATION_INTERVAL
  // DEVICE_GEODATA_IOS_SILENT_PUSH_AGE: process.env.DEVICE_GEODATA_IOS_SILENT_PUSH_AGE || "24 hours", // When to send iOS silent push for heartbeat sync
  DEVICE_GEODATA_NOTIFICATION_AGE:
    process.env.DEVICE_GEODATA_NOTIFICATION_AGE || "44 days", // When to send push notification
  DEVICE_GEODATA_CLEANUP_AGE:
    process.env.DEVICE_GEODATA_CLEANUP_AGE || "45 days", // When to remove/clean data
  NOTIFICATION_CLEANUP_INTERVAL:
    process.env.NOTIFICATION_CLEANUP_INTERVAL || "14 days",

  // Crons
  SCAN_SUGGEST_CLOSE_CRON:
    process.env.SCAN_SUGGEST_CLOSE_CRON || "*/10 * * * *", // At every 10th minute
  SCAN_SUGGEST_KEEP_OPEN_CRON:
    process.env.SCAN_SUGGEST_KEEP_OPEN_CRON || "5 * * * *", // At minute 5
  SCAN_AUTO_CLOSE_CRON: process.env.SCAN_AUTO_CLOSE_CRON || "15 * * * *", // At minute 15
  SCAN_AUTO_ARCHIVE_CRON: process.env.SCAN_AUTO_ARCHIVE_CRON || "0 4 * * *", // At 4:00
  RELATIVE_UNREGISTERED_RECONCILIATION_CRON:
    process.env.RELATIVE_UNREGISTERED_RECONCILIATION_CRON || "0 4 * * *", // At 4:00
  USEFUL_PLACES_PUBLISH_CRON:
    process.env.USEFUL_PLACES_PUBLISH_CRON || "0 5 * * *", // Daily at 5:00 AM
  NOTIFICATION_CLEANUP_CRON:
    process.env.NOTIFICATION_CLEANUP_CRON || "0 0 * * *", // Run at midnight every day
  GEODATA_CLEANUP_CRON: process.env.GEODATA_CLEANUP_CRON || "0 */4 * * *", // Run every 4 hours
}

// cheat on https://crontab.guru/
