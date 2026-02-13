import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";

// --- TYPES ---
interface MeasurementJob {
  id: number;
  customer_name: string;
  address: string;
  status: string;
  job_type: string;
  notes: string;
  created_at: string;
  assigned_to?: string;
}

interface MeasurementFile {
  id: number;
  file_url: string;
  file_type: "image" | "audio" | "document";
  created_at: string;
}

export default function MeasurementJobs() {
  const { colors, theme } = useTheme();

  const styles: Record<string, React.CSSProperties> = {
    // Layouts
    mainLayoutDesktop: { display: "grid", gridTemplateColumns: "350px 1fr", gap: "24px", padding: "24px", maxWidth: "1400px", margin: "0 auto", height: "calc(100vh - 80px)" },
    mainLayoutMobile: { display: "block", padding: "16px", paddingBottom: "80px" },

    // Mobile Tabs
    mobileTabContainer: { display: "flex", gap: "10px", padding: "0 16px 16px 16px" },
    mobileTab: { flex: 1, padding: "12px", borderRadius: "8px", border: `1px solid ${colors.border}`, backgroundColor: colors.card, fontWeight: 600, color: colors.subText },
    mobileTabActive: { flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #3b82f6", backgroundColor: theme === 'dark' ? '#18181b' : "#eff6ff", fontWeight: 700, color: "#2563eb" },

    // Containers
    sideColumn: { backgroundColor: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" },
    workbench: { backgroundColor: colors.card, borderRadius: "12px", border: `1px solid ${colors.border}`, padding: "20px", height: "100%", overflowY: "auto", minHeight: "60vh" },

    // Headers & Lists
    sectionHeader: { padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: "10px" },
    heading: { margin: 0, fontSize: "15px", fontWeight: 700, color: colors.text },
    scrollArea: { padding: "12px", overflowY: "auto", flex: 1 },
    card: { padding: "16px", borderRadius: "10px", marginBottom: "12px", cursor: "pointer", transition: "all 0.2s", border: `1px solid ${colors.border}` },
    cardTitle: { fontWeight: 700, color: colors.text, fontSize: "15px", marginBottom: '4px' },
    cardMeta: { fontSize: "13px", color: colors.subText, marginTop: "4px" },
    statusTag: { color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontWeight: 700 },
    badge: { backgroundColor: colors.background, color: colors.subText, padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, marginLeft: "auto" },

    // Job Details
    activeContent: { display: "flex", flexDirection: "column", gap: "24px" },
    jobDetailsHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${colors.border}`, paddingBottom: '16px' },
    customerName: { margin: 0, fontSize: "24px", color: colors.text },
    idBadge: { fontSize: "13px", color: colors.subText, fontWeight: 500 },

    // Grids
    infoGridDesktop: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
    infoGridMobile: { display: "flex", flexDirection: "column", gap: "16px" },
    infoBox: { padding: "16px", borderRadius: "12px", backgroundColor: colors.background, border: `1px solid ${colors.border}` },

    // Text & Links
    label: { display: "block", fontSize: "11px", fontWeight: 800, color: colors.subText, textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" },
    description: { margin: "0 0 12px 0", color: colors.text, lineHeight: "1.5", fontSize: "15px" },
    mapLink: { display: "inline-block", fontSize: "14px", fontWeight: 600, color: "#2563eb", textDecoration: "none", backgroundColor: colors.card, padding: "8px 12px", borderRadius: "6px", border: `1px solid ${colors.border}`, width: "100%", boxSizing: "border-box", textAlign: "center" },

    // Upload Area
    uploadSection: { padding: "20px", border: `2px dashed ${colors.border}`, borderRadius: "12px", backgroundColor: colors.background },
    uploadGrid: { display: "flex", gap: "16px", marginBottom: "20px" },
    uploadTile: { flex: 1, height: "100px", backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" },
    tileText: { fontSize: "12px", fontWeight: 700, marginTop: "4px", color: colors.subText },

    // Buttons
    btnPrimary: { width: "100%", padding: "16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "16px" },
    btnDone: { width: "100%", padding: "16px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "16px", marginTop: "auto" },
    secondaryBtn: { padding: "10px 20px", backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginTop: "10px", color: colors.text },

    // Gallery
    fileGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "12px" },
    fileCard: { padding: "12px", backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: "8px", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
    fileIcon: { fontSize: "24px", marginBottom: "4px" },
    viewLink: { fontSize: "11px", color: "#2563eb", fontWeight: 700, textDecoration: "none" },

    // Empty States
    emptyWorkbench: { textAlign: "center", padding: "60px 20px", color: colors.subText, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" },
    emptyIcon: { fontSize: "48px", marginBottom: "16px" },
    emptyText: { textAlign: "center", fontSize: "13px", color: colors.subText, marginTop: "40px" },
    dotAvailable: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f59e0b" },
  };

  // Data State
  const [jobs, setJobs] = useState<MeasurementJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<MeasurementJob | null>(null);
  const [files, setFiles] = useState<MeasurementFile[]>([]);

  // Mobile State
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');

  // Upload/Record State
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [uploading, setUploading] = useState(false);

  /* ---------------- INIT & RESIZE ---------------- */
  useEffect(() => {
    loadJobs();

    // Responsive check
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-switch to detail view when a job is selected
  useEffect(() => {
    if (selectedJob) setActiveTab('detail');
  }, [selectedJob]);

  /* ---------------- DATA LOADING ---------------- */
  const loadJobs = async () => {
    const { data } = await supabase
      .from("measurement_jobs")
      .select("*")
      .neq("status", "DONE")
      .order("created_at", { ascending: false });
    setJobs(data || []);
  };

  const loadFiles = async (jobId: number) => {
    const { data } = await supabase
      .from("measurement_files")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });
    setFiles((data || []) as MeasurementFile[]);
  };

  /* ---------------- ACTIONS ---------------- */
  const openJob = async (job: MeasurementJob) => {
    const { data: { user } } = await supabase.auth.getUser();

    // Auto-assign if unassigned
    if (!job.assigned_to) {
      await supabase
        .from("measurement_jobs")
        .update({ status: "ASSIGNED", assigned_to: user?.id })
        .eq("id", job.id);

      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: "ASSIGNED", assigned_to: user?.id } : j));
      await supabase.from("job_workflow_logs").insert({
        job_id: job.id,
        stage: "MEASUREMENT",
        worker_id: user?.id,
        worker_name: user?.user_metadata?.full_name || "Measurement",
        time_in: new Date().toISOString(),
      });

    }

    setSelectedJob(job);
    loadFiles(job.id);
  };

  const handleBackToList = () => {
    setActiveTab('list');
    // Optional: setSelectedJob(null) if you want to clear selection
  };

  /* ---------------- RECORDING & UPLOAD ---------------- */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied. Check browser permissions.");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    mediaRecorder?.stream.getTracks().forEach(track => track.stop());
    setRecording(false);

  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPendingFiles([...pendingFiles, ...Array.from(e.target.files)]);
    }
  };


  const uploadFile = async (file: File) => {
    if (!selectedJob) return;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      alert("Not logged in");
      return;
    }

    // Storage path (used ONLY for upload, not DB)
    const storagePath = `${selectedJob.id}/${Date.now()}-${file.name}`;

    // 1️⃣ Upload to bucket
    const { error: uploadError } = await supabase.storage
      .from("measurement-files")
      .upload(storagePath, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      alert("Upload failed");
      return;
    }

    // 2️⃣ Get public URL
    const { data: publicData } = supabase.storage
      .from("measurement-files")
      .getPublicUrl(storagePath);

    const publicUrl = publicData?.publicUrl;
    if (!publicUrl) {
      alert("Failed to get file URL");
      return;
    }

    // 3️⃣ INSERT INTO DB (NO file_path)
    const { error: insertError } = await supabase
      .from("measurement_files")
      .insert({
        job_id: selectedJob.id,
        file_url: publicUrl,
        file_type: file.type.startsWith("image")
          ? "image"
          : file.type.startsWith("audio")
            ? "audio"
            : "document",
        uploaded_by: auth.user.id,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("DB insert error:", insertError);
      alert("Failed to save file record");
    }
  };

  const uploadAll = async () => {
    if (!selectedJob) return;
    setUploading(true);

    // Upload standard files
    for (const file of pendingFiles) {
      try {
        await uploadFile(file);
      } catch (e) {
        console.error("Upload failed:", file.name, e);
      }
    }


    // Upload voice note
    if (audioBlob) {
      const audioFile = new File([audioBlob], "voice-note.webm", { type: "audio/webm" });
      await uploadFile(audioFile);
      setAudioBlob(null);
    }

    setPendingFiles([]);
    setUploading(false);
    loadFiles(selectedJob.id);
    alert("✅ Upload Successful!");
  };

  const markDone = async () => {
    if (!selectedJob) return;
    if (!window.confirm("Mark this measurement as COMPLETED?")) return;
    await supabase.from("job_workflow_logs")
      .update({ time_out: new Date().toISOString() })
      .eq("job_id", selectedJob.id)
      .eq("stage", "MEASUREMENT")
      .is("time_out", null);


    await supabase.from("measurement_jobs").update({ status: "DONE" }).eq("id", selectedJob.id);
    alert("Measurement Completed");
    setSelectedJob(null);
    loadJobs();
    setActiveTab('list'); // Return to list
  };

  /* ---------------- UI RENDER ---------------- */
  return (
    <div style={{ backgroundColor: colors.background, minHeight: "100vh", paddingBottom: isMobile ? "80px" : "0" }}>
      <Header title="Site Measurements" />

      {/* MOBILE TABS */}
      {isMobile && (
        <div style={styles.mobileTabContainer}>
          <button
            style={activeTab === 'list' ? styles.mobileTabActive : styles.mobileTab}
            onClick={() => setActiveTab('list')}
          >
            📋 Requests ({jobs.length})
          </button>
          <button
            style={activeTab === 'detail' ? styles.mobileTabActive : styles.mobileTab}
            onClick={() => setActiveTab('detail')}
            disabled={!selectedJob}
          >
            📏 Workbench
          </button>
        </div>
      )}

      <div style={isMobile ? styles.mainLayoutMobile : styles.mainLayoutDesktop}>

        {/* --- LEFT: QUEUE (Visible if Desktop OR Mobile List Tab) --- */}
        {(!isMobile || activeTab === 'list') && (
          <div style={styles.sideColumn}>
            {!isMobile && (
              <div style={styles.sectionHeader}>
                <span style={styles.dotAvailable} />
                <h3 style={styles.heading}>Active Requests</h3>
                <span style={styles.badge}>{jobs.length}</span>
              </div>
            )}

            <div style={styles.scrollArea}>
              {jobs.length === 0 && <p style={styles.emptyText}>No pending requests.</p>}
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => openJob(job)}
                  style={{
                    ...styles.card,
                    border: selectedJob?.id === job.id ? "2px solid #3b82f6" : `1px solid ${colors.border}`,
                    backgroundColor: selectedJob?.id === job.id ? (theme === 'dark' ? '#27272a' : "#eff6ff") : colors.card
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={styles.cardTitle}>{job.customer_name}</div>
                      <span style={{ ...styles.statusTag, backgroundColor: getStatusColor(job.status) }}>{job.status}</span>
                    </div>
                    <div style={styles.cardMeta}>📍 {job.address}</div>
                    <div style={styles.cardMeta}>{job.job_type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- RIGHT: WORKBENCH (Visible if Desktop OR Mobile Detail Tab) --- */}
        {(!isMobile || activeTab === 'detail') && (
          <div style={styles.workbench}>
            {selectedJob ? (
              <div style={styles.activeContent}>

                {/* Header Section */}
                <div style={styles.jobDetailsHeader}>
                  <div>
                    {isMobile && (
                      <div onClick={handleBackToList} style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⬅ Back to list
                      </div>
                    )}
                    <h2 style={styles.customerName}>{selectedJob.customer_name}</h2>
                    <span style={styles.idBadge}>ID: #{selectedJob.id} • {selectedJob.job_type}</span>
                  </div>
                </div>

                {/* Map & Notes */}
                <div style={isMobile ? styles.infoGridMobile : styles.infoGridDesktop}>
                  <div style={styles.infoBox}>
                    <label style={styles.label}>Location</label>
                    <p style={styles.description}>{selectedJob.address || "No address provided"}</p>
                    {selectedJob.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedJob.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.mapLink}
                      >
                        🗺️ Open in Google Maps
                      </a>
                    )}
                  </div>
                  <div style={styles.infoBox}>
                    <label style={styles.label}>Notes</label>
                    <p style={styles.description}>{selectedJob.notes || "No special instructions."}</p>
                  </div>
                </div>

                {/* UPLOAD PANEL */}
                <div style={styles.uploadSection}>
                  <label style={styles.label}>Capture Data</label>

                  <div style={styles.uploadGrid}>
                    {/* Camera Button */}
                    <div style={styles.uploadTile}>
                      <input type="file" multiple onChange={handleFileSelect} style={{ display: "none" }} id="file-up" />
                      <label htmlFor="file-up" style={{ cursor: "pointer", textAlign: "center", width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ fontSize: "28px" }}>📸</div>
                        <div style={styles.tileText}>Photo/Video</div>
                      </label>
                    </div>

                    {/* Audio Button */}
                    <div style={styles.uploadTile}>
                      {!recording ? (
                        <div onClick={startRecording} style={{ textAlign: "center", cursor: "pointer", width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                          <div style={{ fontSize: "28px" }}>🎙️</div>
                          <div style={styles.tileText}>Record Audio</div>
                        </div>
                      ) : (
                        <div onClick={stopRecording} style={{ textAlign: "center", cursor: "pointer", color: "#ef4444", width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                          <div style={{ fontSize: "28px", animation: "pulse 1s infinite" }}>⏹</div>
                          <div style={styles.tileText}>Stop Recording</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sync Button */}
                  {(pendingFiles.length > 0 || audioBlob) && (
                    <button onClick={uploadAll} disabled={uploading} style={styles.btnPrimary}>
                      {uploading ? "Uploading..." : `⬆️ Sync ${pendingFiles.length + (audioBlob ? 1 : 0)} Items`}
                    </button>
                  )}
                </div>

                {/* GALLERY */}
                <div style={styles.gallerySection}>
                  <label style={styles.label}>Site Gallery ({files.length})</label>
                  <div style={styles.fileGrid}>
                    {files.map((f) => (
                      <div key={f.id}>
                        {f.file_type === "image" && (
                          <img
                            src={f.file_url}
                            alt="Measurement"
                            style={{ width: "100%", borderRadius: "8px" }}
                          />
                        )}

                        {f.file_type === "audio" && (
                          <audio controls src={f.file_url} />
                        )}

                        {f.file_type === "document" && (
                          <a href={f.file_url} target="_blank" rel="noreferrer">
                            Download
                          </a>
                        )}
                      </div>
                    ))}

                  </div>
                </div>

                {/* Action Footer */}
                <button onClick={markDone} style={styles.btnDone}>
                  ✅ Mark Measurement Complete
                </button>

              </div>
            ) : (
              <div style={styles.emptyWorkbench}>
                <div style={styles.emptyIcon}>📏</div>
                <h4>No Site Selected</h4>
                <p style={{ color: '#94a3b8' }}>Select a request to begin measurements</p>
                {isMobile && (
                  <button onClick={() => setActiveTab('list')} style={styles.secondaryBtn}>View Requests</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- UTILS ---
const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING": return "#f59e0b";
    case "ASSIGNED": return "#3b82f6";
    case "DONE": return "#10b981";
    default: return "#94a3b8";
  }
};

// --- STYLES ---

