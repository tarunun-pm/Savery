"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./InsightsView.module.css";
import { demoTransactions, demoCommitments } from "@/lib/demoData";
import { buildMonthSnapshot, formatINR, topCategories } from "@/lib/helpers";
import type { Commitment, Transaction } from "@/lib/types";

interface AIInsight {
  type: "info" | "warning" | "tip" | "positive";
  icon: string;
  title: string;
  body: string;
}

export default function InsightsView() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [aiError, setAiError] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadData = useCallback(async () => {
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
      setTransactions(txnRes.data && txnRes.data.length > 0 ? txnRes.data : demoTransactions);
    } catch (err) {
      console.error("Error loading insights data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateAIInsights = useCallback(async (txns: Transaction[], prof: any, comms: Commitment[]) => {
    if (txns.length === 0) return;
    setGenerating(true);
    setAiError("");
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: txns, profile: prof, commitments: comms }),
      });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      setAiInsights(data.insights || []);
    } catch {
      setAiError("Couldn't generate AI insights. Showing standard analysis below.");
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    if (!loading && transactions.length > 0) {
      generateAIInsights(transactions, profile, commitments);
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const income = profile?.monthly_income || 105000;
  const activeCommitments = commitments.length > 0 ? commitments : demoCommitments;
  const snapshot = useMemo(
    () => buildMonthSnapshot(income, activeCommitments, transactions),
    [income, activeCommitments, transactions]
  );
  const top3 = topCategories(snapshot.categories, 3);
  const now = new Date();
  const monthName = now.toLocaleDateString("en-IN", { month: "long" });

  const daySpending = useMemo(() => {
    const days = [0, 0, 0, 0, 0, 0, 0];
    transactions.forEach((t) => { days[new Date(t.date).getDay()] += t.amount; });
    return days;
  }, [transactions]);
  const maxDaySpend = Math.max(...daySpending);
  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const weeklyTrend = useMemo(() => {
    const weeks = [{ label: "W1", amount: 0 }, { label: "W2", amount: 0 }, { label: "W3", amount: 0 }, { label: "W4", amount: 0 }];
    transactions.forEach((t) => {
      const day = new Date(t.date).getDate();
      if (day <= 7) weeks[0].amount += t.amount;
      else if (day <= 14) weeks[1].amount += t.amount;
      else if (day <= 21) weeks[2].amount += t.amount;
      else weeks[3].amount += t.amount;
    });
    return weeks;
  }, [transactions]);
  const maxWeek = Math.max(...weeklyTrend.map((w) => w.amount));

  const leaks = useMemo(() => transactions.filter((t) => t.sub_category === "Subscriptions"), [transactions]);
  const leakTotal = leaks.reduce((s, t) => s + t.amount, 0);

  if (loading) {
    return (
      <div className={styles.screen} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
        <div style={{ width: 40, height: 40, border: "4px solid var(--gray-border)", borderTopColor: "var(--lime-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const insightTypeColors: Record<string, string> = {
    info: "var(--off-white)",
    positive: "#F0FDF4",
    warning: "#FFFBEB",
    tip: "#F0F9FF",
  };
  const insightBorderColors: Record<string, string> = {
    info: "var(--gray-border)",
    positive: "#86EFAC",
    warning: "#FCD34D",
    tip: "#BAE6FD",
  };

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Insights</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--gray-muted)", background: "var(--lime-glow)", border: "1px solid var(--lime-muted)", borderRadius: "var(--radius-pill)", padding: "4px 10px", fontWeight: 600 }}>
            ✨ Gemini AI
          </span>
          <button
            onClick={() => generateAIInsights(transactions, profile, commitments)}
            disabled={generating}
            style={{ background: "var(--off-white)", border: "1px solid var(--gray-border)", borderRadius: "var(--radius-pill)", padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", color: "var(--dark-soft)", display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"
              style={{ animation: generating ? "spin 1s linear infinite" : "none" }}>
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {generating ? "Analyzing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* AI Insights Section */}
      {generating && (
        <div className={styles.generatingBanner}>
          <div className={styles.generatingDots}><span /><span /><span /></div>
          <p>Gemini is reading your spending patterns...</p>
        </div>
      )}

      {aiError && (
        <div style={{ background: "var(--error-bg)", border: "1px solid #FECACA", borderRadius: "var(--radius-xl)", padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--error)" }}>
          {aiError}
        </div>
      )}

      {!generating && aiInsights.length > 0 && (
        <div className={styles.aiSection}>
          <h2 className={styles.sectionTitle}>AI Analysis</h2>
          {aiInsights.map((insight, i) => (
            <div key={i} style={{
              background: insightTypeColors[insight.type] || "var(--off-white)",
              border: `1px solid ${insightBorderColors[insight.type] || "var(--gray-border)"}`,
              borderRadius: "var(--radius-xl)",
              padding: "16px",
              marginBottom: 12,
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              animation: "fadeIn 300ms ease forwards",
              animationDelay: `${i * 80}ms`,
              opacity: 0,
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{insight.icon}</span>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--dark)", marginBottom: 4 }}>{insight.title}</h3>
                <p style={{ fontSize: 13, color: "var(--dark-soft)", lineHeight: 1.5 }}>{insight.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Monthly Story */}
      <div className={styles.storyCard}>
        <div className={styles.storyHeader}>
          <span className={styles.storyEmoji}>📖</span>
          <span className={styles.storyTitle}>Your {monthName} Story</span>
        </div>
        <div className={styles.storyBody}>
          <div className={styles.storyItem}>
            <span className={styles.storyItemEmoji}>💸</span>
            <p className={styles.storyItemText}>
              You spent <span className={styles.storyItemAccent}>{formatINR(snapshot.totalSpent)}</span> this month across {transactions.length} transactions.
            </p>
          </div>
          {top3[0] && (
            <div className={styles.storyItem}>
              <span className={styles.storyItemEmoji}>🍕</span>
              <p className={styles.storyItemText}>
                <span className={styles.storyItemAccent}>{top3[0].category}</span> was your top category at{" "}
                <span className={styles.storyItemAccent}>{formatINR(top3[0].total)}</span> ({top3[0].percentage}% of total).
              </p>
            </div>
          )}
          <div className={styles.storyItem}>
            <span className={styles.storyItemEmoji}>💰</span>
            <p className={styles.storyItemText}>
              Your fixed commitments are <span className={styles.storyItemAccent}>{formatINR(snapshot.fixedTotal)}</span> — stable and predictable.
            </p>
          </div>
          {leaks.length > 0 && (
            <div className={styles.storyItem}>
              <span className={styles.storyItemEmoji}>⚠️</span>
              <p className={styles.storyItemText}>
                You have <span className={styles.storyItemWarn}>{leaks.length} subscriptions</span> totalling{" "}
                <span className={styles.storyItemWarn}>{formatINR(leakTotal)}/month</span>. Review if you still use them all.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Spending by Day Heatmap */}
      <div className={styles.patternCard}>
        <h2 className={styles.sectionTitle}>Spending by Day</h2>
        <div className={styles.heatmapGrid}>
          {dayLabels.map((label) => <span key={label} className={styles.heatmapLabel}>{label}</span>)}
          {daySpending.map((amount, i) => {
            const intensity = maxDaySpend > 0 ? amount / maxDaySpend : 0;
            const bg = intensity > 0.7 ? "rgba(200,241,0,0.9)" : intensity > 0.4 ? "rgba(200,241,0,0.5)" : intensity > 0.1 ? "rgba(200,241,0,0.25)" : "var(--gray-border)";
            return <div key={i} className={styles.heatmapCell} style={{ background: bg }} title={`${dayLabels[i]}: ${formatINR(amount)}`} />;
          })}
        </div>
        <div className={styles.heatmapLegend}>
          <span className={styles.heatmapLegendLabel}>Less</span>
          {["var(--gray-border)", "rgba(200,241,0,0.25)", "rgba(200,241,0,0.5)", "rgba(200,241,0,0.9)"].map((bg, i) => (
            <div key={i} className={styles.heatmapLegendBlock} style={{ background: bg }} />
          ))}
          <span className={styles.heatmapLegendLabel}>More</span>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className={styles.trendCard}>
        <h2 className={styles.sectionTitle}>Weekly Spending</h2>
        <div className={styles.trendBars}>
          {weeklyTrend.map((w) => {
            const pct = maxWeek > 0 ? (w.amount / maxWeek) * 100 : 0;
            return (
              <div key={w.label} className={styles.trendBarWrap}>
                <span className={styles.trendBarAmount}>{formatINR(w.amount)}</span>
                <div className={styles.trendBar} style={{ height: `${Math.max(pct, 5)}%`, background: "linear-gradient(180deg, var(--lime-primary), var(--lime-deep))" }} />
                <span className={styles.trendBarLabel}>{w.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leak Detection */}
      {leaks.length > 0 && (
        <div className={styles.leakCard}>
          <div className={styles.leakHeader}>
            <span className={styles.leakEmoji}>🔍</span>
            <span className={styles.leakTitle}>Subscription Check</span>
            <span className={styles.leakSavings}>{formatINR(leakTotal)}/mo</span>
          </div>
          <div className={styles.leakList}>
            {leaks.map((t) => (
              <div key={t.id} className={styles.leakItem}>
                <span className={styles.leakItemIcon}>🎬</span>
                <div className={styles.leakItemInfo}>
                  <p className={styles.leakItemName}>{t.merchant}</p>
                  <p className={styles.leakItemMeta}>Monthly subscription</p>
                </div>
                <span className={styles.leakItemAmount}>{formatINR(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
