const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

async function getAvailability() {
  const response = await fetch(`${API_BASE_URL}/api/availability/latest`, { cache: "no-store" });
  if (!response.ok) return [];
  return response.json();
}

function stockText(value) {
  if (value === true) return "In stock";
  if (value === false) return "Out of stock";
  return "Unknown";
}

export default async function AvailabilityPage() {
  const rows = await getAvailability();

  return (
    <main>
      <h2 className="page-title">Supplier Watch</h2>
      <p className="subtle">Track ingredient availability and spot supply risk early.</p>

      <form method="post" action="/api/availability/check">
        <button className="status-btn" type="submit">Run Availability Check</button>
      </form>

      <section className="section list-grid">
        {rows.map((row) => (
          <article className="list-card" key={row.targetId}>
            <p><strong>{row.ingredientName}</strong> - {row.supplierName}</p>
            <p className="meta">{row.productName}</p>
            <p className="meta">Stock: {stockText(row.inStock)} | Price: {row.priceText || "N/A"}</p>
            <p className="meta">Signal: {row.availabilityText || "N/A"}</p>
            <p className="meta">Last checked: {row.checkedAt ? new Date(row.checkedAt).toLocaleString() : "Never"}</p>
            <p className="meta"><a href={row.url} target="_blank" rel="noreferrer">Open supplier page</a></p>
          </article>
        ))}
        {rows.length === 0 ? <p className="subtle">No supplier watch targets yet.</p> : null}
      </section>
    </main>
  );
}
