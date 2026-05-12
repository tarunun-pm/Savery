/**
 * Savery CSV Bank Statement Parser
 * Supports: HDFC, SBI, ICICI, Axis, Kotak, and generic formats
 */
import Papa from "papaparse";

export interface ParsedTransaction {
  date: string;         // ISO string
  description: string;  // raw narration/description from bank
  merchant: string;     // cleaned merchant name
  amount: number;       // always positive (debit = expense)
  balance?: number;
  source: string;       // 'csv'
  rawRow: Record<string, string>; // original CSV row for debugging
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  skipped: number;
  bank: string;         // detected bank name
  errors: string[];
}

// ── Column name synonyms for auto-detection ──────────────────────────────────

const DATE_COLS = [
  "date", "txn date", "transaction date", "value date",
  "posting date", "trans date", "valuedate", "transactiondate"
];

const DEBIT_COLS = [
  "debit", "withdrawal", "dr", "debit amount", "withdrawal amount",
  "amount (dr)", "debit (inr)", "withdrawals", "paid out"
];

const CREDIT_COLS = [
  "credit", "deposit", "cr", "credit amount", "deposit amount",
  "amount (cr)", "credit (inr)", "deposits", "paid in"
];

const AMOUNT_COLS = [
  "amount", "transaction amount", "txn amount", "net amount"
];

const DESC_COLS = [
  "description", "narration", "particulars", "remarks",
  "transaction details", "details", "transaction narration",
  "txn narration", "chq/ref number", "transaction remarks"
];

