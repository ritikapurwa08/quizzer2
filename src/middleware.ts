import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

export default convexAuthNextjsMiddleware(
  (_request, _ctx) => {
    // Route protection is handled by AuthGuard on the client.
    // This middleware exists solely to refresh auth cookies on every request
    // and to set the cookie maxAge so the session persists for 7 days.
  },
  { cookieConfig: { maxAge: 60 * 60 * 24 * 7 } }, // 7 days
);

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
