import { model, models, Schema } from "mongoose";

export const userRoles = ["citizen", "admin"] as const;

export type UserRole = (typeof userRoles)[number];

export interface UserRecord {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserRecord>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: userRoles, required: true, default: "citizen" },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 }, { unique: true, name: "user_email_unique" });

const UserModel = models.User ?? model<UserRecord>("User", UserSchema);

export default UserModel;
