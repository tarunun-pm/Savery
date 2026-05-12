import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Supabase auth token in cookies
  const hasSession = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  // Protect dashboard and onboarding routes
  const protectedPaths = ["/dashboard", "/onboarding"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !hasSession) {
    // Temporarily disabled to debug flickering
    // const url = request.nextUrl.clone();
    // url.pathname = "/auth";
    // return NextResponse.redirect(url);
  }

  // If authenticated user visits /auth, redirect to dashboard
  if (pathname.startsWith("/auth") && hasSession) {
    // const url = request.nextUrl.clone();
    // url.pathname = "/dashboard";
    // return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/auth/:path*"],
};
