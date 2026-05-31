const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

async function getOrders() {
  const response = await fetch(`${API_BASE_URL}/api/orders`, { cache: "no-store" });
  if (!response.ok) return [];
  return response.json();
}

function groupOrders(orders) {
  return {
    New: orders.filter((o) => o.status === "new"),
    Prep: orders.filter((o) => o.status === "prep"),
    Ready: orders.filter((o) => o.status === "ready"),
    Fulfilled: orders.filter((o) => o.status === "fulfilled")
  };
}

function nextStatusFor(columnName) {
  if (columnName === "New") return "prep";
  if (columnName === "Prep") return "ready";
  if (columnName === "Ready") return "fulfilled";
  return null;
}

function nextStatusLabel(columnName) {
  if (columnName === "New") return "Move to Prep";
  if (columnName === "Prep") return "Move to Ready";
  if (columnName === "Ready") return "Mark Fulfilled";
  return "";
}

export default async function FulfillmentPage() {
  const orders = await getOrders();
  const columns = groupOrders(orders);

  return (
    <main>
      <h2 className="page-title">Fulfillment Board</h2>
      <p className="subtle">Move today\'s orders from intake to handoff with zero confusion.</p>
      <div className="board">
        {Object.entries(columns).map(([name, items]) => {
          const toStatus = nextStatusFor(name);
          return (
            <section key={name} className="column">
              <h3 className="column-title">
                {name}
                <span className="pill">{items.length}</span>
              </h3>
              {items.length === 0 ? (
                <p className="subtle">No orders here.</p>
              ) : (
                items.map((item) => (
                  <article key={item.id} className="order-card">
                    <p><strong>{item.customerName}</strong></p>
                    <p className="meta">{item.id} - Due {item.dueAt}</p>
                    <p className="meta">Items: {item.items?.map((x) => `${x.productName} x${x.quantity}`).join(", ") || "None"}</p>
                    {toStatus ? (
                      <form method="post" action={`/api/orders/${item.id}/status`}>
                        <input type="hidden" name="status" value={toStatus} />
                        <button className="status-btn" type="submit">{nextStatusLabel(name)}</button>
                      </form>
                    ) : null}
                  </article>
                ))
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
