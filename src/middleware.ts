import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// Routes that don't require authentication
const isPublicRoute = createRouteMatcher(["/login(.*)", "/api/auth(.*)"]);

// 1 week in seconds
const ONE_WEEK = 60 * 60 * 24 * 7;

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    // If the route requires auth and user is not authenticated, redirect to /login
    if (!isPublicRoute(request) && !(await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, "/login");
    }

    // If user is already authenticated and visits /login, send them to /dashboard
    if (isPublicRoute(request) && (await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, "/dashboard");
    }
  },
  {
    cookieConfig: {
      // Keep the session alive for 1 week across reloads and browser restarts
      maxAge: ONE_WEEK,
    },
  }
);

export const config = {
  // Run middleware on all routes except static files and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
