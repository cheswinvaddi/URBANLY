import "server-only";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import User, { type UserRole } from "@/models/User";

export interface AuthenticatedUser {
  id: string;
  name: string;
  role: UserRole;
}

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationRequiredError";
  }
}

export class AuthorizationDeniedError extends Error {
  constructor() {
    super("You are not authorized to perform this action.");
    this.name = "AuthorizationDeniedError";
  }
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  const userId = session?.user.id;

  if (!userId) {
    return null;
  }

  await connectToDatabase();
  const user = await User.findById(userId).select("name role");

  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    role: user.role,
  };
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new AuthenticationRequiredError();
  }

  return user;
}

export async function requireRole(role: UserRole): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser();

  if (user.role !== role) {
    throw new AuthorizationDeniedError();
  }

  return user;
}
