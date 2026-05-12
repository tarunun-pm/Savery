"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./OnboardingFlow.module.css";
import type { Persona, Commitment } from "@/lib/types";

type DataSource = "csv" | "skip" | null;

const DEFAULT_COMMITMENTS: Commitment[] = [
  { label: "Rent", amount: 0, category: "Bills & Utilities" },
  { label: "SIP – Mutual Fund", amount: 0, category: "Financial" },
];

export default function OnboardingFlow() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState(1);

  // Step 1: Welcome
  const [persona, setPersona] = useState<Persona | null>(null);

  // Step 2: Quick Setup
  const [income, setIncome] = useState("");
  const [commitments, setCommitments] = useState<Commitment[]>(DEFAULT_COMMITMENTS);

  // Step 3: Data
  const [dataSource, setDataSource] = useState<DataSource>(null);

  const [loading, setLoading] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const addCommitment = () => {
    setCommitments([...commitments, { label: "", amount: 0, category: "Others" }]);
  };

  const removeCommitment = (idx: number) => {
    setCommitments(commitments.filter((_, i) => i !== idx));
  };

  const updateCommitment = (idx: number, field: "label" | "amount", value: string) => {
    setCommitments(
      commitments.map((c, i) =>
        i === idx
          ? { ...c, [field]: field === "amount" ? Number(value) || 0 : value }
          : c
      )
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const userId = session.user.id;

      // 1. Save Profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          full_name: session.user.user_metadata?.full_name || "",
          monthly_income: Number(income) || 0,
          persona: persona,
          onboarding_complete: true,
        });

      if (profileError) throw profileError;

      // 2. Save Commitments (if any)
      const validCommitments = commitments
        .filter((c) => c.label && c.amount > 0)
        .map((c) => ({
          user_id: userId,
          label: c.label,
          amount: c.amount,
          category: c.category,
        }));

      if (validCommitments.length > 0) {
        const { error: commitError } = await supabase
          .from("user_commitments")
          .insert(validCommitments);
        
        if (commitError) throw commitError;
      }

      // 3. No demo data is seeded — user starts fresh and adds real data via CSV or manual entry

      router.push("/dashboard");
    } catch (err) {
      console.error("Error saving onboarding data:", err);
      alert("Failed to save data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Progress dots */}
        <div className={styles.progress}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`${styles.dot} ${s === step ? styles.dotActive : ""} ${s < step ? styles.dotDone : ""}`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className={styles.stepContainer} key="step1">
            <div className={styles.welcomeIcon}>🍋</div>
            <h1 className={styles.title}>
              See where your money{" "}
              <span className={styles.titleAccent}>really goes.</span>
            </h1>
            <p className={styles.subtitle}>
              Savery gives you effortless clarity on your spending — without spreadsheets or manual tracking.
            </p>

            <div className={styles.personaGrid}>
              {([
                { value: "salaried" as Persona, emoji: "💼", label: "Salaried Professional", desc: "Fixed monthly income, multiple accounts" },
                { value: "freelancer" as Persona, emoji: "🎨", label: "Freelancer / Gig", desc: "Irregular income, flexible spending" },
                { value: "family" as Persona, emoji: "👨‍👩‍👧", label: "Family Manager", desc: "Joint expenses, household budgets" },
              ]).map((p) => (
                <button
                  key={p.value}
                  className={`${styles.personaOption} ${persona === p.value ? styles.personaSelected : ""}`}
                  onClick={() => setPersona(p.value)}
                >
                  <span className={styles.personaEmoji}>{p.emoji}</span>
                  <div className={styles.personaInfo}>
                    <span className={styles.personaLabel}>{p.label}</span>
                    <span className={styles.personaDesc}>{p.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            <button className={styles.cta} onClick={next} disabled={!persona}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Quick Setup */}
        {step === 2 && (
          <div className={styles.stepContainer} key="step2">
            <h1 className={styles.title}>
              Your <span className={styles.titleAccent}>numbers</span>
            </h1>
            <p className={styles.subtitle}>
              Help us understand your baseline. This powers your Safe-to-Spend calculation.
            </p>

            <div className={styles.formSection}>
              <label className={styles.inputLabel}>Monthly Take-Home Income</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currencyPrefix}>₹</span>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="1,05,000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <label className={styles.inputLabel}>Fixed Monthly Commitments</label>
              <div className={styles.commitmentsList}>
                {commitments.map((c, i) => (
                  <div key={i} className={styles.commitmentRow}>
                    <input
                      className={styles.commitmentName}
                      type="text"
                      placeholder="e.g., EMI, Gym, Insurance"
                      value={c.label}
                      onChange={(e) => updateCommitment(i, "label", e.target.value)}
                    />
                    <div className={styles.commitmentAmountWrap}>
                      <span className={styles.commitmentCurrency}>₹</span>
                      <input
                        className={styles.commitmentAmount}
                        type="number"
                        placeholder="0"
                        value={c.amount || ""}
                        onChange={(e) => updateCommitment(i, "amount", e.target.value)}
                      />
                    </div>
                    {commitments.length > 1 && (
                      <button className={styles.removeBtn} onClick={() => removeCommitment(i)}>
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button className={styles.addBtn} onClick={addCommitment}>
                <span className={styles.addBtnIcon}>+</span>
                Add another commitment
              </button>
            </div>

            <button className={styles.cta} onClick={next} disabled={!income}>
              Continue →
            </button>
            <button className={styles.backBtn} onClick={back}>
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Connect Data */}
        {step === 3 && (
          <div className={styles.stepContainer} key="step3">
            <h1 className={styles.title}>
              Connect your <span className={styles.titleAccent}>data</span>
            </h1>
            <p className={styles.subtitle}>
              Choose how to bring in your transactions. You can always change this later.
            </p>

            <div className={styles.connectOptions}>
              <button
                className={`${styles.connectOption} ${dataSource === "csv" ? styles.connectSelected : ""}`}
                onClick={() => setDataSource("csv")}
              >
                <span className={styles.connectIcon}>📄</span>
                <div className={styles.connectInfo}>
                  <span className={styles.connectLabel}>Upload Bank Statement</span>
                  <span className={styles.connectDesc}>Import a CSV file from your bank to get started instantly</span>
                  <span className={styles.connectBadge}>RECOMMENDED</span>
                </div>
              </button>

              <button
                className={`${styles.connectOption} ${dataSource === "skip" ? styles.connectSelected : ""}`}
                onClick={() => setDataSource("skip")}
              >
                <span className={styles.connectIcon}>🚀</span>
                <div className={styles.connectInfo}>
                  <span className={styles.connectLabel}>Start Fresh</span>
                  <span className={styles.connectDesc}>Skip for now — log expenses manually or import CSV later from the dashboard</span>
                </div>
              </button>
            </div>

            <button className={styles.cta} onClick={handleFinish} disabled={!dataSource || loading}>
              {loading ? "Saving..." : "Launch Savery 🍋"}
            </button>
            <button className={styles.backBtn} onClick={back}>
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
