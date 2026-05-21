import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "dear_session";

// Pages that don't require auth.
const PUBLIC_PATHS = new Set<string>(["/login"]);

// Prefixes that are public regardless of method (share viewer + IG Story).
const PUBLIC_PREFIXES = ["/share/", "/api/share-public/", "/api/story/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (pathname.startsWith("/api/auth")) return NextResponse.next();
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static files
    "/((?!_next/|favicon.ico|.*\\..*).*)",
  ],
};
