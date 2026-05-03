import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin/* routes, but allow /admin/login and /api/admin/login
  if (
    !pathname.startsWith("/admin") ||
    pathname.startsWith("/admin/login")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie set by /api/admin/login
  const accessToken = request.cookies.get("sb-access-token")?.value;

  if (!accessToken) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
