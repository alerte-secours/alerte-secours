const { ctx } = require("@modjo/core")
const cron = require("~/libs/cron")
const tasks = require("~/tasks")
const { USEFUL_PLACES_PUBLISH_CRON } = require("~/constants/time")

module.exports = async function () {
  const logger = ctx.require("logger")
  const { addTask } = ctx.require("amqp")

  return async function usefulPlacesPublishCron() {
    logger.info("watcher usefulPlacesPublishCron: daemon started")

    cron.schedule(USEFUL_PLACES_PUBLISH_CRON, async () => {
      logger.info(
        "usefulPlacesPublishCron: triggering useful-places publish task"
      )
      const MAX_RETRIES = 3
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          await addTask(tasks.USEFUL_PLACES_PUBLISH, {})
          logger.info("usefulPlacesPublishCron: task enqueued successfully")
          return
        } catch (error) {
          logger.error(
            { error, attempt },
            "usefulPlacesPublishCron: failed to enqueue useful-places publish task"
          )
          if (attempt < MAX_RETRIES) {
            const delay = attempt * 5000
            await new Promise((r) => setTimeout(r, delay))
          }
        }
      }
      logger.error(
        "usefulPlacesPublishCron: all retries exhausted, task NOT enqueued"
      )
    })
  }
}
