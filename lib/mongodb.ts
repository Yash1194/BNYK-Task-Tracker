import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

// Use a global cache to reuse the connection across hot-reloads in dev
const cache: MongooseCache = global.__mongooseCache ?? { conn: null, promise: null };
global.__mongooseCache = cache;

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not defined.\n" +
        "Please add it to your .env.local file:\n" +
        "  MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bnyk"
    );
  }

  // Return cached connection if available
  if (cache.conn) {
    return cache.conn;
  }

  // Create a new connection promise if none exists
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((m) => m);
  }

  try {
    cache.conn = await cache.promise;
  } catch (e) {
    // Reset promise so we retry on next call
    cache.promise = null;
    throw e;
  }

  return cache.conn;
}