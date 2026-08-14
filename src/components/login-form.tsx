"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const supabase = createClient();

  function oauth(
    provider: "google" | "azure"
  ) {
    setBusy(true);
    setMessage(null);

    // A troca de sessão agora acontece
    // no servidor, não no navegador.
    window.location.href =
      `/auth/start?provider=${provider}`;
  }

  async function emailLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setBusy(true);
    setMessage(null);

    try {
      const { data: current } =
        await supabase.auth.getSession();

      if (current.session) {
        await supabase.auth.signOut({
          scope: "local",
        });
      }

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

      window.location.href =
        "/app/dashboard";
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

      <div className="divider">
        ou
      </div>

      <form
        className="form"
        onSubmit={emailLogin}
      >
        <div className="field">
          <label htmlFor="email">
            E-mail
          </label>

          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">
            Senha
          </label>

          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />
        </div>

        <button
          className="btn btn-primary"
          disabled={busy}
        >
          {busy
            ? "Entrando..."
            : "Entrar"}
        </button>
      </form>

      {message && (
        <p
          className="muted"
          role="alert"
        >
          {message}
        </p>
      )}
    </div>
  );
}
