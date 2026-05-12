"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { buildMonthSnapshot, formatINR, topCategories } from "@/lib/helpers";
import { demoTransactions, demoCommitments } from "@/lib/demoData";
import styles from "./LemonChat.module.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

interface FinancialContext {
  income: number;
  commitments: number;
  totalSpent: number;
  safeToSpend: number;
  topCategories: string;
}

export default function LemonChat() {
  const [open, setOpen] = useState(false);
  const [bounced, setBounced] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<FinancialContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [open]);

  // Load financial context from Supabase once when opened
  const loadContext = useCallback(async () => {
    if (context) return; // already loaded
    setContextLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const [profileRes, commitRes, txnRes] = await Promise.all([
        supabase.from("user_profiles").select("monthly_income").eq("user_id", uid).single(),
        supabase.from("user_commitments").select("*").eq("user_id", uid),
        supabase.from("transactions").select("*").eq("user_id", uid).order("date", { ascending: false }),
      ]);

      const income = profileRes.data?.monthly_income || 105000;
      const commitments = commitRes.data || demoCommitments;
      const transactions = txnRes.data && txnRes.data.length > 0 ? txnRes.data : demoTransactions;

      const snapshot = buildMonthSnapshot(income, commitments, transactions);
      const top3 = topCategories(snapshot.categories, 3)
        .map((c) => `${c.category} (${formatINR(c.total)})`)
        .join(", ");

      setContext({
        income,
        commitments: commitments.reduce((s: number, c: any) => s + c.amount, 0),
        totalSpent: snapshot.totalSpent,
        safeToSpend: snapshot.safeToSpend,
        topCategories: top3,
      });
    } catch (err) {
      console.error("Failed to load financial context:", err);
    } finally {
      setContextLoading(false);
    }
  }, [context]);

  const handleOpen = () => {
    setBounced(true);
    setTimeout(() => setBounced(false), 500);
    setOpen(true);
    loadContext();

    // Show greeting if first open
    if (messages.length === 0) {
      setMessages([{
        id: "greeting",
        role: "assistant",
        content: "Hey! I'm Savery 🍋 — your financial clarity guide. I've got your spending data loaded. Ask me anything: *Can I afford this?*, *Where am I overspending?*, or *How do I save more?*",
        ts: Date.now(),
      }]);
    }
  };

  const handleClose = () => setOpen(false);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: msg,
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build history excluding the greeting for cleaner context
      const historyForApi = messages
        .filter((m) => m.id !== "greeting")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          context: context || {},
          history: historyForApi,
        }),
      });

      const data = await res.json();
      const reply = data.reply || data.error || "Something went wrong. Try again?";

      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: reply,
        ts: Date.now(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Couldn't connect right now. Please try again.",
        ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render message text with basic markdown: **bold** and *italic*
  const renderText = (text: string) => {
    // Split on **bold** first, then *italic* within remaining spans
    const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      // Handle single *italic* within non-bold parts
      const italicParts = part.split(/(\*[^*]+\*)/g);
      return italicParts.map((ipart, j) => {
        if (ipart.startsWith("*") && ipart.endsWith("*") && ipart.length > 2) {
          return <em key={`${i}-${j}`} style={{ fontStyle: "normal", color: "#C8F100", fontWeight: 600 }}>{ipart.slice(1, -1)}</em>;
        }
        return <span key={`${i}-${j}`}>{ipart}</span>;
      });
    });
  };

  return (
    <>
      {/* Chat Panel Overlay */}
      {open && (
        <div className={styles.overlay} onClick={handleClose} />
      )}

      {/* Chat Panel */}
      <div className={`${styles.panel} ${open ? styles.panelOpen : ""}`}>
        {/* Panel Header */}
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <div className={styles.lemonAvatarSmall}>
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="32" cy="34" rx="22" ry="20" fill="#C8F100" />
                <ellipse cx="32" cy="34" rx="22" ry="20" fill="url(#lemonGradSmall)" />
                <ellipse cx="24" cy="28" rx="8" ry="6" fill="rgba(255,255,255,0.35)" />
                <path d="M52 28c4-4 8-8 6-10s-6 2-10 6" fill="#A6E600" />
                <path d="M48 22c2-6 0-12-4-14s-6 4-4 10c1 3 4 6 8 4z" fill="#6BBF3B" />
                <circle cx="26" cy="34" r="2" fill="#1A1A1A" />
                <circle cx="38" cy="34" r="2" fill="#1A1A1A" />
                <path d="M27 40c2 3 8 3 10 0" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <defs>
                  <linearGradient id="lemonGradSmall" x1="10" y1="14" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#D4F54D" />
                    <stop offset="1" stopColor="#A6E600" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <p className={styles.panelName}>Savery</p>
              <p className={styles.panelStatus}>
                {contextLoading ? "Loading your data…" : "Financial Guide · Active"}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Context pill */}
        {context && !contextLoading && (
          <div className={styles.contextPill}>
            Safe to spend today: <strong>{formatINR(context.safeToSpend)}</strong>
          </div>
        )}

        {/* Message List */}
        <div className={styles.messageList}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.msgRow} ${msg.role === "user" ? styles.msgRowUser : styles.msgRowAssistant}`}
            >
              {msg.role === "assistant" && (
                <div className={styles.msgAvatar}>🍋</div>
              )}
              <div className={`${styles.bubble} ${msg.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}`}>
                {renderText(msg.content)}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className={`${styles.msgRow} ${styles.msgRowAssistant}`}>
              <div className={styles.msgAvatar}>🍋</div>
              <div className={`${styles.bubble} ${styles.bubbleAssistant} ${styles.typingBubble}`}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className={styles.inputBar}>
          <input
            ref={inputRef}
            className={styles.chatInput}
            type="text"
            placeholder="Ask about your finances…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoComplete="off"
          />
          <button
            className={`${styles.sendBtn} ${(!input.trim() || loading) ? styles.sendBtnDisabled : ""}`}
            onClick={handleSend}
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* FAB Button */}
      <div className={styles.wrapper}>
        <button
          className={`${styles.fab} ${bounced ? styles.bounce : ""} ${open ? styles.fabHidden : ""}`}
          onClick={handleOpen}
          aria-label="Chat with Savery"
          title="Ask Savery"
        >
          <svg
            className={styles.lemonIcon}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="32" cy="34" rx="22" ry="20" fill="#C8F100" />
            <ellipse cx="32" cy="34" rx="22" ry="20" fill="url(#lemonGrad)" />
            <ellipse cx="24" cy="28" rx="8" ry="6" fill="rgba(255,255,255,0.35)" />
            <path d="M52 28c4-4 8-8 6-10s-6 2-10 6" fill="#A6E600" />
            <path d="M48 22c2-6 0-12-4-14s-6 4-4 10c1 3 4 6 8 4z" fill="#6BBF3B" />
            <path d="M46 16c-2 4-4 8-2 10" stroke="#4A9D2D" strokeWidth="1" fill="none" />
            <circle cx="26" cy="34" r="2" fill="#1A1A1A" />
            <circle cx="38" cy="34" r="2" fill="#1A1A1A" />
            <path d="M27 40c2 3 8 3 10 0" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <defs>
              <linearGradient id="lemonGrad" x1="10" y1="14" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D4F54D" />
                <stop offset="1" stopColor="#A6E600" />
              </linearGradient>
            </defs>
          </svg>
        </button>
      </div>
    </>
  );
}
