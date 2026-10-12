import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { reportCategories, reportStatuses } from "@/lib/report-constants";
import ReportModel from "@/models/Report";

export interface DashboardReport {
  id: string;
  title: string;
  category: (typeof reportCategories)[number];
  status: (typeof reportStatuses)[number];
  location: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface DashboardReportData {
  statistics: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
  };
  recentReports: DashboardReport[];
}

interface DashboardAggregateResult {
  statistics: Array<{ _id: string; count: number }>;
  recentReports: Array<{
    _id: Types.ObjectId;
    title: string;
    category: DashboardReport["category"];
    status: DashboardReport["status"];
    location: { address: string };
    imageUrl: string | null;
    createdAt: Date;
  }>;
}

export async function getDashboardReportData(
  authenticatedUserId: string,
): Promise<DashboardReportData> {
  await connectToDatabase();

  const [result] = await ReportModel.aggregate<DashboardAggregateResult>([
    { $match: { reportedBy: new Types.ObjectId(authenticatedUserId) } },
    {
      $facet: {
        statistics: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ],
        recentReports: [
          { $sort: { createdAt: -1, _id: -1 } },
          { $limit: 5 },
          {
            $project: {
              _id: 1,
              title: 1,
              category: 1,
              status: 1,
              location: { address: "$location.address" },
              imageUrl: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
  ]).exec();

  const counts = new Map(
    result.statistics.map(({ _id, count }) => [_id, count]),
  );
  const statistics = {
    total: result.statistics.reduce((total, entry) => total + entry.count, 0),
    pending: counts.get("pending") ?? 0,
    inProgress: counts.get("in-progress") ?? 0,
    resolved: counts.get("resolved") ?? 0,
  };

  return {
    statistics,
    recentReports: result.recentReports.map((report) => ({
      id: report._id.toString(),
      title: report.title,
      category: report.category,
      status: report.status,
      location: report.location.address,
      imageUrl: report.imageUrl ?? null,
      createdAt: report.createdAt.toISOString(),
    })),
  };
}
