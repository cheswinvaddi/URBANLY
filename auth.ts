import "server-only";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db";
import { loginSchema } from "@/schemas/auth";
import User from "@/models/User";

const authTrustHost =
  process.env.NODE_ENV === "development" ||
  process.env.AUTH_TRUST_HOST === "true" ||
  Boolean(process.env.VERCEL);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: authTrustHost,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse({
          email: credentials.email,
          password: credentials.password,
        });

        if (!parsed.success) {
          return null;
        }

        await connectToDatabase();
        const user = await User.findOne({ email: parsed.data.email }).select(
          "+passwordHash",
        );

        if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }

      delete token.email;
      delete token.picture;

      return token;
    },
    session({ session, token }) {
      session.user.id = typeof token.sub === "string" ? token.sub : "";
      session.user.role = token.role === "admin" ? "admin" : "citizen";
      return session;
    },
  },
});
