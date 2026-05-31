import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ req, token }) {
            if (!token) return false;

            if (req.nextUrl.pathname.startsWith("/dashboard")) {
                return token.role === "ADMIN" || token.role === "OPERATOR";
            }

            return true;
        },
    },
});

export const config = {
    matcher: ["/dashboard/:path*", "/passenger/:path*"],
};
