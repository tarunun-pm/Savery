"use client";

import { useState } from "react";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import styles from "./AuthPage.module.css";

type AuthTab = "signin" | "signup";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [globalError, setGlobalError] = useState("");


  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setGlobalError("");
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Brand header */}
        <div className={styles.brandHeader}>
          <img 
            src="/logo/savery-logo.svg" 
            alt="Savery Logo" 
            className={styles.brandImage} 
          />
        </div>

        {/* Headline */}
        <h1 className={styles.headline}>
          Your money,{" "}
          <span className={styles.headlineAccent}>clearly.</span>
        </h1>
        <p className={styles.subline}>
          Understand where every rupee goes.
        </p>

        {/* Tabs */}
        <div className={styles.tabs} role="tablist">
          <button
            className={`${styles.tab} ${activeTab === "signin" ? styles.tabActive : ""}`}
            onClick={() => switchTab("signin")}
            role="tab"
            aria-selected={activeTab === "signin"}
            id="tab-signin"
          >
            Sign In
          </button>
          <button
            className={`${styles.tab} ${activeTab === "signup" ? styles.tabActive : ""}`}
            onClick={() => switchTab("signup")}
            role="tab"
            aria-selected={activeTab === "signup"}
            id="tab-signup"
          >
            Sign Up
          </button>
        </div>

        {/* Error banner */}
        {globalError && (
          <div className={styles.errorBanner} role="alert">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {globalError}
          </div>
        )}

        {/* Active form */}
        {activeTab === "signin" ? (
          <SignInForm onError={setGlobalError} onLoading={() => {}} />
        ) : (
          <SignUpForm onError={setGlobalError} onLoading={() => {}} />
        )}


      </div>
    </div>
  );
}
