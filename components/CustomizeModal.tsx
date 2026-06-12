"use client";
import { useState } from "react";
import {
  MenuItem,
  Customization,
  CupSize,
  Temperature,
  Extra,
  EXTRAS,
  CUP_SIZE_PRICE,
  calcItemPrice,
} from "@/types";

interface Props {
  item: MenuItem;
  onConfirm: (customization: Customization) => void;
  onClose: () => void;
}

export default function CustomizeModal({ item, onConfirm, onClose }: Props) {
  // cold-only drinks default to iced; everything else defaults to hot
  const defaultTemp: Temperature = item.allowHotIce === false && item.category !== "pastry" ? "iced" : "hot";
  const [temperature, setTemperature] = useState<Temperature>(defaultTemp);
  const [size, setSize] = useState<CupSize>("medium");
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [notes, setNotes] = useState("");

  const toggleExtra = (extra: Extra) => {
    setSelectedExtras((prev) =>
      prev.find((e) => e.id === extra.id)
        ? prev.filter((e) => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const customization: Customization = { temperature, size, extras: selectedExtras, notes };
  const totalPrice = calcItemPrice(item, customization);

  const sizes: { key: CupSize; label: string; sub: string }[] = [
    { key: "small", label: "Small", sub: "8oz" },
    { key: "medium", label: "Medium", sub: "12oz +₱20" },
    { key: "large", label: "Large", sub: "16oz +₱40" },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-emoji">{item.emoji}</span>
            <div>
              <h2 className="modal-title">{item.name}</h2>
              <p className="modal-desc">{item.description}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Hot / Iced — show for all drinks except pastry */}
          {item.category !== "pastry" && (
            <section className="modal-section">
              <h3 className="modal-section-title">Temperature</h3>
              {item.allowHotIce === false ? (
                <div className="temp-locked">
                  <span className="temp-locked-badge">🧊 Iced Only</span>
                  <span className="temp-locked-note">This drink is served cold only</span>
                </div>
              ) : (
                <div className="temp-toggle">
                  <button
                    className={`temp-btn ${temperature === "hot" ? "active hot" : ""}`}
                    onClick={() => setTemperature("hot")}
                  >
                    🔥 Hot
                  </button>
                  <button
                    className={`temp-btn ${temperature === "iced" ? "active iced" : ""}`}
                    onClick={() => setTemperature("iced")}
                  >
                    🧊 Iced
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Cup Size */}
          {item.category !== "pastry" && (
            <section className="modal-section">
              <h3 className="modal-section-title">Cup Size</h3>
              <div className="size-options">
                {sizes.map((s) => (
                  <button
                    key={s.key}
                    className={`size-btn ${size === s.key ? "active" : ""}`}
                    onClick={() => setSize(s.key)}
                  >
                    <span className="size-cup">{s.key === "small" ? "🥛" : s.key === "medium" ? "☕" : "🫗"}</span>
                    <span className="size-label">{s.label}</span>
                    <span className="size-sub">{s.sub}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Extras / Add-ons */}
          {item.category !== "pastry" && (
            <section className="modal-section">
              <h3 className="modal-section-title">Add-ons</h3>
              <div className="extras-grid">
                {EXTRAS.map((extra) => {
                  const selected = !!selectedExtras.find((e) => e.id === extra.id);
                  return (
                    <button
                      key={extra.id}
                      className={`extra-btn ${selected ? "active" : ""}`}
                      onClick={() => toggleExtra(extra)}
                    >
                      <span className="extra-label">{extra.label}</span>
                      <span className="extra-price">+₱{extra.price}</span>
                      {selected && <span className="extra-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Notes */}
          <section className="modal-section">
            <h3 className="modal-section-title">Special Instructions</h3>
            <textarea
              className="notes-input"
              placeholder="e.g. less sugar, extra hot, no foam..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </section>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="modal-price-breakdown">
            <span className="modal-base-price">Base ₱{item.price}</span>
            {CUP_SIZE_PRICE[size] > 0 && (
              <span className="modal-addon">+ Size ₱{CUP_SIZE_PRICE[size]}</span>
            )}
            {selectedExtras.map((e) => (
              <span key={e.id} className="modal-addon">+ {e.label} ₱{e.price}</span>
            ))}
          </div>
          <button className="modal-add-btn" onClick={() => onConfirm(customization)}>
            Add to Order — ₱{totalPrice}
          </button>
        </div>
      </div>
    </div>
  );
}
