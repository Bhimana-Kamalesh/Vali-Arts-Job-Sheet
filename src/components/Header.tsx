import { supabase } from "../lib/supabase";
import { useTheme } from "../context/ThemeContext";

export default function Header({ title }: { title: string }) {
  const { theme, toggleTheme, colors } = useTheme();
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "15px 25px",
      background: theme === 'light' ? '#3430adf9' : colors.card,
      color: colors.text,
      borderBottom: `1px solid ${theme === 'light' ? '#5254d1ff' : colors.border}`
    }}>
      {/* LEFT SIDE: Logo + Brand + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        {/* Logo Image */}
        <img
          src="/logo.png"
          alt="Vali Arts Logo"
          style={{
            height: "40px",
            width: "40px",
            objectFit: "contain"
          }}
        />

        {/* Brand Name and Page Title */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ margin: 0, fontSize: "20px" }}>Vali Arts & Digital</h2>
          <span style={{ fontSize: "16px", color: "#ffffffff", marginLeft: "570px", marginTop: "2px" }}>
            {title}
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: Theme Toggle & Logout */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={toggleTheme}
          style={{
            padding: "8px",
            backgroundColor: theme === 'light' ? '#dbeafe' : colors.card,
            color: colors.text,
            border: `1px solid ${theme === 'light' ? '#bfdbfe' : colors.border}`,
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px"
          }}
          title="Toggle Theme"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <button
          onClick={logout}
          style={{
            padding: "8px 16px",
            backgroundColor: theme === 'dark' ? '#1d1c1cc9' : "#000000ef",
            color: "white",
            border: theme === 'dark' ? '1px solid #3f3f46' : "1px solid #475569",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}