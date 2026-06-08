const { env } = require("../config/env")

let batchQueue = null
let batchWorker = null

const getRedisConnection = () => {
  if (!env.REDIS_URL) return null
  const IORedis = require("ioredis")
  return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null })
}

const initQueue = async () => {
  if (batchQueue || !env.REDIS_URL) return batchQueue

  const { Queue, Worker } = require("bullmq")
  const connection = getRedisConnection()
  const { processBatchDomains } = require("../services/worker.service")

  batchQueue = new Queue("email-harvesting-batches", { connection })

  if (!batchWorker) {
    batchWorker = new Worker(
      "email-harvesting-batches",
      async (job) => {
        await processBatchDomains(job.data.batchId)
      },
      { connection, concurrency: env.WORKER_COUNT || 1 }
    )

    batchWorker.on("failed", (job, err) => {
      console.error(`[queue] batch ${job?.data?.batchId} failed:`, err.message)
    })
  }

  return batchQueue
}

const enqueueBatchProcessing = async (batchId) => {
  const queue = await initQueue()

  if (queue) {
    await queue.add(
      "process-batch",
      { batchId },
      { removeOnComplete: 100, removeOnFail: 50, jobId: `batch-${batchId}` }
    )
    return { mode: "redis" }
  }

  const { processBatchDomains } = require("../services/worker.service")
  processBatchDomains(batchId).catch((err) => {
    console.error(`[worker] batch ${batchId} processing error:`, err.message)
  })
  return { mode: "in-process" }
}

const shutdownQueue = async () => {
  if (batchWorker) {
    await batchWorker.close()
    batchWorker = null
  }
  if (batchQueue) {
    await batchQueue.close()
    batchQueue = null
  }
}

module.exports = { enqueueBatchProcessing, shutdownQueue, initQueue }
