"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function safeNext(nextPath:string){return nextPath.startsWith("/")&&!nextPath.startsWith("//")?nextPath:"/app/dashboard"}

export function LoginForm({nextPath=""}:{nextPath?:string}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState<"email"|"code">("email");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();
  const destination=useMemo(()=>safeNext(nextPath),[nextPath]);

  useEffect(() => {
    function resetLoginState() {setBusy(false)}
    window.addEventListener("pageshow", resetLoginState);
    return () => window.removeEventListener("pageshow", resetLoginState);
  }, []);

  function oauth(provider: "google" | "azure") {
    setBusy(true);setMessage(null);
    window.location.href = `/auth/start?provider=${provider}&next=${encodeURIComponent(destination)}`;
  }

  async function emailLogin(e: React.FormEvent) {
    e.preventDefault();setBusy(true);setMessage(null);
    try {
      const { data: current } = await supabase.auth.getSession();
      if (current.session) await supabase.auth.signOut({scope: "local"});
      const { error } = await supabase.auth.signInWithPassword({email,password});
      if (error) {setMessage(error.message);setBusy(false);return}
      window.location.href = destination;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível entrar.");
      setBusy(false);
    }
  }

  async function sendOtp(e: React.FormEvent){
    e.preventDefault();
    const normalized=email.trim().toLowerCase();
    if(!normalized)return;
    setBusy(true);setMessage(null);
    try{
      const {error}=await supabase.auth.signInWithOtp({
        email:normalized,
        options:{shouldCreateUser:true,emailRedirectTo:`${window.location.origin}${destination}`}
      });
      if(error){setMessage(error.message);setBusy(false);return}
      setEmail(normalized);
      setOtpStep("code");
      setMessage("Enviamos um código de acesso para o seu e-mail. Digite os 6 números abaixo.");
    }catch(error){
      setMessage(error instanceof Error?error.message:"Não foi possível enviar o código.");
    }finally{setBusy(false)}
  }

  async function verifyOtp(e: React.FormEvent){
    e.preventDefault();
    const token=otp.replace(/\D/g,"").slice(0,6);
    if(token.length!==6){setMessage("Digite o código de 6 números enviado por e-mail.");return}
    setBusy(true);setMessage(null);
    try{
      const {error}=await supabase.auth.verifyOtp({email:email.trim().toLowerCase(),token,type:"email"});
      if(error){setMessage("Código inválido ou expirado. Solicite um novo código.");setBusy(false);return}
      window.location.href=destination;
    }catch(error){
      setMessage(error instanceof Error?error.message:"Não foi possível validar o código.");
      setBusy(false);
    }
  }

  function resetOtp(){setOtpStep("email");setOtp("");setMessage(null)}

  return <div className="form">
    <button className="btn btn-outline" disabled={busy} onClick={() => oauth("google")}>Continuar com Google</button>
    <button className="btn btn-outline" disabled={busy} onClick={() => oauth("azure")}>Continuar com Microsoft</button>

    <div className="divider">ou</div>

    <div className="card" style={{margin:0,padding:14,borderColor:"var(--line)"}}>
      <div style={{fontWeight:800,marginBottom:4}}>Entrar com e-mail corporativo</div>
      <div className="muted" style={{fontSize:13,marginBottom:12}}>Use esta opção quando o login Microsoft da empresa estiver bloqueado.</div>
      {otpStep==="email"?<form className="form" onSubmit={sendOtp}>
        <div className="field"><label htmlFor="corporate-email">E-mail</label><input id="corporate-email" className="input" type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="nome@empresa.com" required/></div>
        <button className="btn btn-primary" disabled={busy}>{busy?"Enviando...":"Receber código por e-mail"}</button>
      </form>:<form className="form" onSubmit={verifyOtp}>
        <div className="field"><label htmlFor="otp-code">Código de 6 números</label><input id="otp-code" className="input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} value={otp} onChange={(e)=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" required style={{fontSize:24,letterSpacing:6,textAlign:"center",fontWeight:800}}/></div>
        <button className="btn btn-primary" disabled={busy||otp.length!==6}>{busy?"Validando...":"Entrar com código"}</button>
        <button type="button" className="btn btn-outline" disabled={busy} onClick={resetOtp}>Usar outro e-mail</button>
        <button type="button" className="btn btn-outline" disabled={busy} onClick={(e)=>sendOtp(e as unknown as React.FormEvent)}>Reenviar código</button>
      </form>}
    </div>

    <div className="divider">ou entre com senha</div>
    <form className="form" onSubmit={emailLogin}>
      <div className="field"><label htmlFor="email">E-mail</label><input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required/></div>
      <div className="field"><label htmlFor="password">Senha</label><input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required/></div>
      <button className="btn btn-outline" disabled={busy}>{busy ? "Entrando..." : "Entrar com senha"}</button>
    </form>
    {message && <p className="muted" role="alert">{message}</p>}
  </div>;
}
