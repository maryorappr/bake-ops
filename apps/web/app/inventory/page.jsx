const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

async function getInventory() {
  const response = await fetch(`${API_BASE_URL}/api/inventory/items`, { cache: "no-store" });
  if (!response.ok) return [];
  return response.json();
}

export default async function InventoryPage() {
  const items = await getInventory();

  return (
    <main>
      <h2 className="page-title">Inventory</h2>
      <p className="subtle">Current on-hand ingredient levels and reorder thresholds.</p>
      <section className="section list-grid">
        {items.map((item) => (
          <article className="list-card" key={item.id}>
            <p><strong>{item.name}</strong> ({item.unit})</p>
            <p className="meta">On hand: {Number(item.qty).toFixed(2)} - Reorder at: {Number(item.reorderLevel).toFixed(2)}</p>
          </article>
        ))}
        {items.length === 0 ? <p className="subtle">No inventory yet.</p> : null}
      </section>
    </main>
  );
}
