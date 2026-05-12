"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./SpendingView.module.css";
import { demoTransactions, demoCommitments } from "@/lib/demoData";
import {
  buildMonthSnapshot,
  formatINR,
  formatDate,
  getCategoryIcon,
  getBucketColor,
  getBucketLabel,
} from "@/lib/helpers";
import type { CategorySummary, SpendingBucket, Transaction, Commitment } from "@/lib/types";

export default function SpendingView() {
  const [search, setSearch] = useState("");
  const [drillCategory, setDrillCategory] = useState<CategorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const userId = session.user.id;

        const [profileRes, commitRes, txnRes] = await Promise.all([
          supabase.from("user_profiles").select("*").eq("user_id", userId).single(),
          supabase.from("user_commitments").select("*").eq("user_id", userId),
          supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false })
        ]);

        if (profileRes.data) setProfile(profileRes.data);
        if (commitRes.data) setCommitments(commitRes.data);
        
        if (txnRes.data && txnRes.data.length > 0) {
          setTransactions(txnRes.data);
        } else {
          setTransactions(demoTransactions);
        }
      } catch (err) {
        console.error("Error loading spending data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const income = profile?.monthly_income || 105000;
  const activeCommitments = commitments.length > 0 ? commitments : demoCommitments;

  const snapshot = useMemo(
    () => buildMonthSnapshot(income, activeCommitments, transactions),
    [income, activeCommitments, transactions]
  );

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return snapshot.categories;
    const q = search.toLowerCase();
    return snapshot.categories.filter(
      (c) =>
        c.category.toLowerCase().includes(q) ||
        c.transactions.some((t) => t.merchant.toLowerCase().includes(q))
    );
  }, [snapshot.categories, search]);

  const buckets: { key: SpendingBucket; total: number }[] = [
    { key: "fixed", total: snapshot.fixedTotal },
    { key: "essential", total: snapshot.essentialTotal },
    { key: "discretionary", total: snapshot.discretionaryTotal },
  ];

  const now = new Date();
  const monthName = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className={styles.screen} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ width: 40, height: 40, border: '4px solid var(--gray-border)', borderTopColor: 'var(--lime-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Spending</h1>
        <p className={styles.subtitle}>{monthName}</p>
      </div>

      {/* Total */}
      <div className={styles.totalCard}>
        <p className={styles.totalLabel}>Total Spent</p>
        <p className={styles.totalAmount}>{formatINR(snapshot.totalSpent)}</p>
        <p className={styles.totalSub}>
          of {formatINR(income)} income
        </p>
      </div>

      {/* Bucket Breakdown */}
      <div className={styles.bucketSection}>
        <h2 className={styles.sectionTitle}>Breakdown</h2>
        <div className={styles.bucketRows}>
          {buckets.map(({ key, total }) => {
            const pct = snapshot.totalSpent > 0 ? (total / snapshot.totalSpent) * 100 : 0;
            return (
              <div key={key} className={styles.bucketRow}>
                <div className={styles.bucketDot} style={{ background: getBucketColor(key) }} />
                <div className={styles.bucketInfo}>
                  <p className={styles.bucketLabel}>{getBucketLabel(key)}</p>
                  <div className={styles.bucketBarWrap}>
                    <div
                      className={styles.bucketBarFill}
                      style={{ width: `${pct}%`, background: getBucketColor(key) }}
                    />
                  </div>
                </div>
                <span className={styles.bucketAmount}>{formatINR(total)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drilldown */}
      {drillCategory && (
        <div className={styles.drilldown}>
          <div className={styles.drilldownHeader}>
            <h3 className={styles.drilldownTitle}>
              {getCategoryIcon(drillCategory.category)} {drillCategory.category}
            </h3>
            <button className={styles.drilldownClose} onClick={() => setDrillCategory(null)}>
              ✕ Close
            </button>
          </div>
          {drillCategory.transactions.map((t) => (
            <div key={t.id} className={styles.txnItem}>
              <span className={styles.txnMerchant}>
                {t.merchant}
                {t.is_cash && <span className={styles.cashBadge}>CASH</span>}
              </span>
              <span className={styles.txnAmount}>{formatINR(t.amount)}</span>
              <span className={styles.txnDate}>{formatDate(t.date)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Categories */}
      <div className={styles.categorySection}>
        <h2 className={styles.sectionTitle}>By Category</h2>

        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search categories or merchants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.categoryList}>
          {filteredCategories.map((cat) => (
            <div
              key={cat.category}
              className={styles.categoryItem}
              onClick={() => setDrillCategory(cat)}
            >
              <div className={styles.categoryIcon}>{getCategoryIcon(cat.category)}</div>
              <div className={styles.categoryInfo}>
                <p className={styles.categoryName}>{cat.category}</p>
                <p className={styles.categoryMeta}>
                  {cat.count} transaction{cat.count !== 1 ? "s" : ""}
                </p>
              </div>
              <div className={styles.categoryRight}>
                <p className={styles.categoryAmount}>{formatINR(cat.total)}</p>
                <p className={styles.categoryPct}>{cat.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
