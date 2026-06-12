"use client";
import { MenuItem, CartItem } from "@/types";

interface Props {
  item: MenuItem;
  cartItems: CartItem[];
  onCustomize: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, cartItems, onCustomize }: Props) {
  const totalQty = cartItems.reduce((s, c) => s + c.quantity, 0);
  const isPastry = item.category === "pastry";

  return (
    <div
      className={`menu-card ${totalQty > 0 ? "in-cart" : ""}`}
      onClick={() => onCustomize(item)}
    >
      <div className="menu-card-emoji">{item.emoji}</div>
      <div className="menu-card-info">
        <h3 className="menu-card-name">{item.name}</h3>
        {item.description && <p className="menu-card-desc">{item.description}</p>}
        <div className="menu-card-meta">
          <span className="menu-card-price">from ₱{item.price}</span>
          {!isPastry && (
            <div className="menu-temp-badges">
              {item.allowHotIce !== false ? (
                <>
                  <span className="temp-badge hot">🔥 Hot</span>
                  <span className="temp-badge iced">🧊 Iced</span>
                </>
              ) : (
                <span className="temp-badge iced">🧊 Iced only</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="menu-card-actions">
        {totalQty > 0 ? (
          <div className="in-cart-badge">
            <span className="in-cart-qty">{totalQty} in order</span>
            <span className="in-cart-edit">+ Add more</span>
          </div>
        ) : (
          <button
            className="add-btn"
            onClick={(e) => { e.stopPropagation(); onCustomize(item); }}
          >
            Customize +
          </button>
        )}
      </div>
    </div>
  );
}
