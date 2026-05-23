import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "dear_session";

// Pages that don't require auth.
const PUBLIC_PATHS = new Set<string>(["/login"]);

// Prefixes that are public regardless of method (share viewer + public avatar proxy).
const PUBLIC_PREFIXES = ["/share/", "/api/share-public/", "/api/avatar/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Propagate the path so server components (e.g. root layout) can read it
  // via `headers()` without restructuring into route groups.
  const headers = new Headers(req.headers);
  headers.set("x-dear-pathname", pathname);
  const passthrough = () =>
    NextResponse.next({ request: { headers } });

  if (PUBLIC_PATHS.has(pathname)) return passthrough();
  if (pathname.startsWith("/api/auth")) return passthrough();
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return passthrough();
  }

  // Note: we only check for cookie *presence* in middleware (edge constraints).
  // Real signature verification happens in route handlers via requireUser().
  const hasSession = req.cookies.get(COOKIE)?.value;
  if (!hasSession) {
    // For API routes, return 401 JSON instead of redirect.
    if (pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return passthrough();
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static files
    "/((?!_next/|favicon.ico|.*\\..*).*)",
  ],
};
