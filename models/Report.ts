import { model, models, Schema, Types } from "mongoose";
import { reportCategories, reportStatuses } from "@/lib/report-constants";

export interface Report {
  title: string;
  description: string;
  category: (typeof reportCategories)[number];
  status: (typeof reportStatuses)[number];
  location: {
    address: string;
    type?: "Point";
    coordinates?: [number, number];
  };
  imageUrl: string | null;
  reportedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<Report["location"]>(
  {
    address: { type: String, required: true, trim: true, maxlength: 300 },
    type: {
      type: String,
      enum: ["Point"],
      required: function (this: Report["location"]) {
        return this.coordinates !== undefined;
      },
    },
    coordinates: {
      type: [Number],
      default: undefined,
      required: function (this: Report["location"]) {
        return this.type !== undefined;
      },
      validate: {
        validator: (coordinates: number[] | undefined) =>
          coordinates === undefined ||
          (coordinates.length === 2 &&
            coordinates[0] >= -180 &&
            coordinates[0] <= 180 &&
            coordinates[1] >= -90 &&
            coordinates[1] <= 90),
        message:
          "Point coordinates must be [longitude, latitude] within geographic ranges.",
      },
    },
  },
  { _id: false },
);

const ReportSchema = new Schema<Report>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    category: { type: String, enum: reportCategories, required: true },
    status: {
      type: String,
      enum: reportStatuses,
      required: true,
      default: "pending",
    },
    location: { type: LocationSchema, required: true },
    imageUrl: { type: String, default: null },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

ReportSchema.index(
  { location: "2dsphere" },
  {
    name: "location_2dsphere",
    partialFilterExpression: { "location.type": "Point" },
  },
);
ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ category: 1, createdAt: -1 });
ReportSchema.index({ status: 1, category: 1, createdAt: -1 });
ReportSchema.index({ reportedBy: 1, createdAt: -1 });

const ReportModel = models.Report ?? model<Report>("Report", ReportSchema);

export default ReportModel;
