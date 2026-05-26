// auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },

    pages: {
        signIn: "/login",
    },

    providers: [
        CredentialsProvider({
            name: "Credentials",

            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                },
                password: {
                    label: "Password",
                    type: "password",
                },
            },

            async authorize(credentials) {
                const parsed = loginSchema.safeParse(credentials);

                if (!parsed.success) {
                    return null;
                }

                const { email, password } = parsed.data;

                const user = await prisma.user.findUnique({
                    where: {
                        email,
                    },
                });

                if (!user) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(password, user.password);

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as "USER" | "OPERATOR" | "ADMIN";
            }

            return session;
        },
    },
};