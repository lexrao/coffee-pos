"use client";
import { Order } from "@/types";
import { updateOrderStatus } from "@/lib/firestore";

interface Props {
  orders: Order[];
  loading: boolean;
}

const STATUS_FLOW: Order["status"][] = ["pending", "preparing", "ready", "completed"];
const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};
const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "status-pending",
  preparing: "status-preparing",
  ready: "status-ready",
  completed: "status-completed",
  cancelled: "status-cancelled",
};

function nextStatus(s: Order["status"]): Order["status"] | null {
  const idx = STATUS_FLOW.indexOf(s);
  return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
}

export default function OrdersPanel({ orders, loading }: Props) {
  const active = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const done = orders.filter((o) => o.status === "completed" || o.status === "cancelled");

  if (loading) return <div className="orders-loading">Loading orders…</div>;

  return (
    <div className="orders-panel">
      <section className="orders-section">
        <h2 className="orders-section-title">Active Orders <span className="orders-count">{active.length}</span></h2>
        {active.length === 0 && <p className="orders-empty">No active orders</p>}
        <div className="orders-grid">
          {active.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </section>

      <section className="orders-section">
        <h2 className="orders-section-title">Completed</h2>
        <div className="orders-grid">
          {done.slice(0, 10).map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </section>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const next = nextStatus(order.status);
  const time = order.createdAt instanceof Date
    ? order.createdAt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`order-card ${STATUS_COLORS[order.status]}`}>
      <div className="order-card-header">
        <span className="order-number">#{order.orderNumber}</span>
        {order.customerName && <span className="order-customer">{order.customerName}</span>}
        <span className="order-time">{time}</span>
        <span className={`order-status-badge ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>
      <ul className="order-items-list">
        {order.items.map((item, i) => (
          <li key={i} className="order-item-row">
            <span>{item.menuItem.emoji} {item.menuItem.name}</span>
            <span>×{item.quantity}</span>
          </li>
        ))}
      </ul>
      <div className="order-card-footer">
        <span className="order-total">₱{order.total}</span>
        <span className="order-payment">{order.paymentMethod}</span>
        {next && (
          <button
            className="order-advance-btn"
            onClick={() => updateOrderStatus(order.id, next)}
          >
            → {STATUS_LABELS[next]}
          </button>
        )}
        {order.status !== "cancelled" && order.status !== "completed" && (
          <button
            className="order-cancel-btn"
            onClick={() => updateOrderStatus(order.id, "cancelled")}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
