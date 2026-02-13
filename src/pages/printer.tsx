import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import type { Job } from "../lib/types";
import { useTheme } from "../context/ThemeContext";

export default function Printer() {
  const { colors, theme } = useTheme();

  const styles: Record<string, React.CSSProperties> = {
    mainLayout: { display: "grid", gridTemplateColumns: "350px 1fr", gap: "24px", padding: "24px", maxWidth: "1400px", margin: "0 auto" },
    sideColumn: { backgroundColor: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", overflow: "hidden" },
    workbench: { backgroundColor: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}`, padding: "24px", height: "calc(100vh - 120px)", overflowY: "auto" },
    sectionHeader: { padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: "10px" },
    heading: { margin: 0, fontSize: "15px", fontWeight: 700, color: colors.text },
    scrollArea: { padding: "12px", overflowY: "auto", flex: 1 },
    card: { padding: "16px", borderRadius: "10px", backgroundColor: colors.card, border: `1px solid ${colors.border}`, marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    cardTitle: { fontWeight: 600, color: colors.text, fontSize: "14px" },
    cardMeta: { fontSize: "12px", color: colors.subText, marginTop: "4px" },
    linkDownload: { fontSize: "11px", fontWeight: 700, color: "#3b82f6", marginTop: "6px", display: "block", textDecoration: "none" },
    btnAccept: { backgroundColor: "#eff6ff", color: "#2563eb", border: "none", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
    activeContent: { display: "flex", flexDirection: "column", gap: "24px" },
    jobDetailsHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    customerName: { margin: 0, fontSize: "24px", color: colors.text },
    idBadge: { fontSize: "12px", color: colors.subText, fontWeight: 500 },
    statusTag: { backgroundColor: "#fef3c7", color: "#92400e", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 },
    infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
    infoBox: { padding: "20px", borderRadius: "12px", backgroundColor: colors.background, border: `1px solid ${colors.border}` },
    label: { display: "block", fontSize: "11px", fontWeight: 800, color: colors.subText, textTransform: "uppercase", marginBottom: "8px" },
    description: { margin: 0, color: colors.text, lineHeight: "1.5", fontSize: "15px", fontWeight: 600 },
    btnDownloadLarge: { display: "inline-block", backgroundColor: "#3b82f6", color: "white", padding: "10px 16px", borderRadius: "6px", textDecoration: "none", fontWeight: 600, fontSize: "13px" },
    actionSection: { marginTop: "10px", display: "flex", flexDirection: "column", gap: "12px" },
    postPrintNote: { fontSize: "13px", fontWeight: 700, textAlign: "center" },
    btnDone: { width: "100%", padding: "16px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" },
    emptyWorkbench: { textAlign: "center", padding: "80px 20px", color: colors.subText },
    emptyIcon: { fontSize: "48px", marginBottom: "16px" },
    badge: { backgroundColor: colors.background, color: colors.subText, padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 },
    dotAvailable: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f59e0b" },
    dotActive: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444" },
    emptyText: { textAlign: "center", fontSize: "13px", color: colors.subText, marginTop: "40px" },

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
  const [myJobs, setMyJobs] = useState<Job[]>([]);


  // 🔒 Lock: Only one active print job per user
  const canAccept = async (uid: string) => {
    const { data } = await supabase
      .from("jobs")
      .select("job_id")
      .eq("assigned_to", uid)
      .eq("assigned_role", "printer")
      .neq("status", "COMPLETED");


    return !data || data.length === 0;
  };

  const load = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;

    // Jobs waiting for printing
    const { data: pool } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "PRINTING")
      .is("assigned_to", null);

    // My active printing jobs
    const { data: mine } = await supabase

      .from("jobs")
      .select("*")
      .eq("assigned_to", uid)
      .eq("assigned_role", "printer")
      .neq("status", "COMPLETED");
    setAvailable(pool || []);
    setMyJobs(mine || []);

  };


  useEffect(() => {
    load();

    // Set up real-time subscription for jobs table
    const subscription = supabase
      .channel('printer-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          // filter: 'status=eq.PRINTING' // REMOVED FILTER to listen to all changes
        },
        (payload) => {
          console.log('Printer job change detected:', payload);
          load();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);


  // ✅ START PRINTING
  const accept = async (id: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const allowed = await canAccept(user.id);
    if (!allowed) {
      alert("Please finish your current print job first.");
      return;
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        assigned_to: user.id,
        assigned_role: "printer",
        status: "PRINTING",
      })
      .eq("job_id", id)
      .eq("status", "PRINTING")
      .is("assigned_to", null);

    if (error) {
      alert("Job already taken by someone else");
      return;
    }


    const workerName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Printer";
    await supabase.from("job_workflow_logs").insert({
      job_id: id,
      stage: "PRINTING",
      worker_name: workerName,
      time_in: new Date().toISOString(),
    });

    load();
  };

  // ✅ FINISH PRINTING
  const done = async (job: Job) => {
    let nextStatus: string;
    let nextRole: string | null = null;

    if (job.needs_fixing) {
      nextStatus = "FIXING";
      nextRole = "fixer";
    } else if (job.delivery_mode === "onsite") {
      nextStatus = "DELIVERY";
      nextRole = "delivery";
    } else {
      nextStatus = "WAIT_ATTENDANT";
      nextRole = "attendant";
    }

    const { error } = await supabase.from("jobs").update({
      status: nextStatus,
      assigned_to: null,
      assigned_role: nextRole,
    }).eq("job_id", job.job_id);

    if (error) {
      alert("Error updating job status");
      return;
    }

    await supabase.from("job_workflow_logs")
      .update({ time_out: new Date().toISOString() })
      .eq("job_id", job.job_id)
      .eq("stage", "PRINTING")
      .is("time_out", null);

    load();
  };

  return (
    <div style={{ backgroundColor: colors.background, minHeight: "100vh" }}>
      <Header title="Printing Department" />

      <div style={styles.mainLayout}>
        {/* LEFT: PRINT QUEUE */}
        <div style={styles.sideColumn}>
          <div style={styles.sectionHeader}>
            <span style={styles.dotAvailable} />
            <h3 style={styles.heading}>Print Queue</h3>
            <span style={styles.badge}>{available.length}</span>
          </div>

          <div style={styles.scrollArea}>
            {available.length === 0 && (
              <p style={styles.emptyText}>No files waiting to print.</p>
            )}

            {[...available].sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0)).map(j => (
              <div key={j.job_id} style={j.is_urgent ? { ...styles.card, ...styles.urgentCard } : styles.card}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={styles.cardTitle}>{j.bill_no}</div>
                    {j.is_urgent && <span style={styles.urgentBadge}>URGENT</span>}
                  </div>
                  <div style={styles.cardMeta}>
                    {j.size} • {j.material || "Flex"}
                  </div>
                  {/* 👇 RESTORED: Download Link in Queue */}

                </div>

                <button
                  onClick={() => accept(j.job_id)}
                  style={styles.btnAccept}
                >
                  Start
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: ACTIVE MACHINE */}
        <div style={styles.workbench}>
          <div style={styles.sectionHeader}>
            <span style={styles.dotActive} />
            <h3 style={styles.heading}>Active Machine</h3>
          </div>

          {myJobs.length > 0 ? (
            myJobs.map(j => (
              <div key={j.job_id} style={styles.activeContent}>
                <div style={styles.jobDetailsHeader}>
                  <div>
                    <h2 style={styles.customerName}>{j.customer_name}</h2>
                    <span style={styles.idBadge}>
                      Bill No: {j.bill_no}
                    </span>
                  </div>
                  <div style={styles.statusTag}>PRINTING</div>
                </div>

                <div style={styles.infoGrid}>
                  <div style={styles.infoBox}>
                    <label style={styles.label}>Material & Quantity</label>
                    <p style={styles.description}>
                      {j.quantity} Units • {j.material || "Standard Flex"}
                    </p>
                  </div>

                  <div style={styles.infoBox}>
                    <label style={styles.label}>Dimensions</label>
                    <p style={styles.description}>{j.size}</p>
                  </div>

                  {/* 👇 RESTORED: Dedicated Download Box for Active Job */}

                </div>

                <div style={styles.actionSection}>
                  <div
                    style={{
                      ...styles.postPrintNote,
                      color: j.needs_fixing ? "#f59e0b" : "#10b981",
                    }}
                  >
                    {j.needs_fixing
                      ? "⚠️ Goes to Fixer after printing"
                      : j.delivery_mode === "onsite"
                        ? "🚚 Goes to Delivery"
                        : "🏢 Goes to Attendant"}
                  </div>

                  {/* 🖼️ DESIGN FILE PREVIEW */}
                  {(() => {
                    const designUrls = j.print_file_url?.split(",").map((u: string) => u.trim()) || [];
                    return designUrls.length > 0 && (
                      <div style={{ marginTop: "20px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>
                          🎨 Design Files
                        </h4>

                        {designUrls.map((url: string, index: number) => {
                          const isImage = url.match(/\.(jpg|jpeg|png|webp)$/i);
                          const isPdf = url.match(/\.pdf$/i);

                          return (
                            <div key={index} style={{ marginBottom: "12px" }}>
                              {isImage && (
                                <img
                                  src={url}
                                  alt="Design"
                                  style={{
                                    width: "100%",
                                    borderRadius: "8px",
                                    border: "1px solid #e2e8f0",
                                  }}
                                />
                              )}

                              {isPdf && (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={styles.btnDownloadLarge}
                                >
                                  ⬇️ Download PDF Design
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => done(j)}
                    style={styles.btnDone}
                  >
                    ✅ Mark Printed & Cut
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={styles.emptyWorkbench}>
              <div style={styles.emptyIcon}>🖨️</div>
              <h4>Machine is Idle</h4>
              <p>Claim a job from the queue to start production</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
