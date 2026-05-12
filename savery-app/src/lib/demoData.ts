/* ── Demo Transactions — Realistic Indian spending data ── */

import { Transaction, Commitment } from "./types";

const DEMO_USER_ID = "demo-user";

// Generate a date in the current month
function d(day: number): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), day).toISOString();
}

export const demoCommitments: Commitment[] = [
  { label: "Rent", amount: 20000, category: "Bills & Utilities" },
  { label: "SIP – Mutual Fund", amount: 15000, category: "Financial" },
  { label: "Broadband", amount: 999, category: "Bills & Utilities" },
];

export const demoTransactions: Transaction[] = [
  // ── Fixed Commitments ──
  { id: "t1",  user_id: DEMO_USER_ID, amount: 20000, merchant: "Landlord – Rent",         category: "Bills & Utilities",    sub_category: "Rent",              date: d(1),  source: "bank",  is_cash: false, bucket: "fixed" },
  { id: "t2",  user_id: DEMO_USER_ID, amount: 15000, merchant: "HDFC AMC – SIP",           category: "Financial",            sub_category: "Investments",       date: d(5),  source: "bank",  is_cash: false, bucket: "fixed" },
  { id: "t3",  user_id: DEMO_USER_ID, amount: 999,   merchant: "Jio Fiber",                category: "Bills & Utilities",    sub_category: "Internet",          date: d(3),  source: "upi",   is_cash: false, bucket: "fixed" },
  { id: "t4",  user_id: DEMO_USER_ID, amount: 649,   merchant: "Netflix",                  category: "Entertainment",        sub_category: "Subscriptions",     date: d(4),  source: "card",  is_cash: false, bucket: "fixed" },
  { id: "t5",  user_id: DEMO_USER_ID, amount: 119,   merchant: "Spotify",                  category: "Entertainment",        sub_category: "Subscriptions",     date: d(4),  source: "card",  is_cash: false, bucket: "fixed" },

  // ── Essential Variable ──
  { id: "t6",  user_id: DEMO_USER_ID, amount: 3200,  merchant: "BigBasket",                category: "Food & Dining",        sub_category: "Groceries",         date: d(2),  source: "upi",   is_cash: false, bucket: "essential" },
  { id: "t7",  user_id: DEMO_USER_ID, amount: 2800,  merchant: "Zepto",                    category: "Food & Dining",        sub_category: "Groceries",         date: d(9),  source: "upi",   is_cash: false, bucket: "essential" },
  { id: "t8",  user_id: DEMO_USER_ID, amount: 1500,  merchant: "Blinkit",                  category: "Food & Dining",        sub_category: "Groceries",         date: d(16), source: "upi",   is_cash: false, bucket: "essential" },
  { id: "t9",  user_id: DEMO_USER_ID, amount: 2200,  merchant: "Shell Fuel",               category: "Transport",            sub_category: "Fuel",              date: d(6),  source: "card",  is_cash: false, bucket: "essential" },
  { id: "t10", user_id: DEMO_USER_ID, amount: 850,   merchant: "Ola",                      category: "Transport",            sub_category: "Ride-sharing",      date: d(7),  source: "upi",   is_cash: false, bucket: "essential" },
  { id: "t11", user_id: DEMO_USER_ID, amount: 650,   merchant: "Ola",                      category: "Transport",            sub_category: "Ride-sharing",      date: d(14), source: "upi",   is_cash: false, bucket: "essential" },
  { id: "t12", user_id: DEMO_USER_ID, amount: 1800,  merchant: "BESCOM – Electricity",     category: "Bills & Utilities",    sub_category: "Electricity",       date: d(10), source: "upi",   is_cash: false, bucket: "essential" },
  { id: "t13", user_id: DEMO_USER_ID, amount: 499,   merchant: "Airtel",                   category: "Bills & Utilities",    sub_category: "Mobile",            date: d(8),  source: "upi",   is_cash: false, bucket: "essential" },
  { id: "t14", user_id: DEMO_USER_ID, amount: 1200,  merchant: "Apollo Pharmacy",          category: "Health & Wellness",    sub_category: "Medical",           date: d(11), source: "upi",   is_cash: false, bucket: "essential" },

  // ── Discretionary ──
  { id: "t15", user_id: DEMO_USER_ID, amount: 580,   merchant: "Swiggy",                   category: "Food & Dining",        sub_category: "Food Delivery",     date: d(3),  source: "upi",   is_cash: false, bucket: "discretionary" },
  { id: "t16", user_id: DEMO_USER_ID, amount: 420,   merchant: "Zomato",                   category: "Food & Dining",        sub_category: "Food Delivery",     date: d(5),  source: "upi",   is_cash: false, bucket: "discretionary" },
  { id: "t17", user_id: DEMO_USER_ID, amount: 750,   merchant: "Swiggy",                   category: "Food & Dining",        sub_category: "Food Delivery",     date: d(8),  source: "upi",   is_cash: false, bucket: "discretionary" },
  { id: "t18", user_id: DEMO_USER_ID, amount: 380,   merchant: "Zomato",                   category: "Food & Dining",        sub_category: "Food Delivery",     date: d(11), source: "upi",   is_cash: false, bucket: "discretionary" },
  { id: "t19", user_id: DEMO_USER_ID, amount: 620,   merchant: "Swiggy",                   category: "Food & Dining",        sub_category: "Food Delivery",     date: d(14), source: "upi",   is_cash: false, bucket: "discretionary" },
  { id: "t20", user_id: DEMO_USER_ID, amount: 890,   merchant: "Swiggy",                   category: "Food & Dining",        sub_category: "Food Delivery",     date: d(18), source: "upi",   is_cash: false, bucket: "discretionary" },
  { id: "t21", user_id: DEMO_USER_ID, amount: 3500,  merchant: "Third Wave Coffee",        category: "Food & Dining",        sub_category: "Dining Out",        date: d(7),  source: "card",  is_cash: false, bucket: "discretionary" },
  { id: "t22", user_id: DEMO_USER_ID, amount: 2200,  merchant: "Social Bangalore",         category: "Food & Dining",        sub_category: "Dining Out",        date: d(13), source: "card",  is_cash: false, bucket: "discretionary" },
  { id: "t23", user_id: DEMO_USER_ID, amount: 8500,  merchant: "Amazon",                   category: "Shopping",             sub_category: "Online Shopping",   date: d(6),  source: "card",  is_cash: false, bucket: "discretionary" },
  { id: "t24", user_id: DEMO_USER_ID, amount: 2400,  merchant: "Myntra",                   category: "Shopping",             sub_category: "Fashion",           date: d(12), source: "card",  is_cash: false, bucket: "discretionary" },
  { id: "t25", user_id: DEMO_USER_ID, amount: 1500,  merchant: "Decathlon",                category: "Shopping",             sub_category: "General Retail",    date: d(15), source: "card",  is_cash: false, bucket: "discretionary" },
  { id: "t26", user_id: DEMO_USER_ID, amount: 350,   merchant: "PVR Cinemas",              category: "Entertainment",        sub_category: "Movies",            date: d(10), source: "upi",   is_cash: false, bucket: "discretionary" },
  { id: "t27", user_id: DEMO_USER_ID, amount: 2000,  merchant: "Cult.fit",                 category: "Health & Wellness",    sub_category: "Fitness",           date: d(1),  source: "upi",   is_cash: false, bucket: "discretionary" },

  // ── Cash transactions ──
  { id: "t28", user_id: DEMO_USER_ID, amount: 500,   merchant: "Vegetable Market",         category: "Food & Dining",        sub_category: "Groceries",         date: d(3),  source: "cash",  is_cash: true,  bucket: "essential" },
  { id: "t29", user_id: DEMO_USER_ID, amount: 200,   merchant: "Auto Rickshaw",            category: "Transport",            sub_category: "Public Transport",  date: d(5),  source: "cash",  is_cash: true,  bucket: "essential" },
  { id: "t30", user_id: DEMO_USER_ID, amount: 150,   merchant: "Street Food",              category: "Food & Dining",        sub_category: "Snacks",            date: d(7),  source: "cash",  is_cash: true,  bucket: "discretionary" },
  { id: "t31", user_id: DEMO_USER_ID, amount: 300,   merchant: "Auto Rickshaw",            category: "Transport",            sub_category: "Public Transport",  date: d(9),  source: "cash",  is_cash: true,  bucket: "essential" },
  { id: "t32", user_id: DEMO_USER_ID, amount: 2000,  merchant: "Household Help – Maid",    category: "Bills & Utilities",    sub_category: "Maintenance",       date: d(1),  source: "cash",  is_cash: true,  bucket: "essential" },
  { id: "t33", user_id: DEMO_USER_ID, amount: 250,   merchant: "Chai & Snacks",            category: "Food & Dining",        sub_category: "Snacks",            date: d(11), source: "cash",  is_cash: true,  bucket: "discretionary" },
  { id: "t34", user_id: DEMO_USER_ID, amount: 400,   merchant: "Parking",                  category: "Transport",            sub_category: "Parking",           date: d(13), source: "cash",  is_cash: true,  bucket: "essential" },
  { id: "t35", user_id: DEMO_USER_ID, amount: 1500,  merchant: "Birthday Gift",            category: "Others",               sub_category: "Gifts & Donations", date: d(15), source: "cash",  is_cash: true,  bucket: "discretionary" },

  // ── More digital transactions ──
  { id: "t36", user_id: DEMO_USER_ID, amount: 299,   merchant: "iCloud Storage",           category: "Entertainment",        sub_category: "Subscriptions",     date: d(2),  source: "card",  is_cash: false, bucket: "fixed" },
  { id: "t37", user_id: DEMO_USER_ID, amount: 450,   merchant: "Starbucks",                category: "Food & Dining",        sub_category: "Coffee & Snacks",   date: d(9),  source: "upi",   is_cash: false, bucket: "discretionary" },
  { id: "t38", user_id: DEMO_USER_ID, amount: 350,   merchant: "Starbucks",                category: "Food & Dining",        sub_category: "Coffee & Snacks",   date: d(16), source: "upi",   is_cash: false, bucket: "discretionary" },
  { id: "t39", user_id: DEMO_USER_ID, amount: 1800,  merchant: "Uber",                     category: "Transport",            sub_category: "Ride-sharing",      date: d(17), source: "upi",   is_cash: false, bucket: "essential" },
  { id: "t40", user_id: DEMO_USER_ID, amount: 5000,  merchant: "Reliance Digital",         category: "Shopping",             sub_category: "Electronics",       date: d(18), source: "card",  is_cash: false, bucket: "discretionary" },
];
