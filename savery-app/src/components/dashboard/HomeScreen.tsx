"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./HomeScreen.module.css";
import { demoTransactions, demoCommitments } from "@/lib/demoData";
import {
  buildMonthSnapshot,
  formatINR,
  formatDate,
  getGreeting,
  getCategoryIcon,
  getBucketColor,
  getBucketLabel,
  topCategories,
} from "@/lib/helpers";
import type { Commitment, Transaction } from "@/lib/types";
import CanISpendModal from "./CanISpendModal";
import LogCashModal from "./LogCashModal";
import CSVUploadModal from "./CSVUploadModal";

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showCanISpend, setShowCanISpend] = useState(false);
  const [showLogCash, setShowLogCash] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      const [profileRes, commitRes, txnRes] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("user_id", uid).single(),
        supabase.from("user_commitments").select("*").eq("user_id", uid),
        supabase.from("transactions").select("*").eq("user_id", uid).order("date", { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (commitRes.data) setCommitments(commitRes.data);
      setTransactions(txnRes.data && txnRes.data.length > 0 ? txnRes.data : demoTransactions);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const income = profile?.monthly_income || 105000;
  const activeCommitments = commitments.length > 0 ? commitments : demoCommitments;

  const snapshot = useMemo(
    () => buildMonthSnapshot(income, activeCommitments, transactions),
    [income, activeCommitments, transactions]
  );

  const top3 = useMemo(() => topCategories(snapshot.categories, 3), [snapshot.categories]);
  const totalSpent = snapshot.totalSpent;

  // Safe-to-spend color
  const safeColor =
    snapshot.safeToSpend > 1500
      ? styles.safeAmountGreen
      : snapshot.safeToSpend > 500
        ? styles.safeAmountYellow
        : styles.safeAmountRed;

  // Recent 5 transactions sorted by date
  const recentTxns = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [transactions]
  );

  const userName = profile?.full_name || "there";

  if (loading) {
    return (
      <div className={styles.screen} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #2A2A2A', borderTopColor: 'var(--lime-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', boxShadow: '0 0 16px rgba(200,241,0,0.2)' }} />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.greetingBlock}>
          <p className={styles.greeting}>{getGreeting()}</p>
          <h1 className={styles.userName}>{userName}</h1>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} aria-label="Profile" onClick={() => router.push("/dashboard/profile")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Safe-to-Spend */}
      <div className={styles.safeCard}>
        <p className={styles.safeLabel}>Safe to spend today</p>
        <p className={`${styles.safeAmount} ${safeColor}`}>
          {formatINR(snapshot.safeToSpend)}
        </p>
        <p className={styles.safeSubtext}>
          You&apos;ve spent {formatINR(totalSpent)} of {formatINR(income)} this month.
        </p>
      </div>

      {/* Month Snapshot — Bucket Breakdown */}
      <div className={styles.snapshotCard}>
        <h2 className={styles.sectionTitle}>This Month</h2>
        <div className={styles.bucketBar}>
          {(["fixed", "essential", "discretionary"] as const).map((bucket) => {
            const val =
              bucket === "fixed"
                ? snapshot.fixedTotal
                : bucket === "essential"
                  ? snapshot.essentialTotal
                  : snapshot.discretionaryTotal;
            const pct = totalSpent > 0 ? (val / totalSpent) * 100 : 0;
            return (
              <div
                key={bucket}
                className={styles.bucketSegment}
                style={{
                  width: `${pct}%`,
                  background:
                    bucket === "fixed"
                      ? "var(--text-primary)"
                      : bucket === "essential"
                        ? "color-mix(in srgb, var(--text-primary) 55%, transparent)"
                        : "color-mix(in srgb, var(--text-primary) 25%, transparent)",
                }}
              />
            );
          })}
        </div>
        <div className={styles.bucketLegend}>
          {(["fixed", "essential", "discretionary"] as const).map((bucket) => {
            const val =
              bucket === "fixed"
                ? snapshot.fixedTotal
                : bucket === "essential"
                  ? snapshot.essentialTotal
                  : snapshot.discretionaryTotal;
            return (
              <div key={bucket} className={styles.legendItem}>
                <div className={styles.legendDot} style={{
                  background:
                    bucket === "fixed"
                      ? "var(--text-primary)"
                      : bucket === "essential"
                        ? "color-mix(in srgb, var(--text-primary) 55%, transparent)"
                        : "color-mix(in srgb, var(--text-primary) 25%, transparent)",
                }} />
                <span className={styles.legendLabel}>{getBucketLabel(bucket)}</span>
                <span className={styles.legendAmount}>{formatINR(val)}</span>
              </div>
            );
          })}
        </div>
      </div>

        <div className={styles.quickActions}>
          <button className={styles.quickAction} onClick={() => setShowLogCash(true)}>
            <span className={styles.quickActionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="14" rx="3" />
                <path d="M2 10h20" />
                <path d="M6 15h4" />
              </svg>
            </span>
            <span className={styles.quickActionLabel}>Log Cash</span>
          </button>
          <button className={styles.quickAction} onClick={() => setShowCanISpend(true)}>
            <span className={styles.quickActionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <span className={styles.quickActionLabel}>Can I Afford?</span>
          </button>
          <button className={styles.quickAction} onClick={() => setShowCSVUpload(true)}>
            <span className={styles.quickActionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
            <span className={styles.quickActionLabel}>Import CSV</span>
          </button>
          <button className={styles.quickAction} onClick={() => router.push("/dashboard/spending")}>
            <span className={styles.quickActionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            <span className={styles.quickActionLabel}>Spending</span>
          </button>
        </div>

      {/* Featured Insight */}
      {top3.length > 0 && (
        <div className={styles.insightCard}>
          <div className={styles.insightHeader}>
            <span className={styles.insightIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6" />
                <path d="M10 22h4" />
                <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L15 17H9l-.7-2C6.3 13.7 5 11.5 5 9a7 7 0 0 1 7-7z" />
              </svg>
            </span>
            <span className={styles.insightBadge}>Insight</span>
          </div>
          <p className={styles.insightText}>
            Your top spending category is{" "}
            <span className={styles.insightAccent}>
              {top3[0].category} ({formatINR(top3[0].total)})
            </span>
            {" "}— that&apos;s {top3[0].percentage}% of your total spend this month.
          </p>
        </div>
      )}

      {/* Recent Transactions */}
      <div className={styles.recentSection}>
        <div className={styles.recentHeader}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
            Recent
          </h2>
          <button className={styles.viewAllBtn} onClick={() => router.push("/dashboard/spending")}>
            View all →
          </button>
        </div>
        <div className={styles.txnList}>
          {recentTxns.map((t) => (
            <div key={t.id} className={styles.txnItem}>
              <div className={styles.txnIcon}>{getCategoryIcon(t.category)}</div>
              <div className={styles.txnInfo}>
                <p className={styles.txnMerchant}>{t.merchant}</p>
                <p className={styles.txnCategory}>{t.sub_category}</p>
              </div>
              <div className={styles.txnRight}>
                <p className={styles.txnAmount}>-{formatINR(t.amount)}</p>
                <p className={styles.txnDate}>{formatDate(t.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Modals */}
      <CanISpendModal
        isOpen={showCanISpend}
        onClose={() => setShowCanISpend(false)}
        monthlyIncome={income}
        commitments={activeCommitments}
        transactions={transactions}
      />
      {userId && (
        <LogCashModal
          isOpen={showLogCash}
          onClose={() => setShowLogCash(false)}
          onSaved={loadData}
          userId={userId}
        />
      )}
      {userId && (
        <CSVUploadModal
          isOpen={showCSVUpload}
          onClose={() => setShowCSVUpload(false)}
          onImported={(count) => { loadData(); }}
          userId={userId}
        />
      )}
    </div>
  );
}
