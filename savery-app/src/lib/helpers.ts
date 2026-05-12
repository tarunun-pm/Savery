/* ── Savery Calculation Helpers ── */

import { Transaction, CategorySummary, MonthSnapshot, Commitment, SpendingBucket } from "./types";

/**
 * Group transactions by category and compute totals
 */
export function groupByCategory(transactions: Transaction[]): CategorySummary[] {
  const map = new Map<string, { total: number; count: number; bucket: SpendingBucket; txns: Transaction[] }>();

  transactions.forEach((t) => {
    const existing = map.get(t.category);
    if (existing) {
      existing.total += t.amount;
      existing.count += 1;
      existing.txns.push(t);
    } else {
      map.set(t.category, { total: t.amount, count: 1, bucket: t.bucket, txns: [t] });
    }
  });

  const grandTotal = transactions.reduce((s, t) => s + t.amount, 0);

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: grandTotal > 0 ? Math.round((data.total / grandTotal) * 100) : 0,
      bucket: data.bucket,
      transactions: data.txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Calculate Safe-to-Spend for the remaining days in the month
 */
export function calcSafeToSpend(
  monthlyIncome: number,
  commitments: Commitment[],
  transactions: Transaction[]
): number {
  const totalCommitted = commitments.reduce((s, c) => s + c.amount, 0);
  const totalSpent = transactions
    .filter((t) => t.bucket !== "fixed")
    .reduce((s, t) => s + t.amount, 0);

  const discretionaryBudget = monthlyIncome - totalCommitted;
  const remaining = discretionaryBudget - totalSpent;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate() + 1;

  return Math.max(0, Math.round(remaining / daysLeft));
}

/**
 * Get total spending for the current month
 */
export function getMonthlyTotal(transactions: Transaction[]): number {
  return transactions.reduce((s, t) => s + t.amount, 0);
}

/**
 * Generate a month snapshot from transactions
 */
export function buildMonthSnapshot(
  monthlyIncome: number,
  commitments: Commitment[],
  transactions: Transaction[]
): MonthSnapshot {
  const categories = groupByCategory(transactions);
  const totalSpent = getMonthlyTotal(transactions);
  const safeToSpend = calcSafeToSpend(monthlyIncome, commitments, transactions);

  const fixedTotal = transactions.filter((t) => t.bucket === "fixed").reduce((s, t) => s + t.amount, 0);
  const essentialTotal = transactions.filter((t) => t.bucket === "essential").reduce((s, t) => s + t.amount, 0);
  const discretionaryTotal = transactions.filter((t) => t.bucket === "discretionary").reduce((s, t) => s + t.amount, 0);

  return {
    totalSpent,
    totalIncome: monthlyIncome,
    safeToSpend,
    categories,
    fixedTotal,
    essentialTotal,
    discretionaryTotal,
  };
}

/**
 * Format currency in INR
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to readable string
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Get the top N categories by total spend
 */
export function topCategories(categories: CategorySummary[], n: number = 3): CategorySummary[] {
  return categories.slice(0, n);
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Category icon mapping
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    "Food & Dining": "🍕",
    "Shopping": "🛍️",
    "Transport": "🚗",
    "Bills & Utilities": "🏠",
    "Entertainment": "🎬",
    "Health & Wellness": "💊",
    "Financial": "💰",
    "Others": "📦",
  };
  return icons[category] || "📦";
}

/**
 * Bucket color mapping
 */
export function getBucketColor(bucket: SpendingBucket): string {
  switch (bucket) {
    case "fixed": return "#6366F1";       // indigo
    case "essential": return "#F59E0B";   // amber
    case "discretionary": return "#C8F100"; // lime
  }
}

/**
 * Bucket label mapping
 */
export function getBucketLabel(bucket: SpendingBucket): string {
  switch (bucket) {
    case "fixed": return "Fixed";
    case "essential": return "Essential";
    case "discretionary": return "Discretionary";
  }
}
