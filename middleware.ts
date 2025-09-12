import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const sessionId = request.cookies.get("session")?.value;

  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/auth")) {
    if (sessionId) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!sessionId) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - site.webmanifest (PWA manifest)
     * - sw.js (service worker)
     * - app-icons/ (PWA icons)
     */
    "/((?!_next/static|_next/image|favicon.ico|site.webmanifest|sw.js|app-icons).*)",
  ],
};
