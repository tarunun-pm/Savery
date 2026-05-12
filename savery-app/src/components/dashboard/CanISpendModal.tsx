"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./CanISpendModal.module.css";
import { formatINR } from "@/lib/helpers";
import type { Commitment, Transaction } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  monthlyIncome: number;
  commitments: Commitment[];
  transactions: Transaction[];
}

type Verdict = "yes" | "borderline" | "no" | null;

export default function CanISpendModal({ isOpen, onClose, monthlyIncome, commitments, transactions }: Props) {
  const [amount, setAmount] = useState("");
  const [verdict, setVerdict] = useState<Verdict>(null);

  const totalCommitted = commitments.reduce((s, c) => s + c.amount, 0);
  const discretionaryBudget = monthlyIncome - totalCommitted;
  const alreadySpent = transactions
    .filter((t) => t.bucket !== "fixed")
    .reduce((s, t) => s + t.amount, 0);
  const available = Math.max(0, discretionaryBudget - alreadySpent);

  const calculate = useCallback(() => {
    const asked = Number(amount);
    if (!asked || asked <= 0) return;
    if (asked <= available * 0.8) setVerdict("yes");
    else if (asked <= available) setVerdict("borderline");
    else setVerdict("no");
  }, [amount, available]);

  useEffect(() => {
    if (amount) calculate();
    else setVerdict(null);
  }, [amount, calculate]);

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setVerdict(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const asked = Number(amount) || 0;
  const afterSpend = available - asked;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>Can I spend this?</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Amount input */}
        <div className={styles.inputSection}>
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
          <p className={styles.hint}>Enter the amount you want to spend</p>
        </div>

        {/* Verdict */}
        {verdict && (
          <div className={`${styles.verdict} ${styles[`verdict_${verdict}`]}`}>
            <div className={styles.verdictIcon}>
              {verdict === "yes" ? "✅" : verdict === "borderline" ? "⚠️" : "❌"}
            </div>
            <div className={styles.verdictText}>
              {verdict === "yes" && (
                <>
                  <strong>Yes, you can!</strong>
                  <p>You&apos;ll have {formatINR(afterSpend)} left after this spend.</p>
                </>
              )}
              {verdict === "borderline" && (
                <>
                  <strong>Borderline — proceed carefully</strong>
                  <p>This will use nearly all your remaining budget. You&apos;ll have only {formatINR(afterSpend)} left.</p>
                </>
              )}
              {verdict === "no" && (
                <>
                  <strong>Not right now</strong>
                  <p>This exceeds your safe spending limit by {formatINR(asked - available)}.</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Breakdown */}
        <div className={styles.breakdown}>
          <h3 className={styles.breakdownTitle}>How this is calculated</h3>
          <div className={styles.breakdownRows}>
            <div className={styles.breakdownRow}>
              <span className={styles.rowLabel}>Monthly income</span>
              <span className={styles.rowValue}>{formatINR(monthlyIncome)}</span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.rowLabel}>Fixed commitments</span>
              <span className={styles.rowValueNeg}>−{formatINR(totalCommitted)}</span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.rowLabel}>Already spent this month</span>
              <span className={styles.rowValueNeg}>−{formatINR(alreadySpent)}</span>
            </div>
            <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}>
              <span className={styles.rowLabel}>Safe to spend</span>
              <span className={styles.rowValueGreen}>{formatINR(available)}</span>
            </div>
            {asked > 0 && (
              <div className={`${styles.breakdownRow} ${styles.breakdownRowAsked}`}>
                <span className={styles.rowLabel}>You want to spend</span>
                <span className={styles.rowValueNeg}>−{formatINR(asked)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
