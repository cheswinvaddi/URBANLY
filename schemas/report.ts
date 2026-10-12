import { z } from "zod";
import { reportCategories, reportStatuses } from "@/lib/report-constants";

export const reportCategorySchema = z.enum(reportCategories);
export const reportStatusSchema = z.enum(reportStatuses);
export const reportImageUrlSchema = z
  .url({ protocol: /^https$/ })
  .refine((value) => {
    const url = new URL(value);
    const segments = url.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");

    return (
      url.hostname === "res.cloudinary.com" &&
      uploadIndex >= 0 &&
      segments[uploadIndex - 1] === "image" &&
      segments.slice(uploadIndex + 1).some((segment) => segment === "urbanly") &&
      /\.(jpe?g|png|webp)$/i.test(segments.at(-1) ?? "")
    );
  }, "Image must be a supported Urbanly Cloudinary image.");

const reportLocationSchema = z
  .object({
    address: z.string().trim().min(3).max(300),
    type: z.literal("Point").optional(),
    coordinates: z
      .tuple([
        z.number().min(-180).max(180),
        z.number().min(-90).max(90),
      ])
      .optional(),
  })
  .strict()
  .superRefine((location, context) => {
    if (Boolean(location.type) !== Boolean(location.coordinates)) {
      context.addIssue({
        code: "custom",
        message: "A GeoJSON Point requires both type and coordinates.",
        path: location.coordinates ? ["type"] : ["coordinates"],
      });
    }
  });

export const createReportSchema = z
  .object({
    title: z.string().trim().min(5).max(120),
    description: z.string().trim().min(10).max(2000),
    category: z.string().trim().toLowerCase().pipe(reportCategorySchema),
    location: reportLocationSchema,
    imageUrl: reportImageUrlSchema.optional(),
  })
  .strict();

export type CreateReportInput = z.infer<typeof createReportSchema>;

const normalizedCategoryQuery = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  reportCategorySchema.optional(),
);

export const reportListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: normalizedCategoryQuery,
    status: reportStatusSchema.optional(),
    withCoordinates: z.enum(["true"]).optional(),
  })
  .strict();

export type ReportListQuery = z.infer<typeof reportListQuerySchema>;
