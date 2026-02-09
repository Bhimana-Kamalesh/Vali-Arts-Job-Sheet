import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    // 1. Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // 2. Get logged in user ID
    const userId = data.user.id;

    // 3. Fetch role from users table
    const { data: profile, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (roleError || !profile) {
      alert("No role assigned to this account");
      setLoading(false);
      return;
    }

    // 4. Redirect to correct dashboard
    window.location.href = `/${profile.role}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <div style={styles.logoContainer}>
          <h1 style={styles.title}>Vali Arts & Digitals</h1>
          
        </div>

        <div style={styles.inputWrapper}>
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.inputWrapper}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
        </div>

        <button 
          onClick={login} 
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Verifying..." : "Sign In"}
        </button>

        <p style={styles.footerText}>
          Authorized Staff Only
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a", // Dark navy professional background
    backgroundImage: "radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  loginCard: {
    width: "100%",
    maxWidth: "400px",
    padding: "40px",
    borderRadius: "24px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    textAlign: "center",
  },
  logoContainer: {
    marginBottom: "30px",
  },
  title: {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "#38bdf8", // Sky blue accent
    fontSize: "14px",
    fontWeight: "600",
    margin: "5px 0 0 0",
    textTransform: "uppercase",
    letterSpacing: "2px",
  },
  inputWrapper: {
    textAlign: "left",
    marginBottom: "20px",
  },
  label: {
    display: "block",
    color: "#94a3b8",
    fontSize: "13px",
    marginBottom: "8px",
    marginLeft: "4px",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #334155",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  button: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#38bdf8",
    color: "#0f172a",
    fontSize: "16px",
    fontWeight: "700",
    marginTop: "10px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 6px -1px rgba(56, 189, 248, 0.2)",
  },
  footerText: {
    color: "#64748b",
    fontSize: "12px",
    marginTop: "25px",
  }
};