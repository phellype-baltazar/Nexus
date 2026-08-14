"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  async function clearCurrentSession() {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      await supabase.auth.signOut({ scope: "local" });
    }
  }

  async function oauth(provider: "google" | "azure") {
    setBusy(true);
    setMessage(null);

    try {
      // Se o usuário escolher explicitamente outro provedor,
      // não reutilizar a sessão anterior do navegador.
      await clearCurrentSession();

      const redirectTo =
        `${window.location.origin}/auth/callback?expected=${provider}`;

      const options =
        provider === "azure"
          ? {
              redirectTo,
              scopes: "email",
            }
          : {
              redirectTo,
            };

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
      });

      if (error) {
        setMessage(error.message);
        setBusy(false);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o login."
      );
      setBusy(false);
    }
  }

  async function emailLogin(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);
    setMessage(null);

    try {
      await clearCurrentSession();

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        setMessage(error.message);
        setBusy(false);
        return;
      }

      window.location.href = "/app/dashboard";
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar."
      );
      setBusy(false);
    }
  }

  return (
    <div className="form">
      <button
        className="btn btn-outline"
        disabled={busy}
        onClick={() => oauth("google")}
      >
        Continuar com Google
      </button>

      <button
        className="btn btn-outline"
        disabled={busy}
        onClick={() => oauth("azure")}
      >
        Continuar com Microsoft
      </button>

      <div className="divider">ou</div>

      <form className="form" onSubmit={emailLogin}>
        <div className="field">
          <label htmlFor="email">E-mail</label>

          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Senha</label>

          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          className="btn btn-primary"
          disabled={busy}
        >
          {busy ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {message && (
        <p className="muted" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
