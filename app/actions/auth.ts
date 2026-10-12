"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { loginSchema, registerSchema } from "@/schemas/auth";

export type AuthFormState = {
  errors?: Partial<Record<"name" | "email" | "password", string[]>>;
  message?: string;
};

const genericRegistrationError =
  "We couldn't create your account. Check your details and try again.";

export async function registerAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;

  try {
    await connectToDatabase();
    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      passwordHash,
      role: "citizen",
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return { message: genericRegistrationError };
    }

    throw error;
  }

  redirect("/login?registered=1");
}

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      return { message: "Email or password is incorrect." };
    }

    throw error;
  }

  return { message: "Unable to sign in. Please try again." };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
