"use client";
import { useState, useEffect, useMemo } from "react";
import { useOrders } from "@/hooks/useOrders";
import {
  filterByRange, getDailyStats, getHourlyStats,
  getItemStats, getPaymentStats,
  ordersToCSV, downloadFile, saveToLocalStorage, loadFromLocalStorage,
} from "@/lib/analytics";
import { Order } from "@/types";

const OWNER_PIN = "5678"; // Change to your owner PIN

type RangeKey = "today" | "week" | "month" | "custom";

function getRange(key: RangeKey, customFrom: string, customTo: string): { from: Date; to: Date } {
  const now = new Date();
  if (key === "today") {
    const from = new Date(now); from.setHours(0,0,0,0);
    return { from, to: now };
  }
  if (key === "week") {
    const from = new Date(now); from.setDate(now.getDate() - 6); from.setHours(0,0,0,0);
    return { from, to: now };
  }
  if (key === "month") {
    const from = new Date(now); from.setDate(now.getDate() - 29); from.setHours(0,0,0,0);
    return { from, to: now };
  }
  return {
    from: customFrom ? new Date(customFrom) : new Date(),
    to: customTo ? new Date(customTo) : new Date(),
  };
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
function BarChart({ data, valueKey, labelKey, color = "#c27d38" }: {
  data: Record<string, number | string>[];
  valueKey: string;
  labelKey: string;
  color?: string;
}) {
  const max = Math.max(...data.map(d => Number(d[valueKey])), 1);
  return (
    <div className="bar-chart">
      {data.map((d, i) => {
        const val = Number(d[valueKey]);
        const pct = (val / max) * 100;
        return (
          <div key={i} className="bar-col">
            <span className="bar-val">{val > 0 ? (val >= 1000 ? `₱${(val/1000).toFixed(1)}k` : val > 99 ? `₱${val}` : val) : ""}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ height: `${pct}%`, background: color }} />
            </div>
            <span className="bar-label">{String(d[labelKey])}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ values, color = "#c27d38" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const w = 120; const h = 36; const pts = values.length;
  const points = values.map((v, i) => {
    const x = (i / (pts - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="sparkline" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function OwnerPage() {
  const { orders: liveOrders, loading } = useOrders();
  const [pinInput, setPinInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [range, setRange] = useState<RangeKey>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [activeTab, setActiveTab] = useState<"overview"|"items"|"hourly"|"orders">("overview");
  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [backupCount, setBackupCount] = useState(0);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Load local backup on mount
  useEffect(() => {
    const local = loadFromLocalStorage();
    setLocalOrders(local);
    setLastBackup(localStorage.getItem("brewco_last_backup"));
  }, []);

  // Auto-save to localStorage whenever live orders update
  useEffect(() => {
    if (liveOrders.length > 0) {
      const count = saveToLocalStorage(liveOrders);
      setBackupCount(count);
      setLastBackup(new Date().toISOString());
    }
  }, [liveOrders]);

  // Merge live + local (local fills gaps when offline)
  const allOrders = useMemo(() => {
    const liveIds = new Set(liveOrders.map(o => o.id));
    const offlineOnly = localOrders.filter(o => !liveIds.has(o.id));
    return [...liveOrders, ...offlineOnly];
  }, [liveOrders, localOrders]);

  const { from, to } = getRange(range, customFrom, customTo);
  const filtered = useMemo(() => filterByRange(allOrders, from, to), [allOrders, from, to]);

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);
  const totalOrders = filtered.length;
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const totalItems = filtered.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0);

  const dailyStats = useMemo(() => getDailyStats(filtered), [filtered]);
  const hourlyStats = useMemo(() => getHourlyStats(filtered), [filtered]);
  const itemStats = useMemo(() => getItemStats(filtered), [filtered]);
  const payStats = useMemo(() => getPaymentStats(filtered), [filtered]);

  // Sparkline data for stat cards (last 7 days)
  const last7 = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0,0,0,0);
      return d;
    });
    return days.map(d => {
      const key = d.toISOString().slice(0, 10);
      const match = dailyStats.find(ds => ds.date === key);
      return match?.revenue ?? 0;
    });
  }, [dailyStats]);

  // PIN handlers
  const handlePinKey = (digit: string) => {
    const next = pinInput + digit;
    setPinInput(next);
    setPinError(false);
    if (next.length === 4) {
      if (next === OWNER_PIN) setUnlocked(true);
      else { setPinError(true); setTimeout(() => setPinInput(""), 600); }
    }
  };

  // Exports
  const handleExportCSV = () => {
    const csv = ordersToCSV(allOrders);
    const date = new Date().toISOString().slice(0,10);
    downloadFile(csv, `brewco-orders-${date}.csv`, "text/csv");
    setShowExportMenu(false);
  };
  const handleExportJSON = () => {
    downloadFile(JSON.stringify(allOrders, null, 2), `brewco-orders-${new Date().toISOString().slice(0,10)}.json`, "application/json");
    setShowExportMenu(false);
  };
  const handleExportLocal = () => {
    const local = loadFromLocalStorage();
    downloadFile(JSON.stringify(local, null, 2), `brewco-local-backup-${new Date().toISOString().slice(0,10)}.json`, "application/json");
    setShowExportMenu(false);
  };
  const handleManualBackup = () => {
    const count = saveToLocalStorage(liveOrders);
    setBackupCount(count);
    setLastBackup(new Date().toISOString());
    alert(`✅ Backed up ${count} orders to local storage`);
  };

  // ── PIN Screen ───────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="owner-pin-page">
        <div className="owner-pin-card">
          <div className="owner-pin-brand">
            <span>☕</span>
            <h1>Brew & Co.</h1>
            <p>Owner Dashboard</p>
          </div>
          <div className={`pin-dots ${pinError ? "shake" : ""}`}>
            {[0,1,2,3].map(i => (
              <div key={i} className={`pin-dot ${i < pinInput.length ? "filled" : ""} ${pinError ? "error" : ""}`} />
            ))}
          </div>
          {pinError && <p className="pin-error">Incorrect PIN</p>}
          <div className="pin-keypad">
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
              <button key={i} className={`pin-key ${k === "" ? "empty" : ""}`}
                onClick={() => { if (k === "⌫") setPinInput(p => p.slice(0,-1)); else if (k) handlePinKey(k); }}
                disabled={!k}>{k}</button>
            ))}
          </div>
          <a href="/" className="owner-back-link">← Back to POS</a>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  return (
    <div className="owner-page">
      {/* Header */}
      <header className="owner-header">
        <div className="owner-header-left">
          <span className="owner-logo">☕</span>
          <div>
            <h1 className="owner-title">Owner Dashboard</h1>
            <span className="owner-subtitle">Brew & Co. Sales Monitor</span>
          </div>
        </div>
        <div className="owner-header-right">
          <div className="backup-status">
            <span className={`backup-dot ${liveOrders.length > 0 ? "online" : "offline"}`} />
            <span className="backup-label">{liveOrders.length > 0 ? "Live" : "Offline"}</span>
            {lastBackup && (
              <span className="backup-time">
                Saved {new Date(lastBackup).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <button className="owner-backup-btn" onClick={handleManualBackup}>💾 Backup Now</button>
          <div className="export-wrap">
            <button className="owner-export-btn" onClick={() => setShowExportMenu(v => !v)}>
              ⬇ Export ▾
            </button>
            {showExportMenu && (
              <div className="export-menu">
                <button onClick={handleExportCSV}>📊 Download CSV</button>
                <button onClick={handleExportJSON}>📄 Download JSON (Online)</button>
                <button onClick={handleExportLocal}>💾 Download Local Backup</button>
              </div>
            )}
          </div>
          <a href="/" className="owner-pos-link">← POS</a>
        </div>
      </header>

      {/* Date Range */}
      <div className="owner-range-bar">
        <div className="range-tabs">
          {([["today","Today"],["week","Last 7 Days"],["month","Last 30 Days"],["custom","Custom"]] as [RangeKey,string][]).map(([k,l]) => (
            <button key={k} className={`range-tab ${range === k ? "active" : ""}`} onClick={() => setRange(k)}>{l}</button>
          ))}
        </div>
        {range === "custom" && (
          <div className="custom-range">
            <input type="date" className="date-input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            <span className="date-sep">to</span>
            <input type="date" className="date-input" value={customTo} onChange={e => setCustomTo(e.target.value)} />
          </div>
        )}
        <span className="range-info">{filtered.length} completed orders in range</span>
      </div>

      {/* KPI Cards */}
      <div className="owner-kpis">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-icon">💰</span>
            <Sparkline values={last7} color="#c27d38" />
          </div>
          <span className="kpi-value">₱{totalRevenue.toLocaleString()}</span>
          <span className="kpi-label">Total Revenue</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-icon">🧾</span>
            <Sparkline values={last7.map((v,i) => dailyStats[i]?.orders ?? 0)} color="#7a8c6e" />
          </div>
          <span className="kpi-value">{totalOrders}</span>
          <span className="kpi-label">Completed Orders</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-icon">📈</span></div>
          <span className="kpi-value">₱{avgOrder.toLocaleString()}</span>
          <span className="kpi-label">Avg Order Value</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-icon">☕</span></div>
          <span className="kpi-value">{totalItems}</span>
          <span className="kpi-label">Items Sold</span>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-icon">💾</span></div>
          <span className="kpi-value">{backupCount || localOrders.length}</span>
          <span className="kpi-label">Orders Backed Up</span>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="owner-tabs">
        {([["overview","📊 Overview"],["items","☕ Items"],["hourly","⏰ Hourly"],["orders","🧾 Orders"]] as const).map(([k,l]) => (
          <button key={k} className={`owner-tab ${activeTab === k ? "active" : ""}`} onClick={() => setActiveTab(k)}>{l}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="owner-content">

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="owner-grid">
            {/* Revenue Chart */}
            <div className="owner-card wide">
              <div className="owner-card-header">
                <h3>Revenue by Day</h3>
                <span className="card-sub">Completed orders only</span>
              </div>
              {dailyStats.length === 0 ? (
                <div className="owner-empty">No data for this range</div>
              ) : (
                <BarChart
                  data={dailyStats.map(d => ({ label: d.date.slice(5), val: d.revenue }))}
                  valueKey="val" labelKey="label" color="#c27d38"
                />
              )}
            </div>

            {/* Payment Breakdown */}
            <div className="owner-card">
              <div className="owner-card-header"><h3>Payment Methods</h3></div>
              {payStats.length === 0 ? <div className="owner-empty">No data</div> : (
                <div className="pay-stats">
                  {payStats.map((p) => {
                    const pct = totalRevenue > 0 ? Math.round((p.total / totalRevenue) * 100) : 0;
                    const emoji = p.method === "cash" ? "💵" : p.method === "card" ? "💳" : "📱";
                    return (
                      <div key={p.method} className="pay-stat-row">
                        <div className="pay-stat-left">
                          <span className="pay-stat-emoji">{emoji}</span>
                          <div>
                            <span className="pay-stat-name">{p.method.toUpperCase()}</span>
                            <span className="pay-stat-count">{p.count} orders</span>
                          </div>
                        </div>
                        <div className="pay-stat-right">
                          <span className="pay-stat-amount">₱{p.total.toLocaleString()}</span>
                          <div className="pay-stat-bar-wrap">
                            <div className="pay-stat-bar" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="pay-stat-pct">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daily Table */}
            <div className="owner-card">
              <div className="owner-card-header"><h3>Daily Breakdown</h3></div>
              {dailyStats.length === 0 ? <div className="owner-empty">No data</div> : (
                <table className="owner-table">
                  <thead><tr><th>Date</th><th>Orders</th><th>Revenue</th><th>Avg</th></tr></thead>
                  <tbody>
                    {[...dailyStats].reverse().map(d => (
                      <tr key={d.date}>
                        <td>{new Date(d.date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", weekday: "short" })}</td>
                        <td className="td-center">{d.orders}</td>
                        <td className="td-amount">₱{d.revenue.toLocaleString()}</td>
                        <td className="td-muted">₱{d.avgOrder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ITEMS TAB */}
        {activeTab === "items" && (
          <div className="owner-grid">
            <div className="owner-card wide">
              <div className="owner-card-header">
                <h3>Items by Revenue</h3>
                <span className="card-sub">Top {Math.min(itemStats.length, 10)} items</span>
              </div>
              {itemStats.length === 0 ? <div className="owner-empty">No data</div> : (
                <BarChart
                  data={itemStats.slice(0,10).map(it => ({ label: it.name.split(" ")[0], val: it.revenue }))}
                  valueKey="val" labelKey="label" color="#7a8c6e"
                />
              )}
            </div>
            <div className="owner-card wide">
              <div className="owner-card-header"><h3>All Items Performance</h3></div>
              {itemStats.length === 0 ? <div className="owner-empty">No sales data</div> : (
                <table className="owner-table">
                  <thead><tr><th>Item</th><th>Sold</th><th>Revenue</th><th>% of Sales</th></tr></thead>
                  <tbody>
                    {itemStats.map((it, i) => {
                      const pct = totalRevenue > 0 ? ((it.revenue / totalRevenue) * 100).toFixed(1) : "0";
                      return (
                        <tr key={it.id}>
                          <td><span className="item-emoji-sm">{it.emoji}</span> {it.name}</td>
                          <td className="td-center">{it.sold}</td>
                          <td className="td-amount">₱{it.revenue.toLocaleString()}</td>
                          <td>
                            <div className="pct-bar-wrap">
                              <div className="pct-bar" style={{ width: `${pct}%` }} />
                              <span className="pct-label">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* HOURLY TAB */}
        {activeTab === "hourly" && (
          <div className="owner-grid">
            <div className="owner-card wide">
              <div className="owner-card-header">
                <h3>Revenue by Hour</h3>
                <span className="card-sub">All days in range combined</span>
              </div>
              <BarChart
                data={hourlyStats.filter(h => h.hour >= 5 && h.hour <= 22).map(h => ({
                  label: h.hour === 0 ? "12a" : h.hour < 12 ? `${h.hour}a` : h.hour === 12 ? "12p" : `${h.hour-12}p`,
                  val: h.revenue
                }))}
                valueKey="val" labelKey="label" color="#c27d38"
              />
            </div>
            <div className="owner-card">
              <div className="owner-card-header"><h3>Peak Hours</h3></div>
              {filtered.length === 0 ? <div className="owner-empty">No data</div> : (
                <table className="owner-table">
                  <thead><tr><th>Hour</th><th>Orders</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {[...hourlyStats]
                      .filter(h => h.orders > 0)
                      .sort((a, b) => b.revenue - a.revenue)
                      .slice(0, 10)
                      .map(h => (
                        <tr key={h.hour}>
                          <td>{h.hour === 0 ? "12:00 AM" : h.hour < 12 ? `${h.hour}:00 AM` : h.hour === 12 ? "12:00 PM" : `${h.hour-12}:00 PM`}</td>
                          <td className="td-center">{h.orders}</td>
                          <td className="td-amount">₱{h.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="owner-card">
              <div className="owner-card-header"><h3>Orders by Hour</h3></div>
              <BarChart
                data={hourlyStats.filter(h => h.hour >= 5 && h.hour <= 22).map(h => ({
                  label: h.hour === 0 ? "12a" : h.hour < 12 ? `${h.hour}a` : h.hour === 12 ? "12p" : `${h.hour-12}p`,
                  val: h.orders
                }))}
                valueKey="val" labelKey="label" color="#4a9b7a"
              />
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="owner-grid">
            <div className="owner-card wide">
              <div className="owner-card-header">
                <h3>All Orders</h3>
                <span className="card-sub">{allOrders.length} total • {filtered.length} in range</span>
              </div>
              <table className="owner-table orders-full-table">
                <thead>
                  <tr>
                    <th>#</th><th>Date</th><th>Time</th><th>Customer</th>
                    <th>Items</th><th>Total</th><th>Payment</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map(o => {
                    const d = o.createdAt instanceof Date ? o.createdAt : new Date();
                    return (
                      <tr key={o.id} className={`status-row-${o.status}`}>
                        <td className="td-num">#{o.orderNumber}</td>
                        <td className="td-muted">{d.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</td>
                        <td className="td-muted">{d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}</td>
                        <td>{o.customerName || "—"}</td>
                        <td className="td-items">{o.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(", ")}</td>
                        <td className="td-amount">₱{o.total}</td>
                        <td><span className="pay-badge">{o.paymentMethod}</span></td>
                        <td><span className={`table-status status-${o.status}`}>{o.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
