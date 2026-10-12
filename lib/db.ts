import mongoose from "mongoose";
import { getMongoUri } from "@/lib/env";

interface MongooseCache {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache =
  globalThis.mongooseCache ??
  (globalThis.mongooseCache = { connection: null, promise: null });

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = getMongoUri();

  if (cache.connection) {
    return cache.connection;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  try {
    cache.connection = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.connection;
}
