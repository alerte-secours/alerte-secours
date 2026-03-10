const { ctx } = require("@modjo/core")
const cron = require("~/libs/cron")
const tasks = require("~/tasks")

const GEODAE_PUBLISH_CRON = "0 5 * * *" // Daily at 5:00 AM

module.exports = async function () {
  const logger = ctx.require("logger")
  const { addTask } = ctx.require("amqp")

  return async function geodaePublishCron() {
    logger.info("watcher geodaePublishCron: daemon started")

    cron.schedule(GEODAE_PUBLISH_CRON, async () => {
      logger.info("geodaePublishCron: triggering geodae publish task")
      try {
        await addTask(tasks.GEODAE_PUBLISH, {})
      } catch (error) {
        logger.error(
          { error },
          "geodaePublishCron: failed to enqueue geodae publish task"
        )
      }
    })
  }
}