const BALANCE_COLS = [
  "balance", "closing balance", "running balance", "available balance"
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

function findCol(headers: string[], synonyms: string[]): string | null {
  const normalized = headers.map(normalizeKey);
  for (const syn of synonyms) {
    const idx = normalized.indexOf(syn);
    if (idx !== -1) return headers[idx];
  }
  // Partial match fallback
  for (const syn of synonyms) {
    const idx = normalized.findIndex((h) => h.includes(syn));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function parseAmount(raw: string): number {
  if (!raw || raw.trim() === "" || raw.trim() === "-") return 0;
  // Remove currency symbols, commas, spaces
  const cleaned = raw.replace(/[₹,\s$€£]/g, "").replace(/[()]/g, "").trim();
  return Math.abs(parseFloat(cleaned) || 0);
}

function parseDate(raw: string): string | null {
  if (!raw || raw.trim() === "") return null;
  const s = raw.trim();

  // Common Indian bank date formats
  const formats = [
    // DD/MM/YYYY, DD-MM-YYYY
    { re: /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, fn: (m: RegExpMatchArray) => `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}` },
    // DD/MM/YY
    { re: /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/, fn: (m: RegExpMatchArray) => `20${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}` },
    // YYYY-MM-DD (ISO)
    { re: /^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/, fn: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}` },
    // DD MMM YYYY (e.g. 15 Jan 2024)
    { re: /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/, fn: (m: RegExpMatchArray) => {
      const months: Record<string,string> = { jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12" };
      return `${m[3]}-${months[m[2].toLowerCase()]}-${m[1].padStart(2,"0")}`;
    }},
    // DD-MMM-YYYY (e.g. 15-Jan-2024)
    { re: /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/, fn: (m: RegExpMatchArray) => {
      const months: Record<string,string> = { jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12" };
      return `${m[3]}-${months[m[2].toLowerCase()]}-${m[1].padStart(2,"0")}`;
    }},
  ];

  for (const { re, fn } of formats) {
    const m = s.match(re);
    if (m) {
      const iso = fn(m);
      const d = new Date(iso);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }
  return null;
}

function cleanMerchant(desc: string): string {
  // Remove common bank prefixes/suffixes for cleaner merchant names
  return desc
    .replace(/^(UPI|NEFT|IMPS|RTGS|ATM|POS|SI|ECS|NACH|EMI|BIL|INB|MOB|INT|CLG|CHQ|TRF)[\/\-\s]*/i, "")
    .replace(/\/\d{12,}/g, "")            // Remove transaction IDs (12+ digit numbers)
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z0-9@\s\.\-&']/g, " ")
    .trim()
    .slice(0, 60);                         // Max 60 chars
}

function detectBank(headers: string[], firstRows: Record<string, string>[]): string {
  const allText = headers.join(" ").toLowerCase();
  const firstRowText = JSON.stringify(firstRows).toLowerCase();
  if (allText.includes("hdfc") || firstRowText.includes("hdfc")) return "HDFC Bank";
  if (allText.includes("sbi") || firstRowText.includes("state bank")) return "SBI";
  if (allText.includes("icici") || firstRowText.includes("icici")) return "ICICI Bank";
  if (allText.includes("axis") || firstRowText.includes("axis")) return "Axis Bank";
  if (allText.includes("kotak") || firstRowText.includes("kotak")) return "Kotak Bank";
  if (allText.includes("idfc") || firstRowText.includes("idfc")) return "IDFC First Bank";
  if (allText.includes("yes bank") || firstRowText.includes("yes bank")) return "Yes Bank";
  return "Unknown Bank";
}

// ── Main Parser ──────────────────────────────────────────────────────────────

export function parseCSV(raw: string): ParseResult {
  const errors: string[] = [];
  let skipped = 0;

  const result = Papa.parse(raw, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h: string) => h.trim(),
  });

  if (result.errors.length > 0) {
    result.errors.forEach((e: any) => errors.push(e.message));
  }

  const rows = result.data as Record<string, string>[];
  if (rows.length === 0) {
    return { transactions: [], skipped: 0, bank: "Unknown", errors: ["No data rows found in CSV"] };
  }

  const headers = Object.keys(rows[0]);
  const bank = detectBank(headers, rows.slice(0, 3));

  // Auto-detect columns
  const dateCol = findCol(headers, DATE_COLS);
  const debitCol = findCol(headers, DEBIT_COLS);
  const creditCol = findCol(headers, CREDIT_COLS);
  const amountCol = !debitCol ? findCol(headers, AMOUNT_COLS) : null;
  const descCol = findCol(headers, DESC_COLS);
  const balanceCol = findCol(headers, BALANCE_COLS);

  if (!dateCol) errors.push("Could not detect Date column. Ensure your CSV has a 'Date' column.");
  if (!descCol) errors.push("Could not detect Description/Narration column.");
  if (!debitCol && !amountCol) errors.push("Could not detect Debit/Amount column.");

  const transactions: ParsedTransaction[] = [];

  for (const row of rows) {
    // Skip rows that look like headers repeated mid-file or summary rows
    const dateRaw = dateCol ? row[dateCol] : "";
    const descRaw = descCol ? row[descCol] : "";
    const debitRaw = debitCol ? row[debitCol] : "";
    const amountRaw = amountCol ? row[amountCol] : "";
    const balanceRaw = balanceCol ? row[balanceCol] : "";

    // Skip if key fields are empty
    if (!dateRaw?.trim() || !descRaw?.trim()) { skipped++; continue; }

    const parsedDate = parseDate(dateRaw);
    if (!parsedDate) { skipped++; continue; }

    // Determine amount — prefer debit column, fallback to amount column
    let amount = 0;
    if (debitCol) {
      amount = parseAmount(debitRaw);
      // If debit is 0, this is a credit (income) row — skip for now
      if (amount === 0) { skipped++; continue; }
    } else if (amountCol) {
      amount = parseAmount(amountRaw);
      if (amount === 0) { skipped++; continue; }
    }

    const merchant = cleanMerchant(descRaw);
    if (!merchant) { skipped++; continue; }

    transactions.push({
      date: parsedDate,
      description: descRaw.trim(),
      merchant,
      amount,
      balance: balanceRaw ? parseAmount(balanceRaw) : undefined,
      source: "csv",
      rawRow: row,
    });
  }

  return { transactions, skipped, bank, errors };
}
