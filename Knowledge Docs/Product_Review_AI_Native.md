# Savery — AI-Native Product Review
**Date:** May 2026  
**Platform Decision:** Native Android App (confirmed)  
**Status:** Sprint 2 complete — informs Sprint 3+ roadmap

---

## Where We Stand

---

## ✅ What Savery Already Solves

### 1. The Safe-to-Spend Problem
Traditional apps show you **what you spent**. Savery shows you **what you can still spend** — right now, today. The Safe-to-Spend number on the home screen is a fundamentally different mental model. It answers the actual question in a user's head at the point of spending.

### 2. The Month-End Surprise Problem
By showing spending categories in real-time, users get a continuous signal instead of a monthly shock. The dashboard breakdown (Fixed / Essential / Discretionary) gives users a structural view of where money goes, not just a transaction list.

### 3. The "Why Did I Overspend?" Problem
The AI Insights engine (Gemini) doesn't just report numbers — it contextualizes them. *"Your top spending category is Health & Wellness — 71% of total spend"* is a directional signal a traditional app just doesn't generate.

### 4. The Fragmented Data Problem (Partially)
CSV import and manual cash logging reduce the effort of data unification. Users with bank statements can get a full picture without connecting live bank accounts.

### 5. The "Can I Afford This?" Problem
The Can I Afford modal gives an in-the-moment verdict based on live financial data, not just a static budget. This is decision support at the right moment.

### 6. The Analysis Paralysis Problem
Lemon (the AI chatbot) gives users a conversational interface to ask financial questions instead of hunting through charts. "How much did I spend on food this month?" is a natural question — now it has a direct answer.

---

## ❌ What Savery Still Doesn't Solve

### 🔴 CRITICAL: The Input Friction Problem
> **This is the #1 reason people abandon finance apps within 7 days.**

Users are expected to:
- Import a CSV manually
- Or tap "Log Cash" every time they spend

Nobody does this consistently. Real spending has 30–50 transactions per month. Even 3 taps per transaction = 150 taps a month just to keep data fresh. The app is brilliant at analyzing data it doesn't have.

### 🟠 The Real-Time Balance Problem
Savery calculates safe-to-spend from **entered income minus entered commitments minus logged transactions**. It doesn't know the user's actual bank balance. If a user has an unexpected debit or their salary came in, Savery is working with stale data.

### 🟡 The ATM/Cash Blindspot
30–40% of Indian household spending is cash. Even if users log CSV data, cash transactions don't appear in bank statements. The "Log Cash" feature helps, but it requires the user to remember and act.

### 🟡 The Subscription Ghost Problem
Netflix, Spotify, gym memberships — these auto-debit silently. Unless the user adds them as Fixed Commitments manually, Savery has no awareness of them changing, auto-renewing, or being cancelled.

### 🟡 The Goals Gap
There is currently no way to set a savings goal and see if current behavior will achieve it. A user who wants to save ₹50,000 for a trip has no feedback loop in the product.

### 🟠 The Multi-Account View
Most Indian users have 2–3 accounts (savings, salary, credit card). Savery sees income and spending as single-pool numbers. It cannot say "your HDFC account is low — but you have ₹15,000 in your SBI account."

### 🟡 The Behavioral Loop Gap
Insights are great — but there's no action attached to them. Seeing "you spend too much on food delivery" doesn't change behavior unless there's a friction mechanism (limit, nudge, goal) tied to it.

---

## 🆚 Savery vs Traditional Finance Tracking Apps

| Dimension | Traditional Apps (Walnut, Money Manager) | **Savery** |
|---|---|---|
| **Core output** | "You spent ₹8,000 on Food" | "You can safely spend ₹1,200 today" |
| **User role** | Accountant — logs everything | Passenger — gets insight automatically |
| **Intelligence** | Rule-based categories | Gemini-powered contextual analysis |
| **Decision support** | None — backward looking only | Real-time "Can I Afford?" engine |
| **Time orientation** | Past (what happened) | Present + Future (what can I do now) |
| **Conversation** | None | Lemon — natural language financial guide |
| **Data capture** | Manual / bank sync | CSV + Manual (SMS via native Android planned) |
| **Tone** | Neutral ledger | Empathetic guide |
| **Budget model** | Fixed monthly budget | Dynamic safe-to-spend (adjusts daily) |
| **Behavioral insight** | None | AI identifies spending patterns |

