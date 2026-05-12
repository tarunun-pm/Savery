"use client";

import { useState } from "react";
import styles from "./LogCashModal.module.css";
import { supabase } from "@/lib/supabase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
}

const CATEGORIES = [
  { label: "Food & Dining", icon: "🍕" },
  { label: "Transport", icon: "🚗" },
  { label: "Shopping", icon: "🛍️" },
  { label: "Health & Wellness", icon: "💊" },
  { label: "Bills & Utilities", icon: "🏠" },
  { label: "Entertainment", icon: "🎬" },
  { label: "Others", icon: "📦" },
];

export default function LogCashModal({ isOpen, onClose, onSaved, userId }: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [merchant, setMerchant] = useState("");
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const reset = () => {
    setAmount("");
    setCategory("");
    setMerchant("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!amount || !category) {
      setError("Please enter an amount and select a category.");
      return;
    }
    setSaving(true);
    setError("");

    const bucket =
      category === "Bills & Utilities" || category === "Financial" ? "essential"
      : category === "Transport" || category === "Health & Wellness" ? "essential"
      : "discretionary";

    const { error: dbErr } = await supabase.from("transactions").insert({
      user_id: userId,
      amount: Number(amount),
      merchant: merchant.trim() || category,
      category,
      sub_category: category,
      date: new Date().toISOString(),
      source: "cash",
      is_cash: true,
      bucket,
    });

    setSaving(false);
    if (dbErr) {
      setError("Failed to save. Please try again.");
    } else {
      reset();
      onSaved();
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>Log Cash Spend</h2>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Amount */}
        <div className={styles.amountWrapper}>
          <span className={styles.rupee}>₹</span>
          <input
            className={styles.amountInput}
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>

        {/* Merchant (optional) */}
        <input
          className={styles.merchantInput}
          type="text"
          placeholder="Where did you spend? (optional)"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
        />

        {/* Category */}
        <p className={styles.sectionLabel}>What was it for?</p>
        <div className={styles.categoryGrid}>
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              className={`${styles.categoryBtn} ${category === c.label ? styles.categorySelected : ""}`}
              onClick={() => setCategory(c.label)}
            >
              <span className={styles.categoryIcon}>{c.icon}</span>
              <span className={styles.categoryLabel}>{c.label}</span>
            </button>
          ))}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "💾 Log Cash Spend"}
        </button>
      </div>
    </div>
  );
}
