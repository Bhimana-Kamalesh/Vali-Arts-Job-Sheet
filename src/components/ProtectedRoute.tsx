import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ role, children }: any) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return setOk(false);

      const { data: user } = await supabase
        .from("users")
        .select("role")
        .eq("id", auth.user.id)
        .single();

      if (!user) return setOk(false);

      // Developers and Managers have access to everything
      if (["developer", "manager", "general-manager"].includes(user.role)) {
        return setOk(true);
      }

      // Check if user's role matches the required role
      // If 'role' prop is an array, check if user.role is in it
      if (Array.isArray(role)) {
        setOk(role.includes(user.role));
      } else {
        // Single role check
        setOk(user.role === role);
      }
    };

    check();
  }, []);

  if (ok === null) return <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "#64748b" }}>Verifying Access...</div>;
  if (!ok) return <Navigate to="/" />;

  return children;
}