**The core distinction:** Traditional apps are **rearview mirrors**. Savery is designed to be a **co-pilot** — present at the moment of decision, not just at the end of the month.

---

## 🎯 The #1 Unsolved Problem — Zero-Friction Data Capture

> *"User doesn't want to log every transaction. The system should be able to read messages and distribute amount based on intent, or ask user simply where the money was spent."*

This is the **single biggest risk to user retention** in the product.

### The Problem Precisely

In India, almost every financial transaction generates a message:
- **Bank SMS:** `"₹500 debited from A/C XX1234 at Swiggy. Bal ₹24,500"`
- **UPI SMS:** `"₹200 sent to Rapido via UPI. Ref 3847"`
- **ATM SMS:** `"₹5000 withdrawn from ATM. Bal ₹19,500"`

This data **already exists on the user's phone**. The user has done nothing wrong. The system is just not reading it.

### Why Native Android Unlocks This

The web app (Next.js) **cannot** access SMS. A native Android app can request `READ_SMS` permission, which:
- Runs as a background service
- Receives new SMS events in real time
- Parses financial messages on-device (privacy-first)
- Sends only structured JSON to the Savery backend — never raw SMS text

This is the core architectural reason to build native Android.

---

## 🏗️ Three-Tier Solution Architecture for Data Capture

### Tier 1 — SMS Auto-Parsing (Android) ⭐ Highest Impact

On Android, the app requests `READ_SMS` and `RECEIVE_SMS` permissions. With this:
- Parse every inbound SMS matching financial patterns
- Extract: amount, merchant/channel, transaction type, remaining balance
- Auto-categorize using Gemini API (merchant name → category)
- Add to Savery's transaction feed — **zero user action required**

**What the Gemini layer does:**
```
Input SMS:  "₹500 debited from A/C XX1234 at SWIGGY. Bal ₹24,500"

Gemini output:
{
  amount: 500,
  merchant: "Swiggy",
  category: "Food & Dining",
  subcategory: "Food Delivery",
  bucket: "discretionary",
  balance_after: 24500,
  confidence: 0.97
}
```

**Privacy architecture:**
- All SMS parsing runs on-device (no raw SMS ever sent to server)
- Only structured JSON is synced to Supabase
- User sees and can edit every parsed transaction before it's "confirmed"
- Opt-in with a clear, trustworthy consent screen:
  > *"Savery reads your bank messages to auto-track spending. Your messages never leave your device."*

**Estimated user impact:** Moves data completeness from ~20% to ~85% for Android users.

---

### Tier 2 — Smart Prompt on Ambiguous / Cash Transactions

When a transaction can't be auto-categorized, or after an ATM withdrawal is detected, Lemon sends a notification prompt:

> *"You withdrew ₹5,000 at Punjab National Bank ATM. Where did it go?"*  
> `[Groceries]` `[Transport]` `[Split it]` `[Skip]`

**Design principles:**
- One tap to complete — never a form
- Shown within 1–4 hours of the event (not immediately — let the moment pass)
- User can say "Ask me later" or "Don't track this"
- For split cash: simple amount splitter UI (₹3,000 Groceries, ₹2,000 Transport)

**For unclear UPI transfers (person-to-person):**
> *"You sent ₹1,200 to Rahul via UPI. Was this a personal transfer or an expense?"*  
> `[Personal transfer — ignore]` `[It was an expense →]`

---

### Tier 3 — Weekly Confirmation Sweep (Lemon Sunday Check-in)

Every Sunday evening, Lemon presents a 30-second sweep:

> *"Here's your week. I auto-tracked ₹12,400 across 18 transactions. These 3 need your input:"*
>
> - `₹800` — Cash (no context) → `[Assign category]`
> - `₹1,200` — UPI to "Ravi" → `[Personal?]` `[Expense?]`
> - `₹500` — ATM (unlogged) → `[Where did it go?]`

The user reviews **exceptions only** — not the full transaction list. This is the 10-second engagement model.

---

## 📐 The "AI-Native" Standard — What It Means for Savery

Savery claims to be AI-native. To earn that label, every core flow must pass this test:

> **"Could this exist without AI?"**

| Feature | Without AI | With AI (current Sprint 2) | Truly AI-Native (Sprint 3+) |
|---|---|---|---|
| Spending summary | Yes (any ledger) | Gemini narrative insight ✅ | Real-time from auto-parsed SMS |
| Can I Afford? | Yes (basic math) | Contextual verdict ✅ | Predictive — knows upcoming bills |
| Chat (Lemon) | No | Gemini-powered ✅ | + Proactive Lemon nudges |
| Categories | Yes (manual tagging) | Manual currently | Zero-input via SMS auto-parse |
| Alerts | Yes (rule-based) | Pattern-based (planned) | Timing-optimized by behavior |
| Data capture | Manual 150 taps/month | Manual 150 taps/month ❌ | Automatic from SMS — 0 taps |

**The honest assessment:** Savery's current AI lives at the *insight* layer (analyzing data that's been entered). To be truly AI-native, the AI must also operate at the *capture* layer — reading signals the user never explicitly provided.

---

## 🛣️ Prioritized Sprint Roadmap

### Sprint 3A — Strengthen the Web App (Current)
| Task | Priority |
|---|---|
| Goals Tab — savings goals + progress | High |
| InsightsView dark mode + tokenization | Done ✅ |
| Design system polish (Acumin Pro, light/dark) | Done ✅ |
| Behavioral limits (soft spending alerts) | Medium |

### Sprint 3B — Native Android App Foundation
| Task | Details |
|---|---|
| Kotlin / Jetpack Compose app scaffold | Mirror web app UI in native |
| Supabase auth on Android | Same backend, native SDK |
| SMS permission consent screen | Privacy-first, opt-in |
| `SmsReceiver` broadcast listener | Captures new SMS in real-time |
| On-device regex SMS parser | Pattern-match bank/UPI/ATM formats |
| Gemini API categorization call | Merchant → category with confidence |
| Transaction review UI | User sees parsed txns, edits, confirms |

### Sprint 3C — Smart Prompts + Lemon Native
| Task | Details |
|---|---|
| ATM smart prompt notification | Lemon asks where cash was spent |
| UPI ambiguity prompt | Personal transfer vs expense |
| Lemon as Android widget | Quick access from home screen |
| Weekly Sunday sweep notification | Confirm unclassified transactions |

### Sprint 3D — Multi-Account + Goals Wiring
| Task | Details |
|---|---|
| Multiple account setup | HDFC + SBI + Credit Card |
| Per-account balance tracking from SMS | `Bal ₹X` extraction |
| Goals wired to spending | "₹8K/month needed to hit Goa trip" |
| What-If Simulator | "What if I cut Swiggy by 50%?" |

---

## 🔑 What Makes This System Unbreakable

| Pillar | Current State | Target State |
|---|---|---|
| **Data completeness** | ~20% (manual only) | ~85% (SMS auto-parse) |
| **AI intelligence** | Insights on entered data | Insights on real-time, auto-captured data |
| **Conversation** | Lemon — reactive | Lemon — proactive nudges + native widget |
| **Decision support** | Can I Afford? | + Predictive bill calendar, multi-account aware |
| **Behavioral loop** | Insights only | Goals + limits + weekly pulse |
| **Trust** | Privacy-stated | On-device processing, explicit consent UX |

> **The single move that changes everything:**  
> SMS auto-parsing on Android. This eliminates the input problem that kills 90% of finance apps. Every other intelligent feature in Savery becomes exponentially more valuable when the underlying data is automatically complete and current.

---

*Last updated: May 2026 — Sprint 2 complete, Sprint 3 planning*
