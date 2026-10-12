import "server-only";
import { Types } from "mongoose";
import ReportModel, { type Report } from "@/models/Report";
import type { ReportListQuery } from "@/schemas/report";

export interface ReportDto {
  id: string;
  title: string;
  description: string;
  category: Report["category"];
  status: Report["status"];
  location: {
    address: string;
    type?: "Point";
    coordinates?: [number, number];
  };
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

type ReportWithId = Report & { _id: Types.ObjectId };

function hasValidCoordinates(
  coordinates: unknown,
): coordinates is [number, number] {
  return (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1]) &&
    coordinates[0] >= -180 &&
    coordinates[0] <= 180 &&
    coordinates[1] >= -90 &&
    coordinates[1] <= 90
  );
}

export function toReportDto(report: ReportWithId): ReportDto {
  const location = report.location;

  return {
    id: report._id.toString(),
    title: report.title,
    description: report.description,
    category: report.category,
    status: report.status,
    location: {
      address: location.address,
      ...(location.type === "Point" && hasValidCoordinates(location.coordinates)
        ? { type: "Point" as const, coordinates: location.coordinates }
        : {}),
    },
    imageUrl: report.imageUrl ?? null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export async function getReportPage(
  query: ReportListQuery,
  ownerId?: string,
) {
  const filter = {
    ...(query.category ? { category: query.category } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(ownerId ? { reportedBy: new Types.ObjectId(ownerId) } : {}),
    ...(query.withCoordinates
      ? {
          "location.type": "Point",
          "location.coordinates": { $type: "array", $size: 2 },
          "location.coordinates.0": { $gte: -180, $lte: 180 },
          "location.coordinates.1": { $gte: -90, $lte: 90 },
        }
      : {}),
  };

  const [reports, total] = await Promise.all([
    ReportModel.find(filter)
      .select(
        "_id title description category status location imageUrl createdAt updatedAt",
      )
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    ReportModel.countDocuments(filter),
  ]);

  return {
    reports: reports.map((report) => toReportDto(report)),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export function reportApiError(
  code: string,
  message: string,
  status: number,
  details?: { path: string; message: string }[],
) {
  return Response.json(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
