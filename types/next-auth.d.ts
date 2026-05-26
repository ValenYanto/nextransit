import type { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface User {
        role: "USER" | "OPERATOR" | "ADMIN";
    }

    interface Session {
        user: {
            id: string;
            role: "USER" | "OPERATOR" | "ADMIN";
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: "USER" | "OPERATOR" | "ADMIN";
    }
}