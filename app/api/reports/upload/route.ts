import { fileTypeFromBuffer } from "file-type";
import {
  AuthenticationRequiredError,
  requireAuthenticatedUser,
} from "@/lib/auth/authorization";
import {
  CloudinaryConfigurationError,
  MAX_REPORT_IMAGE_BYTES,
  uploadReportImage,
} from "@/lib/cloudinary";

const acceptedFormats = new Set(["image/jpeg", "image/png", "image/webp"]);
const maximumRequestBytes = MAX_REPORT_IMAGE_BYTES + 64 * 1024;

function errorResponse(code: string, message: string, status: number) {
  return Response.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let user;

  try {
    user = await requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return errorResponse(
        "AUTHENTICATION_REQUIRED",
        "Sign in to upload a report photo.",
        401,
      );
    }

    console.error("[api/reports/upload] Failed to verify the current user.");
    return errorResponse(
      "AUTHENTICATION_UNAVAILABLE",
      "Authentication is temporarily unavailable.",
      503,
    );
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (!contentLengthHeader || !/^\d+$/.test(contentLengthHeader)) {
    return errorResponse(
      "CONTENT_LENGTH_REQUIRED",
      "The upload size could not be verified. Please try again.",
      411,
    );
  }

  const contentLength = Number(contentLengthHeader);
  if (contentLength > maximumRequestBytes) {
    return errorResponse(
      "IMAGE_TOO_LARGE",
      "Choose an image smaller than 5 MB.",
      413,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(
      "INVALID_UPLOAD",
      "Send one image using multipart form data.",
      400,
    );
  }

  const files = formData.getAll("image");
  if (files.length !== 1 || !(files[0] instanceof File)) {
    return errorResponse(
      "INVALID_IMAGE",
      "Choose exactly one JPEG, PNG, or WebP image.",
      400,
    );
  }

  const file = files[0];
  if (file.size === 0 || file.size > MAX_REPORT_IMAGE_BYTES) {
    return errorResponse(
      "IMAGE_TOO_LARGE",
      "Choose an image smaller than 5 MB.",
      413,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedType = await fileTypeFromBuffer(buffer);

  if (
    !detectedType ||
    !acceptedFormats.has(detectedType.mime) ||
    (file.type && file.type !== detectedType.mime)
  ) {
    return errorResponse(
      "UNSUPPORTED_IMAGE",
      "The file must be a valid JPEG, PNG, or WebP image.",
      415,
    );
  }

  try {
    const format = detectedType.mime === "image/jpeg" ? "jpg" : detectedType.ext;
    if (format !== "jpg" && format !== "png" && format !== "webp") {
      return errorResponse(
        "UNSUPPORTED_IMAGE",
        "The file must be a valid JPEG, PNG, or WebP image.",
        415,
      );
    }

    const uploaded = await uploadReportImage(buffer, user.id, format);

    return Response.json(
      { imageUrl: uploaded.secureUrl },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof CloudinaryConfigurationError) {
      return errorResponse(
        "UPLOAD_NOT_CONFIGURED",
        "Image uploads are not configured. Contact the site administrator.",
        503,
      );
    }

    console.error("[api/reports/upload] Image upload failed.");
    return errorResponse(
      "UPLOAD_FAILED",
      "We couldn’t upload the image. Please try again.",
      502,
    );
  }
}
