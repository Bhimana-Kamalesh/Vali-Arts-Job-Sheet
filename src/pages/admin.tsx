import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import type { Job, User } from "../lib/types";
import "./admin.css";
import { useTheme } from "../context/ThemeContext";


// --- Icons for UI Polish ---
const DollarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#10b981" }}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);
const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#3b82f6" }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#8b5cf6" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);

// Sub-components for cleaner code
const MetricCard = ({ label, value, icon, styles }: { label: string, value: string | number, icon: React.ReactNode, styles: any }) => (
  <div style={styles.metricCard}>
    <div style={styles.metricHeader}>
      <label style={styles.label}>{label}</label>
      <div style={styles.iconBox}>{icon}</div>
    </div>
    <div style={styles.metricValue}>{value}</div>
  </div>
);

const LoadingScreen = () => {
  const { colors } = useTheme();
  return (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: colors.background, color: colors.subText }}>
      Loading Dashboard...
    </div>
  );
};

export default function Admin() {
  const { colors, theme } = useTheme();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [revenue, setRevenue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  // State for Create User Modal
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: "",
    username: "",
    password: "",
    role: "attendant",
    experience: ""
  });

  const createUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.fullName) {
      alert("Please fill in all required fields");
      return;
    }

    if (confirm("Creating a new user will sign you out. Continue?")) {
      setIsCreating(true);
      try {
        // Auto-generate email
        const generatedEmail = `${newUser.username.toLowerCase().replace(/\s+/g, '')}@valiarts.local`;

        // 1. Sign Up (Auth)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: generatedEmail,
          password: newUser.password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("User creation failed");

        // 2. Insert into Public Table
        const { error: dbError } = await supabase.from("users").insert({
          id: authData.user.id,
          role: newUser.role,
          full_name: newUser.fullName,
          username: newUser.username,
          experience: newUser.experience
        });

        if (dbError) throw dbError;

        alert(`User created! \nUsername: ${newUser.username}\nPassword: ${newUser.password}`);
        window.location.href = "/";
      } catch (err: any) {
        if (err.message?.includes("rate limit")) {
          alert("Supabase Error: Rate limit exceeded.\n\nSince we are using auto-generated emails, please go to your Supabase Dashboard -> Authentication -> Providers -> Email and DISABLE 'Confirm email'. This will prevent Supabase from trying to send emails and hitting this limit.");
        } else {
          alert("Error: " + err.message);
        }
        setIsCreating(false);
      }
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data: jobsData } = await supabase.from("jobs").select("*");
        setJobs(jobsData || []);

        const { data: staffData } = await supabase.from("users").select("*");
        setStaff(staffData || []);

        const { data: paid } = await supabase
          .from("jobs")
          .select("cost")
          .in("status", ["DELIVERY", "OUT_FOR_DELIVERY", "COMPLETED", "Delivered"]);

        const total = paid?.reduce((sum, j) => sum + Number(j.cost || 0), 0) || 0;
        setRevenue(total);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const byStatus = (status: string) => jobs.filter((j) => j.status === status);

  const STATUSES = [
    "DESIGN", "WAIT_BILLING", "BILLING", "PRINTING",
    "FIXING", "WAIT_DELIVERY", "DELIVERY", "OUT_FOR_DELIVERY", "COMPLETED"
  ];

  // Improved Styles Object
  const styles: Record<string, React.CSSProperties> = {
    container: { padding: "32px", maxWidth: "1600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" },

    // Metrics
    metricsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" },
    metricCard: { backgroundColor: colors.card, padding: "24px", borderRadius: "16px", border: `1px solid ${colors.border}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
    metricHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
    iconBox: { padding: "8px", backgroundColor: colors.background, borderRadius: "8px" },
    label: { fontSize: "13px", fontWeight: "600", color: colors.subText, textTransform: "uppercase", letterSpacing: "0.5px" },
    metricValue: { fontSize: "32px", fontWeight: "700", color: colors.text, letterSpacing: "-1px" },

    // Sections
    section: { backgroundColor: colors.card, borderRadius: "16px", border: `1px solid ${colors.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden", display: "flex", flexDirection: "column" },
    sectionHeader: { padding: "20px 24px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
    heading: { margin: 0, fontSize: "18px", fontWeight: 700, color: colors.text },
    subText: { fontSize: "13px", color: colors.subText },
    pulseDot: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e", boxShadow: "0 0 0 4px rgba(34, 197, 94, 0.2)" },

    // Kanban
    kanbanWrapper: { display: "flex", overflowX: "auto", padding: "24px", gap: "16px", backgroundColor: colors.background, minHeight: "500px" },
    statusColumn: { minWidth: "260px", maxWidth: "260px", backgroundColor: theme === 'dark' ? '#18181b' : '#f1f5f9', borderRadius: "12px", display: "flex", flexDirection: "column", border: `1px solid ${colors.border}`, height: "fit-content", maxHeight: "600px" },
    columnHeader: { padding: "16px", fontWeight: "700", fontSize: "12px", color: colors.subText, display: "flex", justifyContent: "space-between", alignItems: "center", textTransform: "uppercase", borderBottom: `1px solid ${colors.border}` },
    columnBody: { padding: "12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", minHeight: "100px" },

    // Job Card
    jobCard: { backgroundColor: colors.card, padding: "16px", borderRadius: "10px", border: `1px solid ${colors.border}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", transition: "all 0.2s ease", cursor: "pointer" },
    cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "6px" },
    jobName: { fontSize: "14px", fontWeight: "600", color: colors.text, marginBottom: "12px", lineHeight: "1.4" },
    jobId: { fontSize: "11px", color: colors.subText, fontWeight: "600", letterSpacing: "0.5px" },
    assignedRow: { display: "flex", alignItems: "center", gap: "6px", marginTop: "auto" },
    miniAvatar: { width: "20px", height: "20px", borderRadius: "50%", backgroundColor: theme === 'dark' ? '#404040' : "#e2e8f0", color: theme === 'dark' ? '#ffffff' : "#1e293b", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
    assignedName: { fontSize: "12px", color: colors.subText },

    // Badges & Empty States
    badge: { backgroundColor: colors.border, color: colors.subText, padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" },
    badgeActive: { backgroundColor: "#bfdbfe", color: "#1d4ed8", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" },
    emptyState: { padding: "20px", display: "flex", justifyContent: "center" },
    emptyDash: { width: "20px", height: "4px", backgroundColor: colors.border, borderRadius: "2px" },

    // Table
    tableWrapper: { padding: "0 24px 24px 24px", overflowX: "auto" },
    table: { width: "100%", borderCollapse: "separate", borderSpacing: "0 10px", marginTop: "-10px" },
    tableHead: { textAlign: "left" },
    th: { padding: "12px", fontSize: "12px", color: colors.subText, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" },
    tableRow: { backgroundColor: colors.card, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" },
    td: { padding: "16px 12px", fontSize: "14px", color: colors.text, borderTop: `1px solid ${colors.background}`, borderBottom: `1px solid ${colors.background}` },


    // User Cells
    userCell: { display: "flex", alignItems: "center", gap: "12px" },
    avatar: { width: "36px", height: "36px", borderRadius: "50%", backgroundColor: colors.background, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", color: colors.subText, fontSize: "14px" },
    userName: { fontWeight: "600", color: colors.text },
    userHandle: { fontSize: "12px", color: colors.subText },
    roleTag: { backgroundColor: colors.background, border: `1px solid ${colors.border}`, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "500", color: colors.subText },

    // Progress Bar
    progressBarBg: { width: "100px", height: "6px", backgroundColor: colors.background, borderRadius: "3px", overflow: "hidden", display: "inline-block", marginRight: "10px", verticalAlign: "middle" },
    progressBarFill: { height: "100%", borderRadius: "3px" },
    progressText: { fontSize: "12px", color: colors.subText },

    // Status Badges
    statusBadgeBusy: { backgroundColor: "#fef2f2", color: "#dc2626", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", display: "inline-block" },
    statusBadgeFree: { backgroundColor: "#f0fdf4", color: "#16a34a", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", display: "inline-block" },

    // Add Staff Button
    addButton: { padding: "8px 16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "13px" },

    // Modal
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
    modalContent: { backgroundColor: colors.card, padding: "32px", borderRadius: "16px", width: "100%", maxWidth: "500px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" },
    modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
    modalTitle: { fontSize: "20px", fontWeight: "700", margin: 0, color: colors.text },
    closeButton: { background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: colors.subText },
    modalBody: { display: "flex", flexDirection: "column", gap: "16px" },
    alertBox: { backgroundColor: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "8px" },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    formLabel: { fontSize: "13px", fontWeight: "600", color: colors.subText },
    formInput: { padding: "10px", borderRadius: "8px", border: `1px solid ${colors.border}`, fontSize: "14px", outline: "none", backgroundColor: colors.background, color: colors.text },
    formSelect: { padding: "10px", borderRadius: "8px", border: `1px solid ${colors.border}`, fontSize: "14px", outline: "none", backgroundColor: colors.background, color: colors.text },
    gridRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
    submitButton: { padding: "12px", backgroundColor: "#0f172a", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", marginTop: "8px" },
    navButton: { padding: "16px", backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: "12px", fontSize: "14px", fontWeight: "600", color: colors.subText, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", textAlign: "center" },
  };

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ backgroundColor: colors.background, minHeight: "100vh", fontFamily: "Inter, sans-serif", color: colors.text }}>
      {/* Inject custom styles for scrollbars and hover effects */}
      <style>{`
        ::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .job-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
      `}</style>

      <Header title="Administrative Control Center" />

      <div style={styles.container}>
        {/* TOP METRICS */}
        <div style={styles.metricsRow}>
          <MetricCard
            label="Total Revenue"
            value={`₹ ${revenue.toLocaleString("en-IN")}`}
            icon={<DollarIcon />}
            styles={styles}
          />
          <MetricCard
            label="Active Jobs"
            value={jobs.filter(j => j.status !== "COMPLETED").length}
            icon={<BriefcaseIcon />}
            styles={styles}
          />
          <MetricCard
            label="Total Staff"
            value={staff.length}
            icon={<UsersIcon />}
            styles={styles}
          />
        </div>

        {/* QUICK NAVIGATION */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.heading}>Apps & Modules</h3>
          </div>
          <div style={styles.gridRow}>
            <button style={styles.navButton} onClick={() => window.location.href = '/attendant'}>Attendant Dashboard</button>
            <button style={styles.navButton} onClick={() => window.location.href = '/billing'}>Billing System</button>
            <button style={styles.navButton} onClick={() => window.location.href = '/designer'}>Designer Workflow</button>
            <button style={styles.navButton} onClick={() => window.location.href = '/printer'}>Printer Queue</button>
            <button style={styles.navButton} onClick={() => window.location.href = '/workshop'}>Workshop (Fixer)</button>
            <button style={styles.navButton} onClick={() => window.location.href = '/delivery'}>Delivery Portal</button>
          </div>
        </div>

        {/* LIVE KANBAN MONITOR */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={styles.pulseDot} />
              <h3 style={styles.heading}>Live Workflow Monitor</h3>
            </div>
            <span style={styles.subText}>Real-time job tracking</span>
          </div>

          <div style={styles.kanbanWrapper}>
            {STATUSES.map((s) => {
              const columnJobs = byStatus(s);
              return (
                <div key={s} style={styles.statusColumn}>
                  <div style={styles.columnHeader}>
                    {s.replace(/_/g, " ")}
                    <span style={columnJobs.length > 0 ? styles.badgeActive : styles.badge}>{columnJobs.length}</span>
                  </div>
                  <div style={styles.columnBody}>
                    {columnJobs.length === 0 && (
                      <div style={styles.emptyState}>
                        <div style={styles.emptyDash}></div>
                      </div>
                    )}
                    {columnJobs.map((j) => (
                      <div key={j.job_id} style={styles.jobCard} className="job-card">
                        <div style={styles.cardHeader}>
                          <span style={styles.jobId}>#{j.job_id}</span>
                        </div>
                        <div style={styles.jobName}>{j.customer_name}</div>
                        {j.assigned_to && (
                          <div style={styles.assignedRow}>
                            <div style={styles.miniAvatar}>
                              {staff.find(u => u.id === j.assigned_to)?.full_name?.[0] || "S"}
                            </div>
                            <span style={styles.assignedName}>
                              {staff.find(u => u.id === j.assigned_to)?.full_name?.split(' ')[0] || "Staff"}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STAFF WORKLOAD */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.heading}>Staff Workload</h3>
            <button onClick={() => setShowModal(true)} style={styles.addButton}>
              + Add Staff
            </button>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHead}>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Active Tasks</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => {
                  const activeCount = jobs.filter(j => j.assigned_to === s.id && j.status !== "COMPLETED").length;
                  return (
                    <tr key={s.id} style={styles.tableRow}>
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div style={styles.avatar}>{s.full_name?.[0] || s.username?.[0] || "U"}</div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={styles.userName}>{s.full_name || "Unknown"}</span>
                            <span style={styles.userHandle}>{s.username ? `@${s.username}` : ""}</span>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}><span style={styles.roleTag}>{s.role}</span></td>
                      <td style={styles.td}>
                        <div style={styles.progressBarBg}>
                          <div style={{
                            ...styles.progressBarFill,
                            width: `${Math.min(activeCount * 10, 100)}%`,
                            backgroundColor: activeCount > 5 ? '#ef4444' : '#3b82f6'
                          }} />
                        </div>
                        <span style={styles.progressText}>{activeCount} active</span>
                      </td>
                      <td style={styles.td}>
                        <span style={activeCount > 0 ? styles.statusBadgeBusy : styles.statusBadgeFree}>
                          {activeCount > 0 ? "Busy" : "Available"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Staff Member</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeButton}>×</button>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Full Name</label>
              <input style={styles.formInput} value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} placeholder="John Doe" />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Username (for login)</label>
              <input style={styles.formInput} value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} placeholder="johndoe123" />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Password</label>
              <input style={styles.formInput} type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="********" />
            </div>

            <div style={styles.gridRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Role</label>
                <select style={styles.formSelect} value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="attendant">Attendant</option>
                  <option value="designer">Designer</option>
                  <option value="billing">Billing</option>
                  <option value="printer">Printer</option>
                  <option value="fixer">Fixer</option>
                  <option value="delivery">Delivery</option>
                  <option value="measurement-jobs">Measurement</option>
                  <option value="manager">Manager</option>
                  <option value="general-manager">General Manager</option>
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Experience</label>
                <input style={styles.formInput} value={newUser.experience} onChange={e => setNewUser({ ...newUser, experience: e.target.value })} placeholder="e.g. 2 years" />
              </div>
            </div>

            <button onClick={createUser} disabled={isCreating} style={styles.submitButton}>
              {isCreating ? "Creating..." : "Create Account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



