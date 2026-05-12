"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./ProfileView.module.css";
import { formatINR } from "@/lib/helpers";
import { useTheme } from "@/lib/ThemeContext";
import type { Commitment, Persona } from "@/lib/types";

export default function ProfileView() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Data states
  const [profile, setProfile] = useState<any>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);

  // Edit states
  const [editPersonal, setEditPersonal] = useState(false);
  const [editFinancial, setEditFinancial] = useState(false);
  const [editCommitments, setEditCommitments] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [persona, setPersona] = useState<Persona>("salaried");
  const [income, setIncome] = useState("");
  const [tempCommitments, setTempCommitments] = useState<Commitment[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/auth");
          return;
        }
        const uid = session.user.id;
        setUserId(uid);

        const [profileRes, commitRes] = await Promise.all([
          supabase.from("user_profiles").select("*").eq("user_id", uid).single(),
          supabase.from("user_commitments").select("*").eq("user_id", uid)
        ]);

        if (profileRes.data) {
          setProfile(profileRes.data);
          setFullName(profileRes.data.full_name || "");
          setPersona(profileRes.data.persona || "salaried");
          setIncome(profileRes.data.monthly_income?.toString() || "0");
        }

        if (commitRes.data) {
          setCommitments(commitRes.data);
          setTempCommitments(commitRes.data);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const savePersonal = async () => {
    if (!userId) return;
    const { error } = await supabase.from("user_profiles").upsert({ user_id: userId, full_name: fullName, persona });
    if (error) {
      console.error("Error saving personal info:", error);
      alert("Failed to save. Have you applied the SQL schema?");
    } else {
      setProfile({ ...profile, full_name: fullName, persona });
      setEditPersonal(false);
    }
  };

  const saveFinancial = async () => {
    if (!userId) return;
    const numIncome = Number(income) || 0;
    const { error } = await supabase.from("user_profiles").upsert({ user_id: userId, monthly_income: numIncome });
    if (error) {
      console.error("Error saving financials:", error);
      alert("Failed to save. Have you applied the SQL schema?");
    } else {
      setProfile({ ...profile, monthly_income: numIncome });
      setEditFinancial(false);
    }
  };

  const saveCommitments = async () => {
    if (!userId) return;
    // Delete all and re-insert for sync simplicity
    const { error: delError } = await supabase.from("user_commitments").delete().eq("user_id", userId);
    
    if (delError) {
      console.error("Error deleting old commitments:", delError);
      alert("Failed to save. Have you applied the SQL schema?");
      return;
    }

    const validCommitments = tempCommitments
      .filter((c) => c.label && c.amount > 0)
      .map((c) => ({
        user_id: userId,
        label: c.label,
        amount: c.amount,
        category: c.category || "Others",
      }));

    if (validCommitments.length > 0) {
      const { error: insError } = await supabase.from("user_commitments").insert(validCommitments);
      if (insError) {
        console.error("Error inserting new commitments:", insError);
        alert("Failed to save commitments.");
        return;
      }
    }
    
    setCommitments(validCommitments as Commitment[]);
    setEditCommitments(false);
  };

  if (loading) {
    return (
      <div className={styles.screen} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ width: 40, height: 40, border: '4px solid var(--gray-border)', borderTopColor: 'var(--lime-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
              <div className={styles.backBtn} onClick={() => router.push("/dashboard")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </div>
        <h1 className={styles.title}>Profile</h1>
      </div>

      {/* Personal Info */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Personal Info</h2>
          {!editPersonal ? (
                        <button className={styles.editBtn} onClick={() => setEditPersonal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
          ) : (
            <div className={styles.editActions}>
              <span className={styles.cancelBtn} onClick={() => setEditPersonal(false)}>Cancel</span>
              <button className={styles.saveBtn} onClick={savePersonal}>Save</button>
            </div>
          )}
        </div>
        {!editPersonal ? (
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Full Name</span>
            <span className={styles.fieldValue}>{profile?.full_name || "N/A"}</span>
            <div style={{ marginTop: 12 }} />
            <span className={styles.fieldLabel}>Persona</span>
            <span className={styles.fieldValue} style={{ textTransform: "capitalize" }}>{profile?.persona || "N/A"}</span>
          </div>
        ) : (
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Full Name</label>
            <input className={styles.input} type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <div style={{ marginTop: 12 }} />
            <label className={styles.fieldLabel}>Persona</label>
            <select className={styles.select} value={persona} onChange={(e) => setPersona(e.target.value as Persona)}>
              <option value="salaried">Salaried</option>
              <option value="freelancer">Freelancer</option>
              <option value="family">Family</option>
            </select>
          </div>
        )}
      </div>

      {/* Financials */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Financials</h2>
          {!editFinancial ? (
                        <button className={styles.editBtn} onClick={() => setEditFinancial(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
          ) : (
            <div className={styles.editActions}>
              <span className={styles.cancelBtn} onClick={() => setEditFinancial(false)}>Cancel</span>
              <button className={styles.saveBtn} onClick={saveFinancial}>Save</button>
            </div>
          )}
        </div>
        {!editFinancial ? (
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Monthly Take-Home Income</span>
            <span className={styles.fieldValue}>{formatINR(profile?.monthly_income || 0)}</span>
          </div>
        ) : (
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Monthly Take-Home Income</label>
            <div className={styles.inputWrapper}>
              <span className={styles.currencyPrefix}>₹</span>
              <input className={`${styles.input} ${styles.inputWithPrefix}`} type="number" value={income} onChange={(e) => setIncome(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Commitments */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Fixed Commitments</h2>
          {!editCommitments ? (
                        <button className={styles.editBtn} onClick={() => setEditCommitments(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
          ) : (
            <div className={styles.editActions}>
              <span className={styles.cancelBtn} onClick={() => {
                setEditCommitments(false);
                setTempCommitments(commitments);
              }}>Cancel</span>
              <button className={styles.saveBtn} onClick={saveCommitments}>Save</button>
            </div>
          )}
        </div>
        {!editCommitments ? (
          <div className={styles.fieldGroup}>
            {commitments.length === 0 ? (
              <span className={styles.fieldValue}>No commitments added.</span>
            ) : (
              commitments.map((c, idx) => (
                <div key={idx} className={styles.commitmentRow}>
                  <span className={styles.commitmentLabel}>{c.label}</span>
                  <span className={styles.commitmentAmount}>{formatINR(c.amount)}</span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className={styles.fieldGroup}>
            {tempCommitments.map((c, i) => (
              <div key={i} className={styles.commitmentEditRow}>
                <input 
                  className={styles.input} 
                  type="text" 
                  placeholder="Label" 
                  value={c.label} 
                  onChange={(e) => {
                    const newC = [...tempCommitments];
                    newC[i].label = e.target.value;
                    setTempCommitments(newC);
                  }} 
                />
                <div className={styles.inputWrapper} style={{ width: 120, flexShrink: 0 }}>
                  <span className={styles.currencyPrefix}>₹</span>
                  <input 
                    className={`${styles.input} ${styles.inputWithPrefix}`} 
                    type="number" 
                    placeholder="0" 
                    value={c.amount || ""} 
                    onChange={(e) => {
                      const newC = [...tempCommitments];
                      newC[i].amount = Number(e.target.value) || 0;
                      setTempCommitments(newC);
                    }} 
                  />
                </div>
                <button className={styles.removeBtn} onClick={() => setTempCommitments(tempCommitments.filter((_, idx) => idx !== i))}>×</button>
              </div>
            ))}
            <button className={styles.addBtn} onClick={() => setTempCommitments([...tempCommitments, { label: "", amount: 0, category: "Others" }])}>
              + Add Commitment
            </button>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Appearance</h2>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
            <span className={styles.settingMeta}>Switch app appearance</span>
          </div>
          <button
            className={`${styles.themeToggle} ${theme === "light" ? styles.themeToggleLight : ""}`}
            onClick={toggle}
            aria-label="Toggle theme"
          >
            <span className={styles.themeToggleKnob} />
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className={styles.logoutCard}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log Out
        </button>
      </div>

    </div>
  );
}
