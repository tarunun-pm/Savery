import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // The code will be exchanged automatically by the Supabase client
    // Redirect to onboarding for new users or dashboard for returning users
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.delete("code");
    return NextResponse.redirect(url);
  }

  // No code present — redirect to auth page
  const url = request.nextUrl.clone();
  url.pathname = "/auth";
  return NextResponse.redirect(url);
}
