const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

async function getSummary() {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/summary`, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

export default async function Home() {
  const summary = await getSummary();

  return (
    <main>
      <h2 className="page-title">Daily Snapshot</h2>
      <p className="subtle">Track order pressure, revenue flow, and stock risk at a glance.</p>
      {!summary ? (
        <section className="section">
          <h2>Waiting On API</h2>
          <p>Dashboard data is unavailable. Confirm the API is running on port 4000.</p>
        </section>
      ) : (
        <>
          <section className="metric-grid">
            <article className="metric-card">
              <p className="metric-label">Due Today</p>
              <p className="metric-value">{summary.todayDue}</p>
              <p className="metric-note">Keep prep queue moving before noon</p>
            </article>
            <article className="metric-card">
              <p className="metric-label">7-Day Revenue</p>
              <p className="metric-value">${(summary.weekRevenueCents / 100).toFixed(2)}</p>
              <p className="metric-note">Rolling total from active order ledger</p>
            </article>
            <article className="metric-card">
              <p className="metric-label">Low Stock Alerts</p>
              <p className="metric-value">{summary.lowStockAlerts}</p>
              <p className="metric-note">Review flour, butter, and packaging thresholds</p>
            </article>
            <article className="metric-card">
              <p className="metric-label">At-Risk Orders</p>
              <p className="metric-value">{summary.atRiskOrders}</p>
              <p className="metric-note">Orders due today still marked as new</p>
            </article>
          </section>
          <section className="section">
            <h2>Fulfillment Focus</h2>
            <p>Jump straight into the order board to move batches from prep to ready.</p>
            <a className="cta-link" href="/fulfillment">Open Fulfillment Board</a>
          </section>
        </>
      )}
    </main>
  );
}
