import { z } from "zod";

const mongoUriSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^mongodb(?:\+srv)?:\/\//);

export function getMongoUri(): string {
  const value = process.env.MONGODB_URI;

  if (!value?.trim()) {
    throw new Error("Missing required environment variable: MONGODB_URI");
  }

  const result = mongoUriSchema.safeParse(value);

  if (!result.success) {
    throw new Error(
      "Invalid environment variable: MONGODB_URI must be a MongoDB connection URI.",
    );
  }

  return result.data;
}
