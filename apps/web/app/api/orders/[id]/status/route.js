const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

export async function POST(request, { params }) {
  const formData = await request.formData();
  const status = formData.get("status");

  await fetch(`${API_BASE_URL}/api/orders/${params.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    cache: "no-store"
  });

  return new Response(null, {
    status: 303,
    headers: { Location: "/fulfillment" }
  });
}
