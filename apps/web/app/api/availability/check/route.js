const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

export async function POST(request) {
  await fetch(`${API_BASE_URL}/api/availability/check`, {
    method: "POST",
    cache: "no-store"
  });

  return new Response(null, {
    status: 303,
    headers: { Location: "/availability" }
  });
}
