import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import type { Job, JobItem } from "../lib/types";
import { useTheme } from "../context/ThemeContext";

// Define interface for images to avoid TS errors
interface MeasurementFile {
  id: number;
  file_url: string;
  file_type: string;
}

export default function Designer() {
  const { colors, theme } = useTheme();

  const styles: Record<string, React.CSSProperties> = {
    mainLayout: {
      display: "grid",
      gridTemplateColumns: "350px 1fr",
      gap: "24px",
      padding: "24px",
      maxWidth: "1400px",
      margin: "0 auto",
    },
    queueSidebar: {
      backgroundColor: colors.card,
      borderRadius: "12px",
      border: `1px solid ${colors.border}`,
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 120px)",
      overflow: "hidden",
    },
    workbench: {
      backgroundColor: colors.card,
      borderRadius: "12px",
      border: `1px solid ${colors.border}`,
      padding: "24px",
      height: "calc(100vh - 120px)",
      overflowY: "auto",
    },
    sectionHeader: {
      padding: "20px",
      borderBottom: `1px solid ${colors.border}`,
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    heading: { margin: 0, fontSize: "16px", fontWeight: 700, color: colors.text },
    scrollArea: { padding: "12px", overflowY: "auto", flex: 1 },
    card: {
      padding: "16px",
      borderRadius: "10px",
      backgroundColor: colors.card,
      border: `1px solid ${colors.border}`,
      marginBottom: "12px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      transition: "transform 0.1s ease",
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    },
    cardTitle: { fontWeight: 600, color: colors.text, fontSize: "14px" },
    cardMeta: { fontSize: "12px", color: colors.subText, marginTop: "4px" },
    btnAccept: {
      backgroundColor: "#eff6ff",
      color: "#2563eb",
      border: "none",
      padding: "8px 12px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
    },
    activeContent: { display: "flex", flexDirection: "column", gap: "24px" },
    jobDetailsHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    customerName: { margin: 0, fontSize: "24px", color: colors.text },
    idBadge: { fontSize: "12px", color: colors.subText, fontWeight: 500 },
    statusTag: { backgroundColor: "#fef3c7", color: "#92400e", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 },
    infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
    infoBox: { padding: "16px", borderRadius: "8px", backgroundColor: colors.background, border: `1px solid ${colors.border}` },

    // Item Display Styles
    itemsSection: { marginBottom: "20px" },
    sectionLabel: { display: "block", fontSize: "14px", fontWeight: 700, color: colors.text, marginBottom: "16px", textTransform: "uppercase" as const },
    designFilesContainer: { marginTop: "8px", marginBottom: "8px", padding: "8px", backgroundColor: theme === 'dark' ? '#262626' : "#f5f5f5", borderRadius: "6px", border: `1px solid ${colors.border}` },
    itemCard: { padding: "16px", marginBottom: "16px", backgroundColor: colors.background, border: `2px solid ${colors.border}`, borderRadius: "8px" },
    itemHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${colors.border}` },
    itemNumber: { fontSize: "13px", fontWeight: 700, color: colors.subText, textTransform: "uppercase" as const },
    itemType: { fontSize: "12px", fontWeight: 600, color: "#2563eb", backgroundColor: "#eff6ff", padding: "4px 10px", borderRadius: "12px" },
    infoRow: { marginBottom: "12px" },
    label: { display: "block", fontSize: "12px", fontWeight: 700, color: colors.subText, textTransform: "uppercase", marginBottom: "8px" },
    description: { margin: 0, color: colors.text, lineHeight: "1.5" },
    previewContainer: { display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" },
    previewItem: { display: 'flex', alignItems: 'center' },
    previewBox: {
      background: "#dcfce7",
      border: "2px solid #22c55e",
      borderRadius: "6px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "#166534",
      fontWeight: 700,
      fontSize: "11px",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    },
    // New Styles for Image Grid
    imageGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
      gap: "12px",
      marginTop: "10px"
    },
    measurementThumb: {
      width: "100%",
      height: "100px",
      objectFit: "cover",
      borderRadius: "6px",
      border: `1px solid ${colors.border}`,
      cursor: "pointer",
      transition: "opacity 0.2s"
    },
    uploadSection: { marginTop: "20px", padding: "24px", border: `2px dashed ${colors.border}`, borderRadius: "12px" },
    fileInputWrapper: { position: "relative", marginBottom: "20px" },
    fileInput: { opacity: 0, width: "100%", height: "80px", cursor: "pointer" },
    fileLabel: {
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      display: "flex", justifyContent: "center", alignItems: "center",
      backgroundColor: colors.card, color: colors.subText, borderRadius: "8px", border: `1px solid ${colors.border}`,
      pointerEvents: "none", fontSize: "14px"
    },
    btnDone: {
      width: "100%",
      padding: "16px",
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
    },
    btnDoneDisabled: { backgroundColor: colors.border, width: "100%", padding: "16px", borderRadius: "8px", color: colors.subText, border: "none" },
    emptyWorkbench: { textAlign: "center", padding: "60px 20px", color: colors.subText },
    emptyIcon: { fontSize: "48px", marginBottom: "16px" },
    badge: { backgroundColor: colors.background, color: colors.subText, padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 },
    dotAvailable: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f59e0b" },
    dotActive: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2563eb" },
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
  const [myJob, setMyJob] = useState<Job | null>(null);
  const [jobItems, setJobItems] = useState<JobItem[]>([]);

  // FIXED: Added missing state for images
  const [measurementImages, setMeasurementImages] = useState<MeasurementFile[]>([]);

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  /* ---------------- HELPERS ---------------- */

  const parseSizes = (size?: string) => {
    if (!size) return [];
    return size
      .split(",")
      .map(s => s.trim())
      .map(pair => {
        const [w, h] = pair.split("x").map(Number);
        if (!w || !h) return null;
        return { width: w, height: h };
      })
      .filter(Boolean) as { width: number; height: number }[];
  };

  const renderSizePreview = (width: number, height: number, index: number) => {
    const maxPreview = 140;
    const scale = Math.max(width, height) > 0 ? maxPreview / Math.max(width, height) : 1;

    return (
      <div key={index} style={styles.previewItem}>
        <div
          style={{
            width: Math.round(width * scale),
            height: Math.round(height * scale),
            ...styles.previewBox
          }}
        >
          {width} × {height}
        </div>
      </div>
    );
  };

  /* ---------------- DATA LOAD ---------------- */

  const load = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;

    const { data: pool } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "DESIGN")
      .is("assigned_to", null);

    const { data: mine } = await supabase
      .from("jobs")
      .select("*")
      .eq("assigned_to", uid)
      .eq("assigned_role", "designer")
      .eq("status", "DESIGN");

    setAvailable(pool || []);
    const currentJob = mine?.[0] || null;
    setMyJob(currentJob);

    // Load job items if there's an active job
    if (currentJob) {
      await loadJobItems(currentJob.job_id);
    } else {
      setJobItems([]);
    }
  };

  const loadJobItems = async (jobId: number) => {
    const { data, error } = await supabase
      .from("job_items")
      .select("*")
      .eq("job_id", jobId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Error loading job items:", error);
      setJobItems([]);
      return;
    }

    setJobItems(data || []);
  };

  useEffect(() => {
    load();

    // Set up real-time subscription for jobs table
    const subscription = supabase
      .channel('designer-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'jobs',
          // filter: 'status=eq.DESIGN' // REMOVED FILTER to listen to all changes
        },
        (payload) => {
          console.log('Job change detected:', payload);
          // Reload data when a job is inserted or updated
          load();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // FIXED: Logic to load images based on myJob
  const loadMeasurementImagesForDesigner = async (job: Job) => {
    if (!job.job_id) {
      setMeasurementImages([]);
      return;
    }

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      // FIXED: Usually files are linked via job_id
      .eq("job_id", job.job_id)
      .order("id", { ascending: true });

    if (error) {
      console.error("Error loading images:", error);
      return;
    }

    setMeasurementImages(data || []);
  };

  // FIXED: Watch 'myJob', not undefined 'selectedJob'
  useEffect(() => {
    if (myJob) {
      loadMeasurementImagesForDesigner(myJob);
    } else {
      setMeasurementImages([]);
    }
  }, [myJob]);

  /* ---------------- ACTIONS ---------------- */

  const accept = async (id: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (myJob) {
      alert("Please finish your current active job first.");
      return;
    }

    await supabase.from("jobs").update({
      assigned_to: user.id,
      assigned_role: "designer",
    }).eq("job_id", id);

    await supabase.from("job_workflow_logs").insert({
      job_id: id,
      stage: "DESIGN",
      worker_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Designer",
      user_id: user.id,
      time_in: new Date().toISOString(),
    });

    load();
  };

  const submitJobToBilling = async () => {
    if (!myJob || files.length === 0) {
      alert("Please upload at least one design file");
      return;
    }

    setUploading(true);

    try {
      const urls: string[] = [];

      for (const file of files) {
        const path = `${myJob.job_id}/${Date.now()}_${file.name}`;

        // 1️⃣ Upload to storage
        await supabase.storage
          .from("design-files")
          .upload(path, file, { upsert: true });

        // 2️⃣ Get public URL
        const { data } = supabase.storage
          .from("design-files")
          .getPublicUrl(path);

        urls.push(data.publicUrl);
      }

      // 3️⃣ SAVE URLs TO JOB (🔥 THIS IS THE KEY)
      await supabase.from("jobs").update({
        design_url: urls.join(","), // ✅ Billing & Printer rely on this
        status: "DESIGN_REVIEW", // Send to attendant for approval first
        assigned_to: null,
        assigned_role: null,
      }).eq("job_id", myJob.job_id);

      // 4️⃣ Close DESIGN workflow log
      await supabase.from("job_workflow_logs")
        .update({ time_out: new Date().toISOString() })
        .eq("job_id", myJob.job_id)
        .eq("stage", "DESIGN")
        .is("time_out", null);

      alert("✅ Files uploaded and sent for Attendant approval");
      setFiles([]);
      setMyJob(null);
      load();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to upload design files");
    } finally {
      setUploading(false);
    }
  };


  /* ---------------- UI ---------------- */

  return (
    <div style={{ backgroundColor: colors.background, minHeight: "100vh" }}>
      <Header title="Designer Portal" />

      <div style={styles.mainLayout}>
        {/* LEFT: QUEUE */}
        <div style={styles.queueSidebar}>
          <div style={styles.sectionHeader}>
            <span style={styles.dotAvailable} />
            <h3 style={styles.heading}>Incoming Pool</h3>
            <span style={styles.badge}>{available.length}</span>
          </div>

          <div style={styles.scrollArea}>
            {available.length === 0 && (
              <p style={styles.emptyText}>No jobs waiting in the queue.</p>
            )}
            {available.length === 0 && (
              <p style={styles.emptyText}>No jobs waiting in the queue.</p>
            )}
            {[...available].sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0)).map(j => (
              <div key={j.job_id} style={j.is_urgent ? { ...styles.card, ...styles.urgentCard } : styles.card}>
                <div style={styles.cardInfo}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={styles.cardTitle}>{j.bill_no} • {j.customer_name}</div>
                    {j.is_urgent && <span style={styles.urgentBadge}>URGENT</span>}
                  </div>
                  <div style={styles.cardMeta}>{j.job_type} • {j.size}</div>
                </div>
                <button onClick={() => accept(j.job_id)} style={styles.btnAccept}>
                  Claim
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
                  <span style={styles.idBadge}>ID: #{myJob.job_id}</span>
                </div>
                <div style={styles.statusTag}>IN PROGRESS</div>
              </div>

              {/* Job Items Display */}
              <div style={styles.itemsSection}>
                <label style={styles.sectionLabel}>Job Items ({jobItems.length || 1})</label>
                {jobItems.length > 0 ? (
                  jobItems.map((item, index) => (
                    <div key={item.id || index} style={styles.itemCard}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemNumber}>Item {index + 1}</span>
                        <span style={styles.itemType}>{item.job_type}</span>
                      </div>

                      {item.description && (
                        <div style={styles.infoRow}>
                          <label style={styles.label}>Description</label>
                          <p style={styles.description}>{item.description}</p>
                        </div>
                      )}

                      <div style={styles.infoRow}>
                        <label style={styles.label}>Dimensions</label>
                        <div style={styles.previewContainer}>
                          {parseSizes(item.size).map((s, i) => renderSizePreview(s.width, s.height, i))}
                        </div>
                      </div>

                      {item.quantity && (
                        <div style={styles.infoRow}>
                          <label style={styles.label}>Quantity</label>
                          <p style={styles.description}>{item.quantity}</p>
                        </div>
                      )}

                      {item.material && (
                        <div style={styles.infoRow}>
                          <label style={styles.label}>Material</label>
                          <p style={styles.description}>{item.material}</p>
                        </div>
                      )}

                      {item.cost && item.cost > 0 ? (
                        <div style={styles.infoRow}>
                          <label style={styles.label}>Extra Cost</label>
                          <p style={styles.description}>₹{item.cost}</p>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  // Fallback to old single-item display if no items in job_items table
                  <div style={styles.itemCard}>
                    <div style={styles.itemHeader}>
                      <span style={styles.itemNumber}>Item 1</span>
                      <span style={styles.itemType}>{myJob.job_type}</span>
                    </div>

                    {myJob.description && (
                      <div style={styles.infoRow}>
                        <label style={styles.label}>Description</label>
                        <p style={styles.description}>{myJob.description}</p>
                      </div>
                    )}

                    <div style={styles.infoRow}>
                      <label style={styles.label}>Dimensions</label>
                      <div style={styles.previewContainer}>
                        {parseSizes(myJob.size).map((s, i) => renderSizePreview(s.width, s.height, i))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* FIXED: Moved Measurement Images INSIDE the workbench so layout doesn't break */}
              {measurementImages.length > 0 && (
                <div style={styles.infoBox}>
                  <label style={styles.label}>📸 Site Measurement Photos</label>
                  <div style={styles.imageGrid}>
                    {measurementImages.map((img) => (
                      <img
                        key={img.id}
                        src={img.file_url}
                        alt="Site Measurement"
                        style={styles.measurementThumb}
                        onClick={() => window.open(img.file_url, "_blank")}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Section */}
              <div style={styles.uploadSection}>
                <label style={styles.label}>Final Design Upload</label>
                <div style={styles.fileInputWrapper}>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
                    style={styles.fileInput}
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" style={styles.fileLabel}>
                    {files.length > 0 ? `Selected ${files.length} files` : "Click to browse or drag designs here"}
                  </label>
                </div>

                <button
                  onClick={submitJobToBilling}
                  disabled={uploading || files.length === 0}
                  style={uploading || files.length === 0 ? styles.btnDoneDisabled : styles.btnDone}
                >
                  {uploading ? "Uploading Designs..." : "Complete & Push to Billing"}
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.emptyWorkbench}>
              <div style={styles.emptyIcon}>🎨</div>
              <h4>Your workbench is empty</h4>
              <p>Claim a job from the queue to start designing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

