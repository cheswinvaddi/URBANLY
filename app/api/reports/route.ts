import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import {
  getReportPage,
  reportApiError,
  toReportDto,
} from "@/lib/reports/api";
import ReportModel from "@/models/Report";
import {
  CloudinaryConfigurationError,
  isOwnedUrbanlyImageUrl,
} from "@/lib/cloudinary";
import {
  AuthenticationRequiredError,
  requireAuthenticatedUser,
} from "@/lib/auth/authorization";
import {
  createReportSchema,
  reportListQuerySchema,
} from "@/schemas/report";

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

  try {
    await connectToDatabase();
    const data = await getReportPage(query.data);

    return Response.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    console.error("[api/reports] Failed to read the public report feed.");
    return reportApiError(
      "REPORTS_UNAVAILABLE",
      "Reports are temporarily unavailable.",
      503,
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return reportApiError(
      "INVALID_JSON",
      "The request body must contain valid JSON.",
      400,
    );
  }

  const input = createReportSchema.safeParse(body);

  if (!input.success) {
    return reportApiError(
      "INVALID_REPORT",
      "The report details are invalid.",
      400,
      input.error.issues.map((issue) => ({
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
        "Sign in to submit a report.",
        401,
      );
    }

    console.error("[api/reports] Failed to verify the current user.");
    return reportApiError(
      "AUTHENTICATION_UNAVAILABLE",
      "Authentication is temporarily unavailable.",
      503,
    );
  }

  if (input.data.imageUrl) {
    try {
      if (!isOwnedUrbanlyImageUrl(input.data.imageUrl, user.id)) {
        return reportApiError(
          "INVALID_IMAGE_URL",
          "The image must be uploaded to your Urbanly report folder.",
          400,
        );
      }
    } catch (error) {
      if (error instanceof CloudinaryConfigurationError) {
        return reportApiError(
          "UPLOAD_NOT_CONFIGURED",
          "Image uploads are not configured. Contact the site administrator.",
          503,
        );
      }

      console.error("[api/reports] Image URL validation failed.");
      return reportApiError(
        "IMAGE_VALIDATION_FAILED",
        "The image could not be validated.",
        503,
      );
    }
  }

  try {
    await connectToDatabase();
    const report = await ReportModel.create({
      ...input.data,
      reportedBy: new Types.ObjectId(user.id),
      status: "pending",
      imageUrl: input.data.imageUrl ?? null,
    });

    return Response.json(
      { report: toReportDto(report.toObject()) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof CloudinaryConfigurationError) {
      return reportApiError(
        "UPLOAD_NOT_CONFIGURED",
        "Image uploads are not configured. Contact the site administrator.",
        503,
      );
    }

    console.error("[api/reports] Failed to create a report.");
    return reportApiError(
      "REPORT_CREATE_FAILED",
      "Unable to save the report right now.",
      503,
    );
  }
}
