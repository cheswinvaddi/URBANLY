import { connectToDatabase } from "@/lib/db";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }

  try {
    const mongoose = await connectToDatabase();
    const database = mongoose.connection.db;

    if (!database) {
      throw new Error("MongoDB connection did not provide a database.");
    }

    await database.admin().ping();

    return Response.json(
      { status: "connected" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message === "Missing required environment variable: MONGODB_URI"
        ? error.message
        : "MongoDB is not reachable. Check MONGODB_URI and database network access.";

    console.error(`[db-check] ${message}`);

    return Response.json(
      { status: "unavailable", message },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
