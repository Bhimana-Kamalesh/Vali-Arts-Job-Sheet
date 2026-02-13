import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!username || !password) {
      alert("Please enter both username and password");
      return;
    }

    setLoading(true);

    try {
      // 1. Get Role and reconstruct email
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("role") // Only select role, as email might not exist
        .eq("username", username.trim())
        .single();

      if (userError || !userRecord) {
        alert("User not found. Please check your username.");
        setLoading(false);
        return;
      }

      // Auto-reconstruct email
      const targetEmail = `${username.trim().toLowerCase().replace(/\s+/g, '')}@valiarts.local`;

      // 2. Sign in user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      // 3. Get Role (we might already have it from step 1, but best to be safe with auth user)
      // If we got it from step 1, use it.
      const role = userRecord?.role;

      if (!role) {
        // Fallback fetch if we logged in via email directly without step 1 success
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (!profile) {
          alert("No role assigned");
          return;
        }
        redirectUser(profile.role);
      } else {
        redirectUser(role);
      }

    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
      setLoading(false);
    }
  };

  const redirectUser = (role: string) => {
    // High-level roles go to Admin (or their specific dashboards if later created)
    if (["developer", "manager", "general-manager", "admin"].includes(role)) {
      window.location.href = "/admin";
    } else {
      window.location.href = `/${role}`;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <div style={styles.logoContainer}>
          <h1 style={styles.title}>Vali Arts & Digitals</h1>
          <p style={styles.subtitle}>Staff Portal</p>
        </div>

        <div style={styles.inputWrapper}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            autoCapitalize="none"
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