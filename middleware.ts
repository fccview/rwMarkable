import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const sessionId = request.cookies.get("session")?.value;
  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);

  if (request.nextUrl.pathname.startsWith("/api")) {
    return response;
  }

  if (request.nextUrl.pathname.startsWith("/auth")) {
    if (sessionId) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  if (request.nextUrl.pathname.startsWith("/public/")) {
    return response;
  }

  if (!sessionId) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return response;
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
