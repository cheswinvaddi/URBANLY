import { z } from "zod";

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .refine(
    (password) => new TextEncoder().encode(password).byteLength <= 72,
    "Password must be no more than 72 UTF-8 bytes.",
  );

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(80, "Name must be no more than 80 characters."),
    email: z
      .email("Enter a valid email address.")
      .trim()
      .toLowerCase()
      .max(254, "Email address is too long."),
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .email("Enter a valid email address.")
      .trim()
      .toLowerCase()
      .max(254, "Email address is too long."),
    password: z
      .string()
      .min(1, "Enter your password.")
      .refine(
        (password) => new TextEncoder().encode(password).byteLength <= 72,
        "Password is invalid.",
      ),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
