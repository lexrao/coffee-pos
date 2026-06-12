import { Order } from "@/types";

export interface DailyStat {
  date: string; // "YYYY-MM-DD"
  revenue: number;
  orders: number;
  avgOrder: number;
}

export interface HourlyStat {
  hour: number; // 0–23
  revenue: number;
  orders: number;
}

export interface ItemStat {
  id: string;
  name: string;
  emoji: string;
  sold: number;
  revenue: number;
}

export interface PaymentStat {
  method: string;
  total: number;
  count: number;
}

export function filterByRange(orders: Order[], from: Date, to: Date): Order[] {
  const toEnd = new Date(to);
  toEnd.setHours(23, 59, 59, 999);
  return orders.filter((o) => {
    const d = o.createdAt instanceof Date ? o.createdAt : new Date();
    return d >= from && d <= toEnd && o.status === "completed";
  });
}

export function getDailyStats(orders: Order[]): DailyStat[] {
  const map: Record<string, { revenue: number; orders: number }> = {};
  orders.forEach((o) => {
    const d = o.createdAt instanceof Date ? o.createdAt : new Date();
    const key = d.toISOString().slice(0, 10);
    if (!map[key]) map[key] = { revenue: 0, orders: 0 };
    map[key].revenue += o.total;
    map[key].orders += 1;
  });
  return Object.entries(map)
    .map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders, avgOrder: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getHourlyStats(orders: Order[]): HourlyStat[] {
  const map: Record<number, { revenue: number; orders: number }> = {};
  for (let h = 0; h < 24; h++) map[h] = { revenue: 0, orders: 0 };
  orders.forEach((o) => {
    const h = (o.createdAt instanceof Date ? o.createdAt : new Date()).getHours();
    map[h].revenue += o.total;
    map[h].orders += 1;
  });
  return Object.entries(map).map(([h, v]) => ({ hour: Number(h), ...v }));
}

export function getItemStats(orders: Order[]): ItemStat[] {
  const map: Record<string, ItemStat> = {};
  orders.forEach((o) => {
    o.items.forEach((i) => {
      const key = i.menuItem.id;
      if (!map[key]) map[key] = { id: key, name: i.menuItem.name, emoji: i.menuItem.emoji, sold: 0, revenue: 0 };
      map[key].sold += i.quantity;
      map[key].revenue += i.menuItem.price * i.quantity;
    });
  });
  return Object.values(map).sort((a, b) => b.revenue - a.revenue);
}

export function getPaymentStats(orders: Order[]): PaymentStat[] {
  const map: Record<string, { total: number; count: number }> = {};
  orders.forEach((o) => {
    if (!map[o.paymentMethod]) map[o.paymentMethod] = { total: 0, count: 0 };
    map[o.paymentMethod].total += o.total;
    map[o.paymentMethod].count += 1;
  });
  return Object.entries(map).map(([method, v]) => ({ method, ...v }));
}

// ── Export helpers ────────────────────────────────────────────────────────────

export function ordersToCSV(orders: Order[]): string {
  const header = ["Order#", "Date", "Time", "Customer", "Items", "Total", "Payment", "Status"].join(",");
  const rows = orders.map((o) => {
    const d = o.createdAt instanceof Date ? o.createdAt : new Date();
    const items = o.items.map(i => `${i.menuItem.name}x${i.quantity}`).join("; ");
    return [
      o.orderNumber,
      d.toLocaleDateString("en-PH"),
      d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
      `"${o.customerName || ""}"`,
      `"${items}"`,
      o.total,
      o.paymentMethod,
      o.status,
    ].join(",");
  });
  return [header, ...rows].join("\n");
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function saveToLocalStorage(orders: Order[]) {
  try {
    const key = "brewco_orders_backup";
    const existing = JSON.parse(localStorage.getItem(key) || "[]") as Order[];
    const existingIds = new Set(existing.map(o => o.id));
    const newOnes = orders.filter(o => !existingIds.has(o.id));
    const merged = [...existing, ...newOnes];
    localStorage.setItem(key, JSON.stringify(merged));
    localStorage.setItem("brewco_last_backup", new Date().toISOString());
    return merged.length;
  } catch {
    return 0;
  }
}

export function loadFromLocalStorage(): Order[] {
  try {
    const raw = localStorage.getItem("brewco_orders_backup");
    if (!raw) return [];
    return JSON.parse(raw).map((o: Order) => ({ ...o, createdAt: new Date(o.createdAt) }));
  } catch {
    return [];
  }
}
