/* ── Savery Core Types ── */

export type Persona = "salaried" | "freelancer" | "family";

export type SpendingBucket = "fixed" | "essential" | "discretionary";

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  monthly_income: number;
  persona: Persona;
  commitments: Commitment[];
  onboarding_complete: boolean;
  created_at: string;
}

export interface Commitment {
  label: string;
  amount: number;
  category: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  merchant: string;
  category: string;
  sub_category: string;
  date: string;            // ISO string
  source: "bank" | "upi" | "cash" | "card" | "demo";
  is_cash: boolean;
  notes?: string;
  bucket: SpendingBucket;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
  bucket: SpendingBucket;
  transactions: Transaction[];
}

export interface MonthSnapshot {
  totalSpent: number;
  totalIncome: number;
  safeToSpend: number;
  categories: CategorySummary[];
  fixedTotal: number;
  essentialTotal: number;
  discretionaryTotal: number;
}
