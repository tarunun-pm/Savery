"use client";

import { useState, useRef, useCallback } from "react";
import styles from "./CSVUploadModal.module.css";
import { parseCSV, ParsedTransaction } from "@/lib/csvParser";
import { supabase } from "@/lib/supabase";
import { formatINR } from "@/lib/helpers";
import type { SpendingBucket } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
  userId: string;
}

type Step = "upload" | "categorizing" | "preview" | "saving" | "done";

interface CategorizedTx extends ParsedTransaction {
  category: string;
  bucket: SpendingBucket;
  include: boolean;
}

const FALLBACK_CATEGORY = "Others";
const FALLBACK_BUCKET: SpendingBucket = "discretionary";

const CATEGORIES = [
  "Food & Dining", "Shopping", "Transport", "Bills & Utilities",
  "Entertainment", "Health & Wellness", "Financial",
  "Personal Care", "Education", "Others"
];

export default function CSVUploadModal({ isOpen, onClose, onImported, userId }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [bankName, setBankName] = useState("");
  const [skippedCount, setSkippedCount] = useState(0);
  const [transactions, setTransactions] = useState<CategorizedTx[]>([]);
  const [categorizingProgress, setCategorizingProgress] = useState(0);
  const [saveProgress, setSaveProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep("upload");
    setTransactions([]);
    setParseErrors([]);
    setCategorizingProgress(0);
    onClose();
  };

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setParseErrors(["Please upload a .csv file."]);
      return;
    }

    const text = await file.text();
    const result = parseCSV(text);

    if (result.errors.length > 0) {
      setParseErrors(result.errors);
    }

    if (result.transactions.length === 0) {
      setParseErrors(prev => [...prev, "No debit transactions found in this file."]);
      return;
    }

    setBankName(result.bank);
    setSkippedCount(result.skipped);
    setParseErrors(result.errors);

    // Start with fallback categories
    const initial: CategorizedTx[] = result.transactions.map(t => ({
      ...t,
      category: FALLBACK_CATEGORY,
      bucket: FALLBACK_BUCKET,
      include: true,
    }));
    setTransactions(initial);
    setStep("categorizing");

    // Batch categorize via Gemini
    const merchants = result.transactions.map(t => t.merchant);
    const BATCH_SIZE = 50;
    const allCategories: { category: string; bucket: string }[] = [];

    for (let i = 0; i < merchants.length; i += BATCH_SIZE) {
      const batch = merchants.slice(i, i + BATCH_SIZE);
      try {
        const res = await fetch("/api/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchants: batch }),
        });
        const data = await res.json();
        if (data.categories && Array.isArray(data.categories)) {
          allCategories.push(...data.categories);
        } else {
          // Fill with fallback for failed batch
          allCategories.push(...batch.map(() => ({ category: FALLBACK_CATEGORY, bucket: FALLBACK_BUCKET })));
        }
      } catch {
        allCategories.push(...batch.map(() => ({ category: FALLBACK_CATEGORY, bucket: FALLBACK_BUCKET })));
      }
      setCategorizingProgress(Math.round(((i + BATCH_SIZE) / merchants.length) * 100));
    }

    setTransactions(result.transactions.map((t, i) => ({
      ...t,
      category: allCategories[i]?.category || FALLBACK_CATEGORY,
      bucket: (allCategories[i]?.bucket as SpendingBucket) || FALLBACK_BUCKET,
      include: true,
    })));

    setStep("preview");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const toggleInclude = (idx: number) => {
    setTransactions(prev => prev.map((t, i) => i === idx ? { ...t, include: !t.include } : t));
  };

  const updateCategory = (idx: number, category: string) => {
    const bucketMap: Record<string, SpendingBucket> = {
      "Financial": "fixed",
      "Bills & Utilities": "essential",
      "Transport": "essential",
      "Health & Wellness": "essential",
      "Food & Dining": "essential",
      "Education": "essential",
      "Shopping": "discretionary",
      "Entertainment": "discretionary",
      "Personal Care": "discretionary",
      "Others": "discretionary",
    };
    setTransactions(prev => prev.map((t, i) =>
      i === idx ? { ...t, category, bucket: bucketMap[category] || FALLBACK_BUCKET } : t
    ));
  };

  const handleSave = async () => {
    const toSave = transactions.filter(t => t.include);
    if (toSave.length === 0) return;

    setStep("saving");
    const BATCH = 20;
    let saved = 0;

    for (let i = 0; i < toSave.length; i += BATCH) {
      const batch = toSave.slice(i, i + BATCH).map(t => ({
        user_id: userId,
        amount: t.amount,
        merchant: t.merchant,
        category: t.category,
        sub_category: t.category,
        date: t.date,
        source: "csv",
        is_cash: false,
        bucket: t.bucket,
        notes: t.description,
      }));

      await supabase.from("transactions").insert(batch);
      saved += batch.length;
      setSaveProgress(Math.round((saved / toSave.length) * 100));
    }

    setImportedCount(saved);
    setStep("done");
    onImported(saved);
  };

  const includedCount = transactions.filter(t => t.include).length;
  const totalAmount = transactions.filter(t => t.include).reduce((s, t) => s + t.amount, 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Import Bank Statement</h2>
            {bankName && step !== "upload" && (
              <span className={styles.bankBadge}>{bankName}</span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className={styles.uploadArea}>
            <div
              className={`${styles.dropzone} ${dragOver ? styles.dropzoneDragOver : ""}`}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
            >
              <div className={styles.dropzoneIcon}>📄</div>
              <h3 className={styles.dropzoneTitle}>Drop your CSV here</h3>
              <p className={styles.dropzoneSubtitle}>
                or click to browse
              </p>
              <p className={styles.dropzoneHint}>
                Supports HDFC, SBI, ICICI, Axis, Kotak & most Indian banks
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className={styles.fileInput}
                onChange={handleFileInput}
              />
            </div>

            {parseErrors.length > 0 && (
              <div className={styles.errorBox}>
                {parseErrors.map((e, i) => <p key={i}>⚠️ {e}</p>)}
              </div>
            )}

            <div className={styles.howTo}>
              <h4 className={styles.howToTitle}>How to export your CSV:</h4>
              <div className={styles.howToGrid}>
                {[
                  { bank: "HDFC", step: "NetBanking → My Accounts → View Statement → Download" },
                  { bank: "SBI", step: "SBI YONO → eStatements → Download CSV" },
                  { bank: "ICICI", step: "iMobile → Accounts → Download Statement → CSV" },
                  { bank: "Axis", step: "Axis Mobile → Account Statement → CSV Export" },
                ].map(({ bank, step }) => (
                  <div key={bank} className={styles.howToItem}>
                    <span className={styles.howToBank}>{bank}</span>
                    <span className={styles.howToStep}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Categorizing ── */}
        {step === "categorizing" && (
          <div className={styles.progressSection}>
            <div className={styles.progressEmoji}>✨</div>
            <h3 className={styles.progressTitle}>Gemini is categorizing your transactions</h3>
            <p className={styles.progressSubtitle}>
              Analyzing {transactions.length} transactions...
            </p>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${categorizingProgress}%` }}
              />
            </div>
            <p className={styles.progressPct}>{Math.min(categorizingProgress, 100)}%</p>
          </div>
        )}

        {/* ── Step 3: Preview ── */}
        {step === "preview" && (
          <div className={styles.previewSection}>
            <div className={styles.previewSummary}>
              <div className={styles.summaryStat}>
                <span className={styles.summaryValue}>{includedCount}</span>
                <span className={styles.summaryLabel}>transactions</span>
              </div>
              <div className={styles.summaryStat}>
                <span className={styles.summaryValue}>{formatINR(totalAmount)}</span>
                <span className={styles.summaryLabel}>total spend</span>
              </div>
              {skippedCount > 0 && (
                <div className={styles.summaryStat}>
                  <span className={styles.summaryValue} style={{ color: "var(--gray-muted)" }}>{skippedCount}</span>
                  <span className={styles.summaryLabel}>skipped</span>
                </div>
              )}
            </div>

            <p className={styles.previewHint}>
              Uncheck rows you don't want to import. You can also fix categories.
            </p>

            <div className={styles.txnList}>
              {transactions.map((t, i) => (
                <div
                  key={i}
                  className={`${styles.txnRow} ${!t.include ? styles.txnRowExcluded : ""}`}
                >
                  <input
                    type="checkbox"
                    className={styles.txnCheckbox}
                    checked={t.include}
                    onChange={() => toggleInclude(i)}
                  />
                  <div className={styles.txnInfo}>
                    <p className={styles.txnMerchant}>{t.merchant}</p>
                    <p className={styles.txnDate}>
                      {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <select
                    className={styles.txnCategorySelect}
                    value={t.category}
                    onChange={e => updateCategory(i, e.target.value)}
                    disabled={!t.include}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className={styles.txnAmount}>{formatINR(t.amount)}</span>
                </div>
              ))}
            </div>

            <div className={styles.previewActions}>
              <button className={styles.cancelBtn} onClick={handleClose}>Cancel</button>
              <button
                className={styles.importBtn}
                onClick={handleSave}
                disabled={includedCount === 0}
              >
                Import {includedCount} Transactions
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Saving ── */}
        {step === "saving" && (
          <div className={styles.progressSection}>
            <div className={styles.progressEmoji}>💾</div>
            <h3 className={styles.progressTitle}>Saving to Savery...</h3>
            <div className={styles.progressBarTrack}>
              <div className={styles.progressBarFill} style={{ width: `${saveProgress}%` }} />
            </div>
            <p className={styles.progressPct}>{saveProgress}%</p>
          </div>
        )}

        {/* ── Step 5: Done ── */}
        {step === "done" && (
          <div className={styles.doneSection}>
            <div className={styles.doneEmoji}>🎉</div>
            <h3 className={styles.doneTitle}>Import Complete!</h3>
            <p className={styles.doneSubtitle}>
              <strong>{importedCount}</strong> transactions have been added to Savery.
              Your dashboard and insights are now updated.
            </p>
            <button className={styles.importBtn} onClick={handleClose}>
              View Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
