const { ctx } = require("@modjo/core")
const { taskCtx } = require("@modjo/microservice-worker/ctx")

const addNotification = require("~/services/add-notification")

function createBackgroundGeolocationLostNotification(hasFallback) {
  return {
    data: {
      action: "background-geolocation-lost",
    },
    notification: {
      title: hasFallback
        ? `Votre position en temps réel n'est plus à jour`
        : `Alerte-Secours ne reçoit plus de mises à jour de votre position`,
      body: hasFallback
        ? `Votre position habituelle sera utilisée comme point de repère. Ouvrez l'application pour reprendre le suivi.`
        : `Vous ne pourrez plus recevoir d'alertes de proximité. Vérifiez les paramètres.`,
      channel: "system",
      priority: hasFallback ? "default" : "high",
      actionId: "open-background-geolocation-settings",
    },
  }
}

module.exports = async function () {
  return Object.assign(
    async function backgroundGeolocationLostNotify(params) {
      const logger = taskCtx.require("logger")
      const sql = ctx.require("postgres")

      const { deviceId, hasFallback } = params

      try {
        // Get the user ID associated with this device
        const userResult = await sql`
          SELECT
            "user_id" as "userId"
          FROM
            "device"
          WHERE
            id = ${deviceId}
          `

        if (!userResult || userResult.length === 0) {
          logger.warn(
            { deviceId },
            "No user found for device when sending background geolocation lost notification"
          )
          return
        }

        const { userId } = userResult[0]

        // Get the FCM token for this device
        const deviceResult = await sql`
          SELECT
            "fcm_token" as "fcmToken"
          FROM
            "device"
          WHERE
            id = ${deviceId}
          `

        if (!deviceResult[0]?.fcmToken) {
          logger.warn(
            { deviceId, userId },
            "No FCM token found for device when sending background geolocation lost notification"
          )
          return
        }

        const { fcmToken } = deviceResult[0]

        // Create notification config
        const notificationConfig =
          createBackgroundGeolocationLostNotification(hasFallback)

        // Send notification
        logger.info(
          { deviceId, userId, notificationConfig },
          "DEBUG: About to send background geolocation lost notification"
        )

        const { success } = await addNotification({
          fcmToken,
          deviceId,
          userId,
          type: "background-geolocation-lost",
          ...notificationConfig,
        })

        if (!success) {
          throw new Error(
            "Unable to send background geolocation lost notification"
          )
        }

        logger.info(
          { deviceId, userId },
          "Successfully sent background geolocation lost notification"
        )
      } catch (error) {
        logger.error(
          { deviceId, error },
          "Error sending background geolocation lost notification"
        )
      }
    },
    {
      dedupOptions: { enabled: true },
    }
  )
}
