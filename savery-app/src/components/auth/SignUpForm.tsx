"use client";

import { useState, FormEvent, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./AuthPage.module.css";

interface SignUpFormProps {
  onError: (msg: string) => void;
  onLoading: (loading: boolean) => void;
}

function getPasswordStrength(pw: string): {
  score: number;
  label: string;
} {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: "Weak" };
  if (score <= 3) return { score: 2, label: "Medium" };
  return { score: 3, label: "Strong" };
}

export default function SignUpForm({ onError, onLoading }: SignUpFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!fullName.trim()) errors.fullName = "Name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Enter a valid email";
    if (!password) errors.password = "Password is required";
    else if (password.length < 6)
      errors.password = "Must be at least 6 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onError("");
    if (!validate()) return;

    setLoading(true);
    onLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });
      if (error) {
        onError(error.message);
      } else {
        setEmailSent(true);
      }
    } catch {
      onError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  // ── Email Confirmation Screen ──
  if (emailSent) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--dark)", marginBottom: 8 }}>
          Check your inbox!
        </h2>
        <p style={{ fontSize: 14, color: "var(--gray-muted)", lineHeight: 1.6, marginBottom: 20 }}>
          We sent a confirmation link to{" "}
          <strong style={{ color: "var(--dark)" }}>{email}</strong>.
          <br />
          Click the link to verify your account, then come back and sign in.
        </p>
        <div style={{
          background: "var(--lime-glow)",
          border: "1px solid var(--lime-muted)",
          borderRadius: "var(--radius-xl)",
          padding: "16px",
          marginBottom: 20,
          fontSize: 13,
          color: "var(--dark-soft)",
          textAlign: "left",
          lineHeight: 1.6,
        }}>
          <strong>Didn&apos;t get it?</strong> Check your spam folder. The email is from <em>no-reply@savery.app</em>.
        </div>
        <button
          onClick={() => setEmailSent(false)}
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid var(--gray-border)",
            borderRadius: "var(--radius-pill)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--gray-muted)",
            cursor: "pointer",
          }}
        >
          ← Use a different email
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* Full Name */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel} htmlFor="signup-name">
          Full Name
        </label>
        <div className={styles.inputWrapper}>
          <svg
            className={styles.inputIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input
            id="signup-name"
            type="text"
            className={`${styles.input} ${fieldErrors.fullName ? styles.inputError : ""}`}
            placeholder="Ananya Sharma"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName)
                setFieldErrors((p) => ({ ...p, fullName: undefined }));
            }}
            autoComplete="name"
          />
        </div>
        {fieldErrors.fullName && (
          <span className={styles.errorText}>{fieldErrors.fullName}</span>
        )}
      </div>

      {/* Email */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel} htmlFor="signup-email">
          Email
        </label>
        <div className={styles.inputWrapper}>
          <svg
            className={styles.inputIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <input
            id="signup-email"
            type="email"
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ""}`}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email)
                setFieldErrors((p) => ({ ...p, email: undefined }));
            }}
            autoComplete="email"
          />
        </div>
        {fieldErrors.email && (
          <span className={styles.errorText}>{fieldErrors.email}</span>
        )}
      </div>

      {/* Password */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel} htmlFor="signup-password">
          Password
        </label>
        <div className={styles.inputWrapper}>
          <svg
            className={styles.inputIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            className={`${styles.input} ${fieldErrors.password ? styles.inputError : ""}`}
            placeholder="Create a password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password)
                setFieldErrors((p) => ({ ...p, password: undefined }));
            }}
            autoComplete="new-password"
          />
          <svg
            className={styles.eyeToggle}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            onClick={() => setShowPassword(!showPassword)}
            role="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setShowPassword(!showPassword);
            }}
          >
            {showPassword ? (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </div>
        {fieldErrors.password && (
          <span className={styles.errorText}>{fieldErrors.password}</span>
        )}

        {/* Password strength bar */}
        {password && (
          <>
            <div className={styles.strengthBar}>
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`${styles.strengthSegment} ${
                    strength.score >= level
                      ? strength.score === 1
                        ? styles.strengthWeak
                        : strength.score === 2
                        ? styles.strengthMedium
                        : styles.strengthStrong
                      : ""
                  }`}
                />
              ))}
            </div>
            <span className={styles.strengthLabel}>{strength.label}</span>
          </>
        )}
      </div>

      {/* Submit */}
      <button type="submit" className={styles.cta} disabled={loading} id="signup-submit">
        {loading ? <span className={styles.spinner} /> : "Create Account"}
      </button>

      {/* Terms */}
      <p className={styles.terms}>
        By signing up, you agree to our{" "}
        <a href="#" className={styles.termsLink}>
          Terms
        </a>{" "}
        &{" "}
        <a href="#" className={styles.termsLink}>
          Privacy Policy
        </a>
      </p>
    </form>
  );
}
