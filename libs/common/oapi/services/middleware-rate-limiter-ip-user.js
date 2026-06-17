const { ctx } = require("@modjo/core")
const { reqCtx } = require("@modjo/express/ctx")
const {
  RateLimiterMemory,
  RateLimiterRedis,
  RateLimiterRes,
} = require("rate-limiter-flexible")

module.exports = () => {
  const logger = ctx.require("logger")

  return (options = {}) => {
    // Back the limiter with a shared Redis store so limits hold across replicas
    // (RateLimiterMemory is per-pod and trivially bypassed by hitting another
    // replica). Falls back to in-memory when no redis client is registered
    // (e.g. the files service / local dev) so behaviour is never broken, and
    // uses an in-memory insurance limiter if Redis is unreachable at runtime.
    const memoryLimiter = new RateLimiterMemory({ ...options })
    let redisClient = null
    try {
      redisClient = ctx.require("redisQueueDedup")
    } catch (e) {
      redisClient = null
    }
    const rateLimiter = redisClient
      ? new RateLimiterRedis({
          ...options,
          storeClient: redisClient,
          keyPrefix: "rlflx-ip-user",
          insuranceLimiter: memoryLimiter,
        })
      : memoryLimiter

    return async (req, res, next) => {
      const { ip } = req
      const { userId } = reqCtx.get("session")
      const key = `${ip}.${userId}`
      try {
        await rateLimiter.consume(key)
        next()
      } catch (error) {
        if (!(error instanceof RateLimiterRes)) {
          throw error
        }
        logger.error(
          { ip, userId, key },
          "rate-limiter-flexible : Too Many Requests"
        )
        res.status(429).send("Too Many Requests")
      }
    }
  }
}
