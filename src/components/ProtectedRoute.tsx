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

      setOk(user?.role === role);
    };

    check();
  }, []);

  if (ok === null) return <p>Loading...</p>;
  if (!ok) return <Navigate to="/" />;

  return children;
}
