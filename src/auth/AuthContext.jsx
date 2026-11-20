import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../services/supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;
    const loadProfile = async (userId) => {
      if (!userId) {
        if (active) setProfile(null);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, institution, role, status")
        .eq("id", userId)
        .maybeSingle();

      if (!active) return;
      if (profileError) {
        setError("Не удалось загрузить профиль. Попробуйте обновить страницу.");
        setProfile(null);
        return;
      }
      setProfile(data);
    };

    supabase.auth
      .getSession()
      .then(async ({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) setError("Не удалось проверить вход в аккаунт.");
        setSession(data?.session ?? null);
        await loadProfile(data?.session?.user?.id);
        if (active) setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError("Не удалось проверить вход в аккаунт.");
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError("");
      setLoading(true);
      window.setTimeout(async () => {
        try {
          await loadProfile(nextSession?.user?.id);
        } catch {
          if (active) setError("Не удалось загрузить профиль.");
        } finally {
          if (active) setLoading(false);
        }
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ session, profile, loading, error, configured: isSupabaseConfigured }),
    [session, profile, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth должен вызываться внутри AuthProvider.");
  return context;
}
