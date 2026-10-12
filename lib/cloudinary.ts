import "server-only";
import { v2 as cloudinary } from "cloudinary";

export class CloudinaryConfigurationError extends Error {
  constructor() {
    super("Cloudinary image uploads are not configured.");
    this.name = "CloudinaryConfigurationError";
  }
}

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new CloudinaryConfigurationError();
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return { cloudName };
}

export function isOwnedUrbanlyImageUrl(
  value: string,
  ownerId: string,
): boolean {
  const { cloudName } = getCloudinaryConfig();

  try {
    const url = new URL(value);
    const segments = url.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");
    const versionIndex =
      segments[uploadIndex + 1]?.match(/^v\d+$/) ? uploadIndex + 2 : uploadIndex + 1;

    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      segments[0] === cloudName &&
      segments[uploadIndex - 1] === "image" &&
      segments[versionIndex] === "urbanly" &&
      segments[versionIndex + 1] === "reports" &&
      segments[versionIndex + 2] === ownerId &&
      segments.length === versionIndex + 4 &&
      /\.(jpe?g|png|webp)$/i.test(segments.at(-1) ?? "")
    );
  } catch {
    return false;
  }
}

export async function uploadReportImage(
  buffer: Buffer,
  ownerId: string,
  format: "jpg" | "png" | "webp",
): Promise<{ secureUrl: string }> {
  getCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: `urbanly/reports/${ownerId}`,
        resource_type: "image",
        format,
        allowed_formats: ["jpg", "png", "webp"],
        max_file_size: 5 * 1024 * 1024,
        overwrite: false,
        unique_filename: true,
        use_filename: false,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(new Error("Cloudinary image upload failed."));
          return;
        }

        resolve({ secureUrl: result.secure_url });
      },
    );

    upload.end(buffer);
  });
}

export const MAX_REPORT_IMAGE_BYTES = 5 * 1024 * 1024;
