import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import type { Job } from "../lib/types";
import { generateOTP } from "../utils/otp";
import { useTheme } from "../context/ThemeContext";

export default function Fixing() {
  const { colors, theme } = useTheme();

  const styles: Record<string, React.CSSProperties> = {
    // Layouts
    mainLayoutDesktop: { display: "grid", gridTemplateColumns: "350px 1fr", gap: "24px", padding: "24px", maxWidth: "1400px", margin: "0 auto", height: "calc(100vh - 80px)" },
    mainLayoutMobile: { display: "block", padding: "16px", paddingBottom: "80px" },

    // Containers
    sideColumn: { backgroundColor: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" },
    workbench: { backgroundColor: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}`, padding: "24px", height: "100%", overflowY: "auto", minHeight: "60vh" },

    // Mobile Tabs
    mobileTabContainer: { display: "flex", gap: "10px", padding: "0 16px 16px 16px" },
    mobileTab: { flex: 1, padding: "12px", borderRadius: "8px", border: `1px solid ${colors.border}`, backgroundColor: colors.card, fontWeight: 600, color: colors.subText },
    mobileTabActive: { flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #3b82f6", backgroundColor: theme === 'dark' ? '#18181b' : "#eff6ff", fontWeight: 700, color: "#2563eb" },

    // List Items
    sectionHeader: { padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: "10px" },
    heading: { margin: 0, fontSize: "16px", fontWeight: 700, color: colors.text },
    scrollArea: { padding: "12px", overflowY: "auto", flex: 1 },
    card: { padding: "16px", borderRadius: "10px", backgroundColor: colors.card, border: `1px solid ${colors.border}`, marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" },
    cardTitle: { fontWeight: 700, color: colors.text, fontSize: "15px", marginBottom: "4px" },
    cardMeta: { fontSize: "13px", color: colors.subText },
    instructionText: { fontSize: "11px", color: "#d97706", fontWeight: 700, marginTop: "6px", backgroundColor: "#fef3c7", display: "inline-block", padding: "2px 6px", borderRadius: "4px" },

    // Active Job UI
    activeContent: { display: "flex", flexDirection: "column", height: "100%" },
    jobHeader: { borderBottom: `1px solid ${colors.border}`, paddingBottom: "20px", marginBottom: "20px" },
    statusBadge: { display: 'inline-block', backgroundColor: '#f3e8ff', color: '#7e22ce', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', marginBottom: '8px' },
    customerName: { fontSize: "24px", margin: "0 0 16px 0", color: colors.text },
    infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
    infoBox: { padding: "16px", borderRadius: "8px", backgroundColor: colors.background, border: `1px solid ${colors.border}` },
    label: { display: "block", fontSize: "11px", fontWeight: 700, color: colors.subText, textTransform: "uppercase", marginBottom: "4px" },
    description: { margin: 0, color: colors.text, fontWeight: 600, fontSize: "15px" },

    // Action Boxes
    actionBox: { backgroundColor: theme === 'dark' ? '#18181b' : "#eff6ff", padding: "20px", borderRadius: "12px", border: theme === 'dark' ? '1px solid #3f3f46' : "1px solid #dbeafe", marginTop: "20px" },
    boxTitle: { fontSize: '16px', color: '#1e40af', marginTop: 0, marginBottom: '8px' },
    boxText: { color: colors.text, marginBottom: "16px", lineHeight: '1.5', fontSize: '14px' },

    // Buttons & Inputs
    btnAccept: { backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px" },
    btnDone: { padding: "16px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", width: "100%", fontSize: "16px" },
    input: { padding: "16px", borderRadius: "8px", border: `2px solid ${colors.border}`, width: "100%", fontSize: "20px", marginBottom: "16px", outline: "none", boxSizing: "border-box", textAlign: "center", letterSpacing: "4px", backgroundColor: colors.background, color: colors.text },
    mapLink: { display: "inline-block", fontSize: "13px", fontWeight: 600, color: "#2563eb", textDecoration: "none", backgroundColor: "#eff6ff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #dbeafe", marginTop: "8px" },
    phoneLink: { display: "inline-block", fontSize: "16px", fontWeight: 700, color: "#059669", textDecoration: "none", backgroundColor: "#ecfdf5", padding: "8px 12px", borderRadius: "8px", border: "1px solid #a7f3d0", marginTop: "4px" },

    // Empty States & Misc
    emptyWorkbench: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: colors.subText, textAlign: "center" },
    emptyIcon: { fontSize: "48px", marginBottom: "8px" },
    emptyText: { textAlign: "center", marginTop: "40px", color: colors.subText, fontSize: "14px" },
    badge: { backgroundColor: colors.background, padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, color: colors.subText, marginLeft: "auto" },
    dotAvailable: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f59e0b" },

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
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'active'>('list');

  // 🔐 OTP State
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------- RESPONSIVENESS ---------------- */
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (myJob) setActiveTab('active');
  }, [myJob]);

  /* ---------------- LOCK ---------------- */
  const canAccept = async (uid: string) => {
    const { data } = await supabase.from("jobs").select("job_id")
      .eq("assigned_to", uid).eq("assigned_role", "fixer").neq("status", "COMPLETED");
    return !data || data.length === 0;
  };

  /* ---------------- LOAD ---------------- */
  const load = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;

    const { data: pool } = await supabase.from("jobs").select("*")
      .eq("status", "FIXING").is("assigned_to", null);

    const { data: mine } = await supabase.from("jobs").select("*")
      .eq("assigned_to", uid).eq("assigned_role", "fixer").neq("status", "COMPLETED").limit(1);

    setAvailable(pool || []);
    setMyJob(mine?.[0] || null);

    // Reset local OTP state if no active job
    if (!mine?.[0]) {
      setOtpInput(""); setOtpSent(false);
    }
  };

  useEffect(() => {
    load();

    // Set up real-time subscription for fixing jobs
    const subscription = supabase
      .channel('fixer-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          // filter: 'status=eq.FIXING' // REMOVED FILTER to listen to all changes
        },
        (payload) => {
          console.log('Fixer job change detected:', payload);
          load();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* ---------------- ACCEPT ---------------- */
  const accept = async (id: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!(await canAccept(user.id))) {
      alert("Finish your current fixing job first.");
      return;
    }

    const { error } = await supabase.from("jobs").update({
      assigned_to: user.id, assigned_role: "fixer", status: "FIXING",
    }).eq("job_id", id).is("assigned_to", null);

    if (error) { alert("Job already taken"); return; }

    await supabase.from("job_workflow_logs").insert({
      job_id: id, stage: "FIXING", worker_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Fixer", time_in: new Date().toISOString(),
    });

    load();
  };

  /* ---------------- OTP SEND ---------------- */
  const sendFixerOtp = async () => {
    if (!myJob || loading) return;

    setLoading(true);

    const { data: existing, error: existingError } = await supabase
      .from("jobs")
      .select("otp_generated_at")
      .eq("job_id", myJob.job_id)
      .single();

    if (existingError) {
      setLoading(false);
      return alert("Unable to check OTP status. Try again.");
    }

    if (existing?.otp_generated_at) {
      const elapsed =
        Date.now() - new Date(existing.otp_generated_at).getTime();

      if (elapsed < 2 * 60 * 1000) {
        setLoading(false);
        return alert("Please wait 2 minutes before resending OTP");
      }
    }

    const otp = generateOTP();

    const { error: otpError } = await supabase
      .from("jobs")
      .update({
        otp_code: otp,
        otp_verified: false,
        otp_generated_at: new Date().toISOString(),
      })
      .eq("job_id", myJob.job_id);

    if (otpError) {
      setLoading(false);
      return alert("Failed to generate OTP");
    }

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

    setLoading(false);

    if (waError) {
      console.error("OTP WhatsApp error:", waError);
      return alert("Failed to send OTP via WhatsApp");
    }

    setOtpSent(true);
    alert("🔐 OTP sent to customer via WhatsApp");
  };


  const verifyOtpAndFinishFixing = async () => {
    if (!myJob || !otpInput) {
      alert("Enter OTP");
      return;
    }

    setLoading(true);

    const { data } = await supabase
      .from("jobs")
      .select("otp_code, otp_generated_at")
      .eq("job_id", myJob.job_id)
      .single();

    if (!data) {
      setLoading(false);
      return alert("Job not found");
    }

    // ⏱️ Expiry check (10 min)
    const expired =
      Date.now() - new Date(data.otp_generated_at).getTime() > 10 * 60 * 1000;

    if (expired) {
      setLoading(false);
      return alert("OTP expired. Send again.");
    }

    const enteredOtp = otpInput.replace(/\s+/g, "");

    if (data.otp_code !== enteredOtp) {
      setLoading(false);
      return alert("Invalid OTP");
    }

    // ✅ OTP verified → move job forward
    await supabase.from("jobs").update({
      otp_verified: true,
      otp_code: null,
      status: "DELIVERY", // or "READY_FOR_DELIVERY"
      assigned_to: null,
      assigned_role: null,
    }).eq("job_id", myJob.job_id);

    await supabase.from("job_workflow_logs")
      .update({ time_out: new Date().toISOString() })
      .eq("job_id", myJob.job_id)
      .eq("stage", "FIXING")
      .is("time_out", null);

    setLoading(false);
    setOtpInput("");
    setOtpSent(false);

    alert("✅ Fixing completed & OTP verified");
    load(); // reload jobs
  };

  /* ---------------- NON-OTP COMPLETE ---------------- */
  const doneWithoutOtp = async (job: Job) => {
    const confirm = window.confirm("Complete fixing?");
    if (!confirm) return;

    await supabase.from("jobs").update({
      status: "WAIT_ATTENDANT", assigned_to: null, assigned_role: "attendant",
    }).eq("job_id", job.job_id);

    await supabase.from("job_workflow_logs").update({ time_out: new Date().toISOString() })
      .eq("job_id", job.job_id).eq("stage", "FIXING").is("time_out", null);

    setMyJob(null);
    load();
    setActiveTab('list');
  };

  /* ---------------- UI ---------------- */
  return (
    <div style={{ backgroundColor: colors.background, minHeight: "100vh", paddingBottom: isMobile ? "80px" : "0" }}>
      <Header title="Fixing & Framing" />

      {/* MOBILE TABS */}
      {isMobile && (
        <div style={styles.mobileTabContainer}>
          <button style={activeTab === 'list' ? styles.mobileTabActive : styles.mobileTab} onClick={() => setActiveTab('list')}>
            📋 To Fix ({available.length})
          </button>
          <button style={activeTab === 'active' ? styles.mobileTabActive : styles.mobileTab} onClick={() => setActiveTab('active')}>
            🔨 Current ({myJob ? 1 : 0})
          </button>
        </div>
      )}

      <div style={isMobile ? styles.mainLayoutMobile : styles.mainLayoutDesktop}>

        {/* --- LEFT: AVAILABLE --- */}
        {(!isMobile || activeTab === 'list') && (
          <div style={styles.sideColumn}>
            {!isMobile && (
              <div style={styles.sectionHeader}>
                <div style={styles.dotAvailable}></div>
                <h3 style={styles.heading}>Pending Jobs</h3>
                <span style={styles.badge}>{available.length}</span>
              </div>
            )}

            <div style={styles.scrollArea}>
              {available.length === 0 ? (
                <div style={styles.emptyText}>No fixing jobs pending.</div>
              ) : (
                [...available].sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0)).map(j => (
                  <div key={j.job_id} style={j.is_urgent ? { ...styles.card, ...styles.urgentCard } : styles.card}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={styles.cardTitle}>{j.bill_no}</div>
                        {j.is_urgent && <span style={styles.urgentBadge}>URGENT</span>}
                      </div>
                      <div style={styles.cardMeta}>{j.size || "Unknown Size"}</div>
                      {j.delivery_mode === "onsite" && <div style={styles.instructionText}>🏠 Onsite Fix</div>}
                    </div>
                    <button onClick={() => accept(j.job_id)} style={styles.btnAccept}>Start</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}


        {/* --- RIGHT: WORKBENCH --- */}
        {(!isMobile || activeTab === 'active') && (
          <div style={styles.workbench}>
            {myJob ? (
              <div style={styles.activeContent}>
                {/* Header Info */}
                <div style={styles.jobHeader}>
                  <div style={styles.statusBadge}>IN PROGRESS</div>
                  <h2 style={styles.customerName}>{myJob.bill_no} • {myJob.customer_name}</h2>

                  {/* Size & Type Grid */}
                  <div style={styles.infoGrid}>
                    <div style={styles.infoBox}>
                      <span style={styles.label}>Size</span>
                      <p style={styles.description}>{myJob.size || "N/A"}</p>
                    </div>
                    <div style={styles.infoBox}>
                      <span style={styles.label}>Mode</span>
                      <p style={styles.description}>{myJob.delivery_mode === "onsite" ? "🏠 Onsite" : "🏢 In-Shop"}</p>
                    </div>
                  </div>

                  {/* Address (Only for Onsite) */}
                  {myJob.delivery_mode === "onsite" && (
                    <>
                      <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>📍</span>
                        <div>
                          <div style={{ fontWeight: 600, color: '#334155' }}>Location</div>
                          <div style={{ color: '#64748b' }}>{myJob.area || "No address"}</div>
                          {(myJob.area) && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(myJob.area || "")}`}
                              target="_blank" rel="noopener noreferrer"
                              style={styles.mapLink}
                            >
                              Open in Google Maps ↗
                            </a>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>📞</span>
                        <div>
                          <div style={{ fontWeight: 600, color: '#334155' }}>Contact Customer</div>
                          <a href={`tel:${myJob.phone}`} style={styles.phoneLink}>
                            {myJob.phone} <span style={{ fontSize: '11px', marginLeft: '4px' }}>↗</span>
                          </a>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Area */}
                <div style={{ marginTop: 'auto' }}>
                  {myJob.delivery_mode === "onsite" ? (
                    /* ONSITE LOGIC (OTP REQ) */
                    <div style={otpSent ? { ...styles.actionBox, backgroundColor: '#f0fdf4', borderColor: '#dcfce7' } : styles.actionBox}>
                      <h3 style={styles.boxTitle}>{otpSent ? "Verify OTP" : "Onsite Completion"}</h3>
                      <p style={styles.boxText}>{otpSent ? "Enter code from customer" : "Job requires customer verification."}</p>

                      {otpSent ? (
                        <>
                          <input
                            type="tel"
                            maxLength={6}
                            placeholder="000 000"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            style={styles.input}
                          />
                          <button
                            onClick={verifyOtpAndFinishFixing}
                            disabled={loading}
                            style={styles.btnDone}
                          >
                            ✅ Verify & Complete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={sendFixerOtp}
                          disabled={loading}
                          style={styles.btnDone}
                        >
                          🔐 Send OTP to Finish
                        </button>

                      )}
                    </div>
                  ) : (
                    /* IN-SHOP LOGIC (NO OTP) */
                    <div style={styles.actionBox}>
                      <h3 style={styles.boxTitle}>Job Completion</h3>
                      <p style={styles.boxText}>Once the frame is fixed, mark it as done to notify the attendant.</p>
                      <button onClick={() => doneWithoutOtp(myJob)} style={styles.btnDone}>
                        ✅ Complete Fixing
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={styles.emptyWorkbench}>
                <div style={styles.emptyIcon}>🔨</div>
                <h3 style={{ marginTop: '16px', color: '#1e293b' }}>Ready to Fix</h3>
                <p style={{ color: '#64748b' }}>Select a job to start working.</p>
                {isMobile && (
                  <button style={{ marginTop: '20px', ...styles.btnAccept }} onClick={() => setActiveTab('list')}>
                    View Pending Jobs
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
