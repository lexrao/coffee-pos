"use client";
import { CartItem, PaymentMethod, calcItemPrice } from "@/types";
import { useState } from "react";

interface Props {
  cart: CartItem[];
  onRemove: (cartId: string) => void;
  onClear: () => void;
  onCheckout: (method: PaymentMethod, name: string) => void;
  loading: boolean;
}

export default function Cart({ cart, onRemove, onClear, onCheckout, loading }: Props) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [name, setName] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);

  const total = cart.reduce((s, i) => s + calcItemPrice(i.menuItem, i.customization) * i.quantity, 0);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = () => {
    onCheckout(method, name);
    setName("");
    setShowCheckout(false);
  };

  return (
    <aside className="cart">
      <div className="cart-header">
        <h2 className="cart-title">Order</h2>
        {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        {cart.length > 0 && (
          <button className="cart-clear" onClick={onClear}>Clear</button>
        )}
      </div>

      <div className="cart-items">
        {cart.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon">☕</span>
            <p>No items yet</p>
            <p className="cart-empty-hint">Tap any item to customize</p>
          </div>
        ) : (
          cart.map((ci) => {
            const linePrice = calcItemPrice(ci.menuItem, ci.customization) * ci.quantity;
            const { temperature, size, extras, notes } = ci.customization;
            return (
              <div key={ci.id} className="cart-item">
                <span className="cart-item-emoji">{ci.menuItem.emoji}</span>
                <div className="cart-item-info">
                  <span className="cart-item-name">{ci.menuItem.name}</span>
                  <div className="cart-item-tags">
                    {temperature && (
                      <span className={`cart-tag ${temperature}`}>
                        {temperature === "hot" ? "🔥" : "🧊"} {temperature}
                      </span>
                    )}
                    <span className="cart-tag size">{size.toUpperCase()}</span>
                    {extras.map((e) => (
                      <span key={e.id} className="cart-tag extra">{e.label}</span>
                    ))}
                  </div>
                  {notes && <span className="cart-item-notes">"{notes}"</span>}
                  <span className="cart-item-qty">×{ci.quantity}</span>
                </div>
                <span className="cart-item-price">₱{linePrice}</span>
                <button className="cart-item-remove" onClick={() => onRemove(ci.id)}>×</button>
              </div>
            );
          })
        )}
      </div>

      {cart.length > 0 && (
        <div className="cart-footer">
          <div className="cart-total">
            <span>Total</span>
            <span className="cart-total-value">₱{total}</span>
          </div>

          {showCheckout ? (
            <div className="checkout-panel">
              <input
                className="customer-name-input"
                placeholder="Customer name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="payment-methods">
                {(["cash", "card", "gcash"] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    className={`payment-btn ${method === m ? "active" : ""}`}
                    onClick={() => setMethod(m)}
                  >
                    {m === "cash" ? "💵 Cash" : m === "card" ? "💳 Card" : "📱 GCash"}
                  </button>
                ))}
              </div>
              <div className="checkout-actions">
                <button className="cancel-btn" onClick={() => setShowCheckout(false)}>Back</button>
                <button className="confirm-btn" onClick={handleCheckout} disabled={loading}>
                  {loading ? "Processing..." : `Confirm ₱${total}`}
                </button>
              </div>
            </div>
          ) : (
            <button className="checkout-btn" onClick={() => setShowCheckout(true)}>
              Checkout →
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
