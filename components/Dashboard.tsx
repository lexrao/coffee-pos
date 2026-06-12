"use client";
import { Order } from "@/types";

interface Props { orders: Order[]; }

export default function Dashboard({ orders }: Props) {
  const today = new Date();
  const todayOrders = orders.filter((o) => {
    const d = o.createdAt instanceof Date ? o.createdAt : new Date();
    return d.toDateString() === today.toDateString();
  });
  const completed = todayOrders.filter((o) => o.status === "completed");
  const revenue = completed.reduce((s, o) => s + o.total, 0);
  const avgOrder = completed.length > 0 ? Math.round(revenue / completed.length) : 0;

  const itemCounts: Record<string, { name: string; emoji: string; count: number }> = {};
  completed.forEach((o) => o.items.forEach((i) => {
    const key = i.menuItem.id;
    if (!itemCounts[key]) itemCounts[key] = { name: i.menuItem.name, emoji: i.menuItem.emoji, count: 0 };
    itemCounts[key].count += i.quantity;
  }));
  const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  const payBreakdown = { cash: 0, card: 0, gcash: 0 };
  completed.forEach((o) => { payBreakdown[o.paymentMethod] += o.total; });

  const inQueue = todayOrders.filter(o => o.status === "pending" || o.status === "preparing").length;

  return (
    <div className="dashboard">
      <div className="dashboard-header-row">
        <h2 className="dashboard-title">Today's Summary</h2>
        <a href="/owner" className="owner-link-btn">📊 Full Owner Dashboard →</a>
      </div>
      <div className="dash-stats">
        <div className="dash-stat">
          <span className="dash-stat-value">₱{revenue.toLocaleString()}</span>
          <span className="dash-stat-label">Revenue</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-value">{completed.length}</span>
          <span className="dash-stat-label">Completed</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-value">₱{avgOrder}</span>
          <span className="dash-stat-label">Avg Order</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-value">{inQueue}</span>
          <span className="dash-stat-label">In Queue</span>
        </div>
      </div>

      <div className="dash-row">
        <div className="dash-card">
          <h3 className="dash-card-title">Top Items Today</h3>
          {topItems.length === 0 ? <p className="dash-empty">No completed orders yet</p> : (
            <ul className="top-items-list">
              {topItems.map((item, i) => (
                <li key={i} className="top-item">
                  <span className="top-item-rank">#{i+1}</span>
                  <span className="top-item-emoji">{item.emoji}</span>
                  <span className="top-item-name">{item.name}</span>
                  <span className="top-item-count">{item.count} sold</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="dash-card">
          <h3 className="dash-card-title">Payment Methods</h3>
          {completed.length === 0 ? <p className="dash-empty">No completed orders yet</p> : (
            <div className="pay-breakdown">
              {(["cash","card","gcash"] as const).map((m) => {
                const pct = revenue > 0 ? Math.round((payBreakdown[m] / revenue) * 100) : 0;
                return (
                  <div key={m} className="pay-row">
                    <span className="pay-label">{m === "cash" ? "💵 Cash" : m === "card" ? "💳 Card" : "📱 GCash"}</span>
                    <div className="pay-bar-wrap"><div className="pay-bar" style={{ width: `${pct}%` }} /></div>
                    <span className="pay-pct">{pct}%</span>
                    <span className="pay-amount">₱{payBreakdown[m].toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="dash-card recent-orders-card">
        <h3 className="dash-card-title">Recent Orders</h3>
        <table className="orders-table">
          <thead>
            <tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Time</th></tr>
          </thead>
          <tbody>
            {orders.slice(0, 15).map((o) => (
              <tr key={o.id}>
                <td className="td-num">#{o.orderNumber}</td>
                <td>{o.customerName || "—"}</td>
                <td>{o.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(", ")}</td>
                <td className="td-amount">₱{o.total}</td>
                <td>{o.paymentMethod}</td>
                <td><span className={`table-status status-${o.status}`}>{o.status}</span></td>
                <td className="td-time">
                  {o.createdAt instanceof Date ? o.createdAt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
