"use client";
import { useState, useEffect } from "react";
import { MenuItem } from "@/types";
import { addMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/firestore";

const ADMIN_PIN = "1234"; // Change this to your preferred PIN

const EMOJI_OPTIONS = [
  "☕","🍵","🧋","🥤","🫖","🌼","🫛","🍫","🧊","🥛","🍵","🫗",
  "🥐","🌀","🫐","🍌","🍰","🧁","🥧","🍩","🍪","🥞","🧇","🥨",
];

interface Props {
  items: MenuItem[];
  onClose: () => void;
  onRefresh: () => void;
}

type AdminView = "list" | "add" | "edit";

export default function AdminPanel({ items, onClose, onRefresh }: Props) {
  const [pinInput, setPinInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [view, setView] = useState<AdminView>("list");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<"all" | "coffee" | "tea" | "pastry">("all");

  // Form state
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "coffee" as MenuItem["category"],
    description: "",
    emoji: "☕",
    available: true,
    allowHotIce: true,
  });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handlePinKey = (digit: string) => {
    const next = pinInput + digit;
    setPinInput(next);
    setPinError(false);
    if (next.length === 4) {
      if (next === ADMIN_PIN) {
        setUnlocked(true);
      } else {
        setPinError(true);
        setTimeout(() => setPinInput(""), 600);
      }
    }
  };

  const openAdd = () => {
    setForm({ name: "", price: "", category: "coffee", description: "", emoji: "☕", available: true, allowHotIce: true });
    setEditingItem(null);
    setView("add");
  };

  const openEdit = (item: MenuItem) => {
    setForm({
      name: item.name,
      price: String(item.price),
      category: item.category,
      description: item.description || "",
      emoji: item.emoji,
      available: item.available,
      allowHotIce: item.allowHotIce ?? true,
    });
    setEditingItem(item);
    setView("edit");
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    try {
      const data: Omit<MenuItem, "id"> = {
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category,
        description: form.description.trim(),
        emoji: form.emoji,
        available: form.available,
        allowHotIce: form.category === "pastry" ? false : form.allowHotIce,
      };
      if (view === "edit" && editingItem) {
        await updateMenuItem(editingItem.id, data);
        showSuccess(`"${data.name}" updated ✓`);
      } else {
        await addMenuItem(data);
        showSuccess(`"${data.name}" added ✓`);
      }
      onRefresh();
      setView("list");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await deleteMenuItem(id);
      showSuccess("Item removed ✓");
      onRefresh();
      setConfirmDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    await updateMenuItem(item.id, { available: !item.available });
    onRefresh();
  };

  const filteredItems = items.filter(i => filterCat === "all" || i.category === filterCat);

  // ── PIN Screen ─────────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="admin-backdrop" onClick={onClose}>
        <div className="admin-pin-modal" onClick={e => e.stopPropagation()}>
          <div className="pin-header">
            <span className="pin-icon">🔐</span>
            <h2 className="pin-title">Admin Access</h2>
            <p className="pin-subtitle">Enter your 4-digit PIN</p>
          </div>
          <div className={`pin-dots ${pinError ? "shake" : ""}`}>
            {[0,1,2,3].map(i => (
              <div key={i} className={`pin-dot ${i < pinInput.length ? "filled" : ""} ${pinError ? "error" : ""}`} />
            ))}
          </div>
          {pinError && <p className="pin-error">Incorrect PIN</p>}
          <div className="pin-keypad">
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
              <button
                key={i}
                className={`pin-key ${k === "" ? "empty" : ""}`}
                onClick={() => {
                  if (k === "⌫") setPinInput(p => p.slice(0, -1));
                  else if (k !== "") handlePinKey(k);
                }}
                disabled={k === ""}
              >
                {k}
              </button>
            ))}
          </div>
          <button className="pin-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    );
  }

  // ── Form (Add / Edit) ──────────────────────────────────────────────────────
  if (view === "add" || view === "edit") {
    return (
      <div className="admin-backdrop">
        <div className="admin-modal admin-form-modal">
          <div className="admin-modal-header">
            <h2 className="admin-modal-title">
              {view === "add" ? "➕ Add Menu Item" : `✏️ Edit "${editingItem?.name}"`}
            </h2>
            <button className="admin-modal-close" onClick={() => setView("list")}>✕</button>
          </div>

          <div className="admin-form">
            {/* Emoji picker */}
            <div className="form-group">
              <label className="form-label">Icon</label>
              <div className="emoji-picker">
                {EMOJI_OPTIONS.map(e => (
                  <button
                    key={e}
                    className={`emoji-opt ${form.emoji === e ? "active" : ""}`}
                    onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex2">
                <label className="form-label">Name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Spanish Latte"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Base Price (₱) *</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="e.g. 135"
                  min={0}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                className="form-input"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description of the item"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <div className="form-segmented">
                  {(["coffee","tea","pastry"] as MenuItem["category"][]).map(c => (
                    <button
                      key={c}
                      className={`seg-btn ${form.category === c ? "active" : ""}`}
                      onClick={() => setForm(f => ({ ...f, category: c }))}
                    >
                      {c === "coffee" ? "☕ Coffee" : c === "tea" ? "🍵 Tea" : "🥐 Pastry"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {form.category !== "pastry" && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Temperature</label>
                  <div className="form-segmented">
                    <button
                      className={`seg-btn ${form.allowHotIce ? "active" : ""}`}
                      onClick={() => setForm(f => ({ ...f, allowHotIce: true }))}
                    >
                      🔥🧊 Hot & Iced
                    </button>
                    <button
                      className={`seg-btn ${!form.allowHotIce ? "active" : ""}`}
                      onClick={() => setForm(f => ({ ...f, allowHotIce: false }))}
                    >
                      🧊 Iced Only
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Availability</label>
                  <div className="form-segmented">
                    <button
                      className={`seg-btn ${form.available ? "active" : ""}`}
                      onClick={() => setForm(f => ({ ...f, available: true }))}
                    >
                      ✅ Available
                    </button>
                    <button
                      className={`seg-btn ${!form.available ? "active" : ""}`}
                      onClick={() => setForm(f => ({ ...f, available: false }))}
                    >
                      🚫 Hidden
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="admin-form-footer">
            <button className="admin-cancel-btn" onClick={() => setView("list")}>Cancel</button>
            <button
              className="admin-save-btn"
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.price}
            >
              {saving ? "Saving…" : view === "add" ? "Add Item" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List View ──────────────────────────────────────────────────────────────
  return (
    <div className="admin-backdrop" onClick={onClose}>
      <div className="admin-modal admin-list-modal" onClick={e => e.stopPropagation()}>
        {successMsg && <div className="admin-toast">{successMsg}</div>}

        <div className="admin-modal-header">
          <h2 className="admin-modal-title">⚙️ Admin — Menu Manager</h2>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="admin-list-toolbar">
          <div className="admin-cat-filter">
            {(["all","coffee","tea","pastry"] as const).map(c => (
              <button
                key={c}
                className={`admin-cat-btn ${filterCat === c ? "active" : ""}`}
                onClick={() => setFilterCat(c)}
              >
                {c === "all" ? "All" : c === "coffee" ? "☕" : c === "tea" ? "🍵" : "🥐"}
                {" "}{c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <button className="admin-add-btn" onClick={openAdd}>+ Add Item</button>
        </div>

        <div className="admin-items-list">
          {filteredItems.map(item => (
            <div key={item.id} className={`admin-item-row ${!item.available ? "unavailable" : ""}`}>
              {confirmDelete === item.id ? (
                <div className="admin-confirm-delete">
                  <span>Delete "{item.name}"?</span>
                  <div className="confirm-btns">
                    <button className="confirm-yes" onClick={() => handleDelete(item.id)} disabled={saving}>
                      {saving ? "…" : "Delete"}
                    </button>
                    <button className="confirm-no" onClick={() => setConfirmDelete(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="admin-item-emoji">{item.emoji}</span>
                  <div className="admin-item-info">
                    <span className="admin-item-name">{item.name}</span>
                    <div className="admin-item-meta">
                      <span className="admin-item-cat">{item.category}</span>
                      {item.allowHotIce ? (
                        <span className="admin-tag hotice">🔥🧊</span>
                      ) : item.category !== "pastry" ? (
                        <span className="admin-tag iced">🧊 Iced</span>
                      ) : null}
                      {!item.available && <span className="admin-tag hidden">Hidden</span>}
                    </div>
                  </div>
                  <span className="admin-item-price">₱{item.price}</span>
                  <div className="admin-item-actions">
                    <button
                      className={`admin-toggle-btn ${item.available ? "on" : "off"}`}
                      onClick={() => handleToggleAvailable(item)}
                      title={item.available ? "Hide from menu" : "Show on menu"}
                    >
                      {item.available ? "👁️" : "🚫"}
                    </button>
                    <button className="admin-edit-btn" onClick={() => openEdit(item)}>Edit</button>
                    <button className="admin-delete-btn" onClick={() => setConfirmDelete(item.id)}>🗑️</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="admin-list-footer">
          <span className="admin-count">{filteredItems.length} items</span>
        </div>
      </div>
    </div>
  );
}
