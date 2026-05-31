import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

export async function POST(request) {
  await fetch(`${API_BASE_URL}/api/availability/check`, {
    method: "POST",
    cache: "no-store"
  });

  const redirectUrl = new URL("/availability", request.url);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
