import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import { generateOTP } from "../utils/otp";
import { useTheme } from "../context/ThemeContext";

import type { Job } from "../lib/types";

export default function Delivery() {
  const { colors, theme } = useTheme();

  const styles: Record<string, React.CSSProperties> = {
    // Layouts
    desktopLayout: { display: "grid", gridTemplateColumns: "350px 1fr", gap: "24px", padding: "24px", maxWidth: "1200px", margin: "0 auto", height: "calc(100vh - 80px)" },
    mobileLayout: { display: "block", padding: "16px" },

    // Mobile Tabs
    mobileTabs: { display: "flex", gap: "10px", padding: "0 16px 16px 16px" },
    tab: { flex: 1, padding: "12px", borderRadius: "8px", border: `1px solid ${colors.border}`, backgroundColor: colors.card, fontWeight: 600, color: colors.subText },
    tabActive: { flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #3b82f6", backgroundColor: theme === 'dark' ? '#18181b' : "#eff6ff", fontWeight: 700, color: "#2563eb" },

    // List Container
    listContainer: { backgroundColor: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", maxHeight: '80vh' },
    sectionHeader: { padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" },
    heading: { margin: 0, fontSize: "16px", fontWeight: 700, color: colors.text },
    refreshBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: colors.text },
    scrollArea: { padding: "12px", overflowY: "auto", flex: 1 },

    // List Card
    card: { padding: "16px", borderRadius: "10px", backgroundColor: colors.card, border: `1px solid ${colors.border}`, marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" },
    cardTitle: { fontWeight: 700, color: colors.text, fontSize: "15px", marginBottom: "4px" },
    cardMeta: { fontSize: "13px", color: colors.subText },
    accept: { backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" },

    // Workbench (Right side)
    workbench: { backgroundColor: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}`, padding: "20px", height: "100%", minHeight: "60vh" },
    emptyWorkbench: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: colors.subText },
    emptyText: { textAlign: "center", marginTop: "10px", color: colors.subText, fontSize: "15px" },

    // Active Job Details
    activeContent: { display: "flex", flexDirection: "column", height: "100%" },
    jobHeader: { borderBottom: `1px solid ${colors.border}`, paddingBottom: "20px" },
    statusBadge: { display: 'inline-block', backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', marginBottom: '8px' },
    customerName: { fontSize: "22px", margin: "0 0 8px 0", color: colors.text },

    // Action Boxes
    actionBox: { backgroundColor: colors.background, padding: "20px", borderRadius: "12px", border: `1px solid ${colors.border}`, marginTop: "20px" },
    boxTitle: { fontSize: '16px', color: colors.text, marginTop: 0, marginBottom: '8px' },
    boxText: { color: colors.subText, marginBottom: "16px", lineHeight: '1.5', fontSize: '14px' },

    // Inputs & Buttons
    input: { padding: "14px", borderRadius: "8px", border: `2px solid ${colors.border}`, width: "100%", fontSize: "24px", marginBottom: "16px", outline: "none", boxSizing: "border-box", textAlign: "center", letterSpacing: "8px", fontWeight: 'bold', backgroundColor: colors.background, color: colors.text },
    btnAction: { padding: "14px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", width: "100%", fontSize: "16px" },
    btnDone: { padding: "14px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", width: "100%", fontSize: "16px" },

    // Urgent Job Styles
    urgentCard: {
      borderLeft: "4px solid #ef4444",
      backgroundColor: theme === 'dark' ? '#450a0a' : "#fff5f5",
      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.2)"
    },
    urgentBadge: {
      backgroundColor: "#ef4444",
      color: "white",
      padding: "2px 8px",
      borderRadius: "12px",
      fontSize: "10px",
      fontWeight: 700,
      textTransform: "uppercase" as const
    }
  };

  const [available, setAvailable] = useState<Job[]>([]);
  const [myJob, setMyJob] = useState<Job | null>(null);

  // UI States
  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // For buttons
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "active">("list");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  /* ---------------- RESPONSIVE ---------------- */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Switch tab automatically if user picks up a job
  useEffect(() => {
    if (myJob) {
      setActiveTab("active");
      // Check if OTP was already sent previously to restore UI state
      if (myJob.otp_generated_at && !myJob.otp_verified) {
        setOtpSent(true);
      }
    }
  }, [myJob]);

  /* ---------------- LOAD DATA ---------------- */
  const load = async () => {
    setLoadingData(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;

    // 1. Fetch Available Jobs (Pool)
    // delivery_mode='onsite' -> status='DELIVERY'
    // delivery_mode='office' -> status='WAIT_ATTENDANT'
    const { data: pool } = await supabase
      .from("jobs")
      .select("*")
      .or("and(status.eq.DELIVERY,delivery_mode.eq.onsite),and(status.eq.WAIT_ATTENDANT,delivery_mode.eq.office)")
      .is("assigned_to", null);


    // 2. Fetch My Active Job
    const { data: mine } = await supabase
      .from("jobs")
      .select("*")
      .eq("assigned_to", uid)
      .eq("assigned_role", "delivery")
      .neq("status", "COMPLETED") // Only active ones
      .limit(1);

    setAvailable(pool || []);
    setMyJob(mine?.[0] || null);

    // Reset OTP state if no job found
    if (!mine?.[0]) {
      setOtpSent(false);
      setOtpInput("");
    }
    setLoadingData(false);
  };

  useEffect(() => {
    load();

    // Set up real-time subscription for delivery jobs
    // Listen for both DELIVERY (onsite) and WAIT_ATTENDANT (office) status
    const subscription = supabase
      .channel('delivery-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs'
          // Note: PostgreSQL realtime doesn't support OR filters, so we listen to all changes
          // and filter will happen in the load() function
        },
        (payload) => {
          console.log('Delivery job change detected:', payload);
          // Only reload if the job status is relevant for delivery
          const job = payload.new as any;
          if (job && (job.status === 'DELIVERY' || job.status === 'WAIT_ATTENDANT')) {
            load();
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* ---------------- ACTIONS ---------------- */
  const accept = async (jobId: number) => {
    if (actionLoading) return;
    setActionLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      setActionLoading(false);
      return;
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        assigned_to: user.id,
        assigned_role: "delivery",
        status: "DELIVERY", // Everything becomes active DELIVERY now
      })
      .eq("job_id", jobId)
      .is("assigned_to", null);

    if (error) {
      alert("Somebody else took this job just now.");
      setActionLoading(false);
      return;
    }

    await supabase.from("job_workflow_logs").insert({
      job_id: jobId,
      stage: "DELIVERY",
      worker_id: user.id,
      worker_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Delivery Agent",
      time_in: new Date().toISOString(),
    });

    await load();
    setActionLoading(false);
  };
  const sendOtp = async () => {
    if (!myJob || actionLoading) return;
    setActionLoading(true);

    // ⏱️ Cooldown check
    const { data: existing, error: existingError } = await supabase
      .from("jobs")
      .select("otp_generated_at")
      .eq("job_id", myJob.job_id)
      .single();

    if (existingError) {
      setActionLoading(false);
      return alert("Unable to check OTP status. Try again.");
    }

    if (existing?.otp_generated_at) {
      const elapsed =
        Date.now() - new Date(existing.otp_generated_at).getTime();

      if (elapsed < 2 * 60 * 1000) {
        setActionLoading(false);
        return alert("Please wait 2 minutes before resending OTP");
      }
    }

    const otp = generateOTP();

    // 1️⃣ Save OTP ONCE
    const { error: otpError } = await supabase
      .from("jobs")
      .update({
        otp_code: otp,
        otp_verified: false,
        otp_generated_at: new Date().toISOString(),
        otp_attempts: 0,
      })
      .eq("job_id", myJob.job_id);

    if (otpError) {
      setActionLoading(false);
      return alert("Failed to generate OTP");
    }

    // 2️⃣ Send WhatsApp OTP
    const { error: waError } = await supabase.functions.invoke(
      "send-whatsapp",
      {
        body: {
          type: "OTP",
          job_id: myJob.job_id,
          phone: myJob.phone,
        },
      }
    );

    setActionLoading(false);

    if (waError) {
      console.error("Delivery OTP WhatsApp error:", waError);
      return alert("Failed to send OTP via WhatsApp");
    }

    setOtpSent(true);
  };
  const verifyOtpAndComplete = async () => {
    if (!myJob || actionLoading) return;

    const enteredOtp = otpInput.replace(/\s+/g, "");
    if (enteredOtp.length !== 6) {
      setErrorMsg("Enter 6-digit OTP");
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);

    const jobId = myJob.job_id;

    const { data, error } = await supabase
      .from("jobs")
      .select("otp_code, otp_generated_at, otp_attempts")
      .eq("job_id", jobId)
      .single();

    if (error || !data) {
      setActionLoading(false);
      return alert("Job not found");
    }

    if ((data.otp_attempts ?? 0) >= 3) {
      setErrorMsg("Too many attempts. Resend OTP.");
      setActionLoading(false);
      return;
    }

    const expired =
      Date.now() - new Date(data.otp_generated_at).getTime() >
      10 * 60 * 1000;

    if (expired) {
      setErrorMsg("OTP expired. Please resend.");
      setActionLoading(false);
      return;
    }

    if (data.otp_code !== enteredOtp) {
      await supabase
        .from("jobs")
        .update({ otp_attempts: (data.otp_attempts ?? 0) + 1 })
        .eq("job_id", jobId);

      setErrorMsg("Invalid OTP. Try again.");
      setActionLoading(false);
      return;
    }

    // ✅ Payment Check
    // Calculate balance dynamically as (cost - advance)
    const total = Number(myJob.cost) || 0;
    const adv = Number(myJob.advance) || 0;
    const due = total - adv;

    if (due > 0) {
      const confirmPayment = window.confirm(
        `💰 Collect Pending Amount: ₹${due}\n\nConfirm payment received?`
      );
      if (!confirmPayment) {
        setActionLoading(false);
        return;
      }
    }

    // ✅ OTP VERIFIED → COMPLETE DELIVERY & UPDATE PAYMENT
    await supabase.from("jobs").update({
      otp_verified: true,
      otp_code: null,
      status: "COMPLETED",
      assigned_to: null,
      assigned_role: null,
      advance: total, // Auto-mark as fully paid
      balance: 0
    }).eq("job_id", jobId);

    const { data: auth } = await supabase.auth.getUser();

    await supabase.from("job_workflow_logs").update({
      time_out: new Date().toISOString(),
    })
      .eq("job_id", jobId)
      .eq("stage", "DELIVERY")
      .eq("worker_id", auth.user?.id)
      .is("time_out", null);

    // Thank you WhatsApp
    await supabase.functions.invoke("send-whatsapp", {
      body: { type: "THANK_YOU", job_id: jobId },
    });

    // Reset UI
    setOtpInput("");
    setOtpSent(false);
    setMyJob(null);
    setActiveTab("list");
    setActionLoading(false);
    load();
  };

  /* ---------------- UI RENDER ---------------- */
  return (
    <div style={{ background: colors.background, minHeight: "100vh", paddingBottom: isMobile ? 80 : 0 }}>
      <Header title="Delivery App" />

      {/* Mobile Tab Switcher */}
      {isMobile && (
        <div style={styles.mobileTabs}>
          <button
            style={activeTab === "list" ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab("list")}
          >
            📋 Pool ({available.length})
          </button>
          <button
            style={activeTab === "active" ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab("active")}
          >
            🚚 My Job ({myJob ? 1 : 0})
          </button>
        </div>
      )}

      <div style={isMobile ? styles.mobileLayout : styles.desktopLayout}>

        {/* === LEFT COLUMN: AVAILABLE JOBS === */}
        {(!isMobile || activeTab === "list") && (
          <div style={styles.listContainer}>
            <div style={styles.sectionHeader}>
              <span style={styles.heading}>Available for Pickup</span>
              <button onClick={load} style={styles.refreshBtn}>🔄</button>
            </div>

            {loadingData ? (
              <div style={{ padding: 20, textAlign: "center" }}>Loading...</div>
            ) : available.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: '#94a3b8' }}>No jobs available</div>
            ) : (
              <div style={styles.scrollArea}>
                {[...available].sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0)).map(j => (
                  <div key={j.job_id} style={j.is_urgent ? { ...styles.card, ...styles.urgentCard } : styles.card}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={styles.cardTitle}>{j.customer_name}</div>
                        {j.is_urgent && <span style={styles.urgentBadge}>URGENT</span>}
                      </div>

                      <div style={styles.cardMeta}>
                        {j.delivery_mode === 'office' ? '🏢 Office Pickup' : '🚚 Onsite Delivery'} • {j.phone || "Unknown Area"}
                      </div>
                    </div>
                    <button
                      disabled={actionLoading}
                      onClick={() => accept(j.job_id)}
                      style={styles.accept}
                    >
                      {actionLoading ? "..." : "Accept"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === RIGHT COLUMN: WORKBENCH === */}
        {(!isMobile || activeTab === "active") && (
          <div style={styles.workbench}>
            {!myJob ? (
              <div style={styles.emptyWorkbench}>
                <div style={{ fontSize: '40px' }}>📦</div>
                <div style={styles.emptyText}>You have no active deliveries.</div>
                <button onClick={() => setActiveTab('list')} style={{ marginTop: 10, color: '#3b82f6', background: 'none', border: 'none' }}>Go to list</button>
              </div>
            ) : (
              <div style={styles.activeContent}>
                <div style={styles.jobHeader}>
                  <span style={styles.statusBadge}>IN PROGRESS</span>
                  <h2 style={styles.customerName}>{myJob.customer_name}</h2>
                  <div style={styles.cardMeta}>📞 {myJob.phone}</div>
                  <div style={{ ...styles.cardMeta, marginBottom: 20 }}>
                    <div style={styles.cardMeta}>{myJob.delivery_mode === 'office' ? '🏢 Office Pickup' : '🚚 Onsite Delivery'} • {myJob.area}</div>

                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', color: '#c2410c', fontWeight: 'bold', fontSize: '18px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Pending Balance:</span>
                      <span>₹{Number(myJob.cost || 0) - Number(myJob.advance || 0)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  {!otpSent ? (
                    <div style={styles.actionBox}>
                      <h3 style={styles.boxTitle}>Delivery Confirmation</h3>
                      <p style={styles.boxText}>
                        When you reach the customer location, send the OTP to verify identity.
                      </p>
                      <button
                        onClick={sendOtp}
                        disabled={actionLoading}
                        style={styles.btnAction}
                      >
                        {actionLoading ? "Sending..." : "🔐 Send OTP via WhatsApp"}
                      </button>
                    </div>
                  ) : (
                    <div style={styles.actionBox}>
                      <h3 style={styles.boxTitle}>Enter Customer OTP</h3>
                      <p style={styles.boxText}>OTP sent to {myJob.phone}. Ask customer.</p>

                      <input
                        value={otpInput}
                        onChange={e => setOtpInput(e.target.value)}
                        maxLength={6}
                        type="number"
                        placeholder="000000"
                        style={styles.input}
                      />

                      {errorMsg && <div style={{ color: 'red', marginBottom: 10 }}>{errorMsg}</div>}

                      <button
                        disabled={actionLoading || otpInput.length < 4}
                        onClick={verifyOtpAndComplete}
                        style={styles.btnDone}
                      >
                        {actionLoading ? "Verifying..." : "✅ Finish Delivery"}
                      </button>

                      <button
                        onClick={sendOtp}
                        style={{ marginTop: 12, background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', width: '100%' }}
                      >
                        Resend OTP
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div >
  );
}
