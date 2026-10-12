import { connectToDatabase } from "@/lib/db";
import {
  getReportPage,
  reportApiError,
} from "@/lib/reports/api";
import {
  AuthenticationRequiredError,
  requireAuthenticatedUser,
} from "@/lib/auth/authorization";
import { reportListQuerySchema } from "@/schemas/report";

export async function GET(request: Request) {
  const query = reportListQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  if (!query.success) {
    return reportApiError(
      "INVALID_QUERY",
      "The report filters or pagination parameters are invalid.",
      400,
      query.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  let user;

  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return reportApiError(
        "AUTHENTICATION_REQUIRED",
        "Sign in to view your reports.",
        401,
      );
    }

    console.error("[api/reports/mine] Failed to verify the current user.");
    return reportApiError(
      "AUTHENTICATION_UNAVAILABLE",
      "Authentication is temporarily unavailable.",
      503,
    );
  }

  try {
    await connectToDatabase();
    const data = await getReportPage(query.data, user.id);

    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    console.error("[api/reports/mine] Failed to read the current user's reports.");
    return reportApiError(
      "REPORTS_UNAVAILABLE",
      "Your reports are temporarily unavailable.",
      503,
    );
  }
}
