import { supabase } from "../lib/supabase";

export default function Header({ title }: { title: string }) {
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
      background: "#1e293b",
      color: "white"
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
          <span style={{ fontSize: "16px", color: "#94a3b8", marginLeft: "570px",marginTop: "2px" }}>
            {title}
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: Logout Button Only */}
      <div>
        <button
          onClick={logout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#334155",
            color: "white",
            border: "1px solid #475569",
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