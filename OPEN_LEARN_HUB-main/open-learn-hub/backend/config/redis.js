import Redis from 'ioredis'

const url = process.env.REDIS_URL

let redis = null
let loggedError = false

if (!url) {
  console.log('Redis disabled (REDIS_URL not set)')
} else {
  redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1, enableReadyCheck: false })
  redis.connect().then(()=> console.log('Redis connected')).catch((e)=>{
    if (!loggedError) {
      loggedError = true
      console.warn('Redis connect failed, continuing without cache:', e?.code || e?.message)
    }
  })
  redis.on('error', (e)=>{
    if (!loggedError) {
      loggedError = true
      console.warn('Redis error, cache disabled:', e?.code || e?.message)
    }
  })
}

export { redis }
