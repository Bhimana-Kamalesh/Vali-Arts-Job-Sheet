import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import type { Job, User } from "../lib/types";
import "./admin.css";


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

export default function Admin() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [revenue, setRevenue] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
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
          />
          <MetricCard 
            label="Active Jobs" 
            value={jobs.filter(j => j.status !== "COMPLETED").length} 
            icon={<BriefcaseIcon />} 
          />
          <MetricCard 
            label="Staff Online" 
            value={staff.length} 
            icon={<UsersIcon />} 
          />
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
                          <div style={styles.avatar}>{s.full_name?.[0] || s.email?.[0]}</div>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={styles.userName}>{s.full_name || "Unknown"}</span>
                            <span style={styles.userEmail}>{s.email}</span>
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
    </div>
  );
}

// Sub-components for cleaner code
const MetricCard = ({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) => (
  <div style={styles.metricCard}>
    <div style={styles.metricHeader}>
      <label style={styles.label}>{label}</label>
      <div style={styles.iconBox}>{icon}</div>
    </div>
    <div style={styles.metricValue}>{value}</div>
  </div>
);

const LoadingScreen = () => (
  <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc", color: "#64748b" }}>
    Loading Dashboard...
  </div>
);

// Improved Styles Object
const styles: Record<string, React.CSSProperties> = {
  container: { padding: "32px", maxWidth: "1600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" },
  
  // Metrics
  metricsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" },
  metricCard: { backgroundColor: "white", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
  metricHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
  iconBox: { padding: "8px", backgroundColor: "#f8fafc", borderRadius: "8px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" },
  metricValue: { fontSize: "32px", fontWeight: "700", color: "#0f172a", letterSpacing: "-1px" },

  // Sections
  section: { backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden", display: "flex", flexDirection: "column" },
  sectionHeader: { padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" },
  heading: { margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" },
  subText: { fontSize: "13px", color: "#94a3b8" },
  pulseDot: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e", boxShadow: "0 0 0 4px rgba(34, 197, 94, 0.2)" },

  // Kanban
  kanbanWrapper: { display: "flex", overflowX: "auto", padding: "24px", gap: "16px", backgroundColor: "#f8fafc", minHeight: "500px" },
  statusColumn: { minWidth: "260px", maxWidth: "260px", backgroundColor: "#f1f5f9", borderRadius: "12px", display: "flex", flexDirection: "column", border: "1px solid #e2e8f0", height: "fit-content", maxHeight: "600px" },
  columnHeader: { padding: "16px", fontWeight: "700", fontSize: "12px", color: "#475569", display: "flex", justifyContent: "space-between", alignItems: "center", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" },
  columnBody: { padding: "12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", minHeight: "100px" },
  
  // Job Card
  jobCard: { backgroundColor: "white", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", transition: "all 0.2s ease", cursor: "pointer" },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "6px" },
  jobName: { fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "12px", lineHeight: "1.4" },
  jobId: { fontSize: "11px", color: "#94a3b8", fontWeight: "600", letterSpacing: "0.5px" },
  assignedRow: { display: "flex", alignItems: "center", gap: "6px", marginTop: "auto" },
  miniAvatar: { width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#bfdbfe", color: "#1d4ed8", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  assignedName: { fontSize: "12px", color: "#64748b" },

  // Badges & Empty States
  badge: { backgroundColor: "#e2e8f0", color: "#64748b", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" },
  badgeActive: { backgroundColor: "#bfdbfe", color: "#1d4ed8", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" },
  emptyState: { padding: "20px", display: "flex", justifyContent: "center" },
  emptyDash: { width: "20px", height: "4px", backgroundColor: "#e2e8f0", borderRadius: "2px" },

  // Table
  tableWrapper: { padding: "0 24px 24px 24px", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: "0 10px", marginTop: "-10px" },
  tableHead: { textAlign: "left" },
  th: { padding: "12px", fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" },
  tableRow: { backgroundColor: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" },
  td: { padding: "16px 12px", fontSize: "14px", color: "#334155", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9"},
  
  
  // User Cells
  userCell: { display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", color: "#475569", fontSize: "14px" },
  userName: { fontWeight: "600", color: "#0f172a" },
  userEmail: { fontSize: "12px", color: "#94a3b8" },
  roleTag: { backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "500", color: "#475569" },
  
  // Progress Bar
  progressBarBg: { width: "100px", height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px", overflow: "hidden", display: "inline-block", marginRight: "10px", verticalAlign: "middle" },
  progressBarFill: { height: "100%", borderRadius: "3px" },
  progressText: { fontSize: "12px", color: "#64748b" },

  // Status Badges
  statusBadgeBusy: { backgroundColor: "#fef2f2", color: "#dc2626", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", display: "inline-block" },
  statusBadgeFree: { backgroundColor: "#f0fdf4", color: "#16a34a", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", display: "inline-block" },
};