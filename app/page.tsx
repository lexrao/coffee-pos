"use client";
import { useState, useCallback } from "react";
import { useMenu } from "@/hooks/useMenu";
import { useOrders } from "@/hooks/useOrders";
import { createOrder } from "@/lib/firestore";
import MenuItemCard from "@/components/MenuItemCard";
import Cart from "@/components/Cart";
import CustomizeModal from "@/components/CustomizeModal";
import OrdersPanel from "@/components/OrdersPanel";
import Dashboard from "@/components/Dashboard";
import AdminPanel from "@/components/AdminPanel";
import InstallPrompt from "@/components/InstallPrompt";
import { CartItem, MenuItem, PaymentMethod, Customization, makeCartId } from "@/types";

type Tab = "menu" | "orders" | "dashboard";
type Category = "all" | "coffee" | "tea" | "pastry";

const CATEGORIES: { key: Category; label: string; emoji: string }[] = [
  { key: "all", label: "All", emoji: "🍽️" },
  { key: "coffee", label: "Coffee", emoji: "☕" },
  { key: "tea", label: "Tea", emoji: "🍵" },
  { key: "pastry", label: "Pastry", emoji: "🥐" },
];

export default function Home() {
  const { items, loading: menuLoading, refresh: refreshMenu } = useMenu();
  const { orders, loading: ordersLoading } = useOrders();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tab, setTab] = useState<Tab>("menu");
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleCustomizeConfirm = useCallback((item: MenuItem, customization: Customization) => {
    const cartId = makeCartId(item.id, customization);
    setCart((prev) => {
      const existing = prev.find((c) => c.id === cartId);
      if (existing) return prev.map((c) => c.id === cartId ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: cartId, menuItem: item, quantity: 1, customization }];
    });
    setCustomizingItem(null);
    showToast(`${item.name} added ✓`);
  }, []);

  const removeItemFromCart = useCallback((cartId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== cartId));
  }, []);

  const handleCheckout = async (method: PaymentMethod, name: string) => {
    setCheckoutLoading(true);
    try {
      await createOrder(cart, method, name);
      setCart([]);
      showToast("Order placed! ✓");
      setTab("orders");
    } catch (e) {
      showToast("Error placing order. Check Firebase config.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filtered = items.filter((item) => {
    const catMatch = category === "all" || item.category === category;
    const searchMatch = item.name.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch && item.available;
  });

  const activeOrderCount = orders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled"
  ).length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-logo">☕</span>
          <span className="header-name">Brew & Co.</span>
        </div>
        <nav className="header-nav">
          {(["menu", "orders", "dashboard"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`nav-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "menu" ? "Menu"
                : t === "orders" ? `Orders${activeOrderCount > 0 ? ` (${activeOrderCount})` : ""}`
                : "Dashboard"}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <span className="header-date">
            {new Date().toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })}
          </span>
          <button className="admin-nav-btn" onClick={() => setShowAdmin(true)} title="Admin Panel">
            ⚙️ Admin
          </button>
        </div>
      </header>

      {toast && <div className="toast">{toast}</div>}

      <InstallPrompt />

      {customizingItem && (
        <CustomizeModal
          item={customizingItem}
          onConfirm={(customization) => handleCustomizeConfirm(customizingItem, customization)}
          onClose={() => setCustomizingItem(null)}
        />
      )}

      {showAdmin && (
        <AdminPanel
          items={items}
          onClose={() => setShowAdmin(false)}
          onRefresh={refreshMenu}
        />
      )}

      <main className="app-main">
        {tab === "menu" && (
          <div className="menu-layout">
            <div className="menu-area">
              <div className="menu-filters">
                <div className="category-tabs">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      className={`cat-tab ${category === c.key ? "active" : ""}`}
                      onClick={() => setCategory(c.key)}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
                <input
                  className="search-input"
                  placeholder="Search menu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {menuLoading ? (
                <div className="menu-loading">
                  <div className="loading-spinner" />
                  <p>Loading menu…</p>
                </div>
              ) : (
                <div className="menu-grid">
                  {filtered.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      cartItems={cart.filter((c) => c.menuItem.id === item.id)}
                      onCustomize={setCustomizingItem}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <div className="menu-empty">No items found</div>
                  )}
                </div>
              )}
            </div>

            <Cart
              cart={cart}
              onRemove={removeItemFromCart}
              onClear={() => setCart([])}
              onCheckout={handleCheckout}
              loading={checkoutLoading}
            />
          </div>
        )}

        {tab === "orders" && <OrdersPanel orders={orders} loading={ordersLoading} />}
        {tab === "dashboard" && <Dashboard orders={orders} />}
      </main>
    </div>
  );
}
