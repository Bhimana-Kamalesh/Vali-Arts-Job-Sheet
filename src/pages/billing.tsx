import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Header from "../components/Header";
import type { Job } from "../lib/types";

export default function Billing() {
  const [available, setAvailable] = useState<Job[]>([]);
  const [myJob, setMyJob] = useState<Job | null>(null);

  // 🔒 Universal single-job lock (Logic preserved)
  const canAccept = async (uid: string) => {
    const { data } = await supabase
      .from("jobs")
      .select("job_id")
      .eq("assigned_to", uid)
      .eq("assigned_role", "billing")
      .neq("status", "COMPLETED");

    return !data || data.length === 0;
  };

  const load = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;

    const { data: pool } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "WAIT_BILLING")
      .is("assigned_to", null);

    const { data: mine } = await supabase
      .from("jobs")
      .select("*")
      .eq("assigned_to", uid)
      .eq("assigned_role", "billing")
      .neq("status", "COMPLETED")
      .limit(1);

    setAvailable(pool || []);
    setMyJob(mine?.[0] || null);
  };

  useEffect(() => {
    load();
  }, []);

  const accept = async (id: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const allowed = await canAccept(user.id);
    if (!allowed) {
      alert("Please complete your current billing job first.");
      return;
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        assigned_to: user.id,
        assigned_role: "billing",
        status: "BILLING",
      })
      .eq("job_id", id)
      .eq("status", "WAIT_BILLING")
      .is("assigned_to", null);

    if (error) {
      alert("Job already taken by someone else");
      return;
    }

    const workerName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Accountant";
    await supabase.from("job_workflow_logs").insert({
      job_id: id,
      stage: "BILLING",
      worker_id: user.id,
      worker_name: workerName,
      time_in: new Date().toISOString()
    });

    load();
  };

  const generateBill = async (job: Job) => {
    const doc = new jsPDF();

    const totalCost = Number(job.cost) || 0;
    const advancePaid = Number(job.advance) || 0;
    const balanceDue = totalCost - advancePaid;

    // ---------- HEADER ----------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("VALI ARTS AND DIGITAL", 14, 20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      "74-12-38A, New RTC Colony, Patamata, Vijayawada-7",
      14,
      26
    );
    doc.text("Cell: +91 7993402115, Ph: 0866-2974729", 14, 31);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 150, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: ${job.bill_no || "N/A"}`, 150, 26);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 31);

    doc.line(14, 38, 196, 38);

    // ---------- CUSTOMER ----------
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 14, 48);

    doc.setFont("helvetica", "normal");
    doc.text(job.customer_name, 14, 54);
    doc.text(`Phone: ${job.phone}`, 14, 60);
    doc.text(`Area: ${job.area || "N/A"}`, 14, 66);

    // ---------- TABLE ----------
    autoTable(doc, {
      startY: 75,
      head: [["Description", "Material", "Size", "Qty", "Total"]],
      body: [
        [
          job.description || job.job_type || "N/A",
          job.material || "Standard",
          job.size || "N/A",
          job.quantity || "1",
          `Rs. ${totalCost.toFixed(2)}`,
        ],
      ],
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.text("Subtotal:", 140, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(`Rs. ${totalCost.toFixed(2)}`, 175, finalY);

    doc.setFont("helvetica", "bold");
    doc.text("Advance:", 140, finalY + 7);
    doc.setFont("helvetica", "normal");
    doc.text(`- Rs. ${advancePaid.toFixed(2)}`, 175, finalY + 7);

    doc.line(140, finalY + 11, 195, finalY + 11);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("BALANCE DUE:", 120, finalY + 18);
    doc.text(`Rs. ${balanceDue.toFixed(2)}`, 175, finalY + 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for your business!", 14, finalY + 30);

    // ---------- DOWNLOAD PDF ----------
    // Trigger download to user's computer
    doc.save(`Invoice_${job.bill_no || job.job_id}_${job.customer_name}.pdf`);

    // ---------- UPLOAD TO STORAGE ----------
    const pdfBlob = doc.output("blob");
    const fileName = `invoice-${job.job_id}-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(fileName, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      alert("Failed to upload invoice PDF to storage");
      return;
    }

    const { data } = supabase.storage
      .from("invoices")
      .getPublicUrl(fileName);

    const invoiceUrl = data.publicUrl;

    await supabase
      .from("jobs")
      .update({ invoice_pdf: invoiceUrl })
      .eq("job_id", job.job_id);

    alert("✅ Invoice downloaded and saved successfully");
  };



  const getFinancials = (j: Job) => {
    const total = parseFloat(j.cost as any) || 0;
    const adv = parseFloat(j.advance as any) || 0;
    return { total, adv, due: total - adv };
  };
  const done = async (job: Job) => {
    if (!job.design_url || job.design_url.trim() === "") {
      alert("Designer files not uploaded yet.");
      return;
    }


    if (!job.mode_of_payment) {
      alert("Mode of payment not selected.");
      return;
    }

    const confirm = window.confirm("Confirm payment received?");
    if (!confirm) return;

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "PRINTING",
        print_file_url: job.design_url,
        assigned_to: null,
        assigned_role: null,
        updated_at: new Date().toISOString(),

      })
      .eq("job_id", job.job_id)
      .eq("status", "BILLING");

    if (error) {
      alert(error.message);
      return;
    }

    await supabase
      .from("job_workflow_logs")
      .update({ time_out: new Date().toISOString() })
      .eq("job_id", job.job_id)
      .eq("stage", "BILLING")
      .is("time_out", null);

    setMyJob(null);

    // ✅ REFRESH QUEUE
    load();

    alert("✅ Job sent to printing");
  };
  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Header title="Billing & Accounts" />

      <div style={styles.mainLayout}>
        {/* LEFT: QUEUE */}
        <div style={styles.sideColumn}>
          <div style={styles.sectionHeader}>
            <span style={styles.dotAvailable} />
            <h3 style={styles.heading}>Incoming Pool</h3>
            <span style={styles.badge}>{available.length}</span>
          </div>

          <div style={styles.scrollArea}>
            {available.length === 0 && (
              <p style={styles.emptyText}>No pending bills.</p>
            )}
            {available.sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0)).map(j => (
              <div key={j.job_id} style={j.is_urgent ? { ...styles.card, ...styles.urgentCard } : styles.card}>
                <div style={styles.cardInfo}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={styles.cardTitle}>{j.bill_no}</div>
                    {j.is_urgent && <span style={styles.urgentBadge}>URGENT</span>}
                  </div>
                  <div style={styles.cardMeta}>{j.customer_name} • ₹{j.cost}</div>
                </div>
                <button onClick={() => accept(j.job_id)} style={styles.btnAccept}>
                  Process
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: WORKBENCH */}
        <div style={styles.workbench}>
          <div style={styles.sectionHeader}>
            <span style={styles.dotActive} />
            <h3 style={styles.heading}>Active Workbench</h3>
          </div>

          {myJob ? (
            <div style={styles.activeContent}>
              <div style={styles.jobDetailsHeader}>
                <div>
                  <h2 style={styles.customerName}>{myJob.customer_name}</h2>
                  <span style={styles.idBadge}>Bill No: {myJob.bill_no}</span>
                </div>
                <div style={styles.statusTag}>BILLING IN PROGRESS</div>
              </div>

              <div style={styles.financialContainer}>
                <label style={styles.label}>Financial Breakdown</label>
                <div style={styles.financialBox}>
                  <div style={styles.finRow}>
                    <span>Total Cost:</span>
                    <span>₹{getFinancials(myJob).total.toLocaleString()}</span>
                  </div>
                  <div style={{ ...styles.finRow, color: "#ef4444" }}>
                    <span>Advance Paid:</span>
                    <span>- ₹{getFinancials(myJob).adv.toLocaleString()}</span>
                  </div>
                  <div style={styles.divider} />
                  <div style={styles.totalDueRow}>
                    <span>Total Due:</span>
                    <span>₹{getFinancials(myJob).due.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div style={styles.actionSection}>
                <label style={styles.label}>Post-Billing Actions</label>
                <div style={styles.btnGrid}>
                  <button onClick={() => generateBill(myJob)} style={styles.btnPdf}>
                    📄 Generate Invoice PDF
                  </button>
                  <button onClick={() => done(myJob)} style={styles.btnComplete}>
                    ✅ Confirm Payment & Send to Print
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyWorkbench}>
              <div style={styles.emptyIcon}>🧾</div>
              <h4>No Active Bill</h4>
              <p>Claim a job from the pool to generate an invoice</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  mainLayout: { display: "grid", gridTemplateColumns: "350px 1fr", gap: "24px", padding: "24px", maxWidth: "1400px", margin: "0 auto" },
  sideColumn: { backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", overflow: "hidden" },
  workbench: { backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", height: "calc(100vh - 120px)", overflowY: "auto" },
  sectionHeader: { padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px" },
  heading: { margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" },
  scrollArea: { padding: "12px", overflowY: "auto", flex: 1 },
  card: { padding: "16px", borderRadius: "10px", backgroundColor: "#fff", border: "1px solid #f1f5f9", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" },
  cardTitle: { fontWeight: 600, color: "#334155", fontSize: "14px" },
  cardMeta: { fontSize: "12px", color: "#64748b", marginTop: "4px" },
  btnAccept: { backgroundColor: "#eff6ff", color: "#2563eb", border: "none", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
  activeContent: { display: "flex", flexDirection: "column", gap: "24px" },
  jobDetailsHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  customerName: { margin: 0, fontSize: "24px", color: "#0f172a" },
  idBadge: { fontSize: "12px", color: "#94a3b8", fontWeight: 500 },
  statusTag: { backgroundColor: "#dcfce7", color: "#166534", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 },
  label: { display: "block", fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" },
  financialBox: { padding: "24px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" },
  finRow: { display: "flex", justifyContent: "space-between", marginBottom: "8px", color: "#475569", fontSize: "14px" },
  divider: { height: "1px", backgroundColor: "#e2e8f0", margin: "16px 0" },
  totalDueRow: { display: "flex", justifyContent: "space-between", color: "#0f172a", fontSize: "20px", fontWeight: 800 },
  btnGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  btnPdf: { backgroundColor: "#ef4444", color: "white", border: "none", padding: "14px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" },
  btnComplete: { backgroundColor: "#10b981", color: "white", border: "none", padding: "14px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" },
  emptyWorkbench: { textAlign: "center", padding: "80px 20px", color: "#94a3b8" },
  emptyIcon: { fontSize: "48px", marginBottom: "16px" },
  badge: { backgroundColor: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 },
  dotAvailable: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f59e0b" },
  dotActive: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3b82f6" },
  emptyText: { textAlign: "center", fontSize: "13px", color: "#94a3b8", marginTop: "40px" },

  // Urgent Job Styles
  urgentCard: {
    borderLeft: "4px solid #ef4444",
    backgroundColor: "#fff5f5",
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