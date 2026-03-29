import mongoose from "mongoose"
import { getMongoUri } from "@/lib/server/env"

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var __mongooseHotel: MongooseCache | undefined
}

const cache: MongooseCache = global.__mongooseHotel ?? { conn: null, promise: null }
if (process.env.NODE_ENV !== "production") {
  global.__mongooseHotel = cache
}

/**
 * Cached connection for serverless — avoids duplicate connections across invocations.
 */
export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn
  if (!cache.promise) {
    const uri = getMongoUri()
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    })
  }
  try {
    cache.conn = await cache.promise
  } catch (e) {
    cache.promise = null
    throw e
  }
  return cache.conn
}
