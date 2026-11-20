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

    const initializeSession = async () => {
      const callbackData = window.sessionStorage.getItem("supabase_auth_callback");
      if (callbackData) {
        window.sessionStorage.removeItem("supabase_auth_callback");
        const callbackParams = new URLSearchParams(callbackData);
        const accessToken = callbackParams.get("access_token");
        const refreshToken = callbackParams.get("refresh_token");
        const callbackType = callbackParams.get("type");
        if (!["recovery", "signup"].includes(callbackType) || !accessToken || !refreshToken) {
          throw new Error("Ссылка подтверждения недействительна.");
        }

        const { error: callbackError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (callbackError) throw callbackError;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) setError("Не удалось проверить вход в аккаунт.");
      setSession(data?.session ?? null);
      await loadProfile(data?.session?.user?.id);
      if (active) setLoading(false);
    };

    initializeSession().catch(() => {
      if (!active) return;
      setError("Не удалось восстановить сеанс. Запросите новую ссылку для сброса пароля.");
      setLoading(false);
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
