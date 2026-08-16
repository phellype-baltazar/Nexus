"use client";

import {useState} from "react";
import {Check,Copy,Link2,Share2,Users} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

export function WorkspaceActions({organizationId,organizationName,initial}:{organizationId:string;organizationName:string;initial:any}){
  const [info,setInfo]=useState<any>(initial);
  const [msg,setMsg]=useState("");
  const [joinMode,setJoinMode]=useState(initial?.join_mode||"auto_join");
  const [busy,setBusy]=useState(false);
  const s=createClient();

  async function regen(mode=joinMode){
    setBusy(true);setMsg("");
    const{data,error}=await s.rpc("rpc_regenerate_workspace_invite_code",{p_organization_id:organizationId,p_join_mode:mode,p_expires_at:null,p_max_uses:null});
    if(error)setMsg(error.message);else{setInfo(data);setJoinMode(mode);setMsg(mode==="auto_join"?"Convite de acesso direto ativado.":"Novo convite gerado.")}
    setBusy(false);
  }

  async function ensureDirect(){
    if(info?.join_mode==="auto_join") return info;
    setBusy(true);setMsg("");
    const{data,error}=await s.rpc("rpc_regenerate_workspace_invite_code",{p_organization_id:organizationId,p_join_mode:"auto_join",p_expires_at:null,p_max_uses:null});
    setBusy(false);
    if(error){setMsg(error.message);return null}
    setInfo(data);setJoinMode("auto_join");setMsg("Convite de acesso direto ativado.");
    return data;
  }

  function buildLink(code:string){return `${window.location.origin}/onboarding?invite=${encodeURIComponent(code)}`}

  async function copyLink(){
    let current=info;
    if(!current?.code || current?.join_mode!=="auto_join") current=await ensureDirect();
    if(!current?.code)return;
    await navigator.clipboard.writeText(buildLink(current.code));
    setMsg("Link de convite copiado.");
  }

  async function share(){
    let current=info;
    if(!current?.code || current?.join_mode!=="auto_join") current=await ensureDirect();
    if(!current?.code)return;
    const url=buildLink(current.code);
    const text=`Você foi convidado para acessar o workspace ${organizationName} no Nexus.`;
    if(navigator.share){
      try{await navigator.share({title:`Convite · ${organizationName}`,text,url});setMsg("Convite pronto para compartilhar.");return}catch(err:any){if(err?.name==="AbortError")return}
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);setMsg("Convite copiado para compartilhar.");
  }

  async function copyCode(){
    if(!info?.code)return;
    await navigator.clipboard.writeText(info.code);setMsg("Código copiado.");
  }

  return <section className="card form" style={{overflow:"hidden"}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
      <div style={{width:42,height:42,borderRadius:14,display:"grid",placeItems:"center",background:"color-mix(in srgb, var(--primary, #5b21b6) 10%, white)",color:"var(--primary, #5b21b6)",flexShrink:0}}><Users size={21}/></div>
      <div style={{minWidth:0}}><h2 style={{margin:0}}>Convidar pessoas</h2><p className="row-sub" style={{margin:"5px 0 0"}}>Compartilhe um link. A pessoa entra no Nexus e chega diretamente em <strong>{organizationName}</strong>.</p></div>
    </div>

    {info?.code?<>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:4}}>
        <button type="button" className="btn btn-primary" onClick={share} disabled={busy} style={{minHeight:48}}><Share2 size={18}/> Compartilhar</button>
        <button type="button" className="btn btn-outline" onClick={copyLink} disabled={busy} style={{minHeight:48}}><Link2 size={18}/> Copiar link</button>
      </div>

      <div className="notice" style={{display:"flex",alignItems:"flex-start",gap:9}}><Check size={17} style={{marginTop:1,flexShrink:0}}/><span><strong>Acesso direto:</strong> o convite compartilhado adiciona a pessoa como membro deste workspace. Ela não precisa procurar a organização.</span></div>

      <details>
        <summary style={{cursor:"pointer",fontWeight:800,color:"var(--primary, #5b21b6)",padding:"6px 0"}}>Opções do convite</summary>
        <div className="form" style={{marginTop:10}}>
          <div className="field"><label>Modo de entrada</label><select className="select" value={joinMode} onChange={e=>setJoinMode(e.target.value)}><option value="auto_join">Acesso direto como membro</option><option value="request">Exigir aprovação</option></select></div>
          <button type="button" className="btn btn-secondary btn-block" onClick={()=>regen(joinMode)} disabled={busy}>{busy?"Atualizando...":"Aplicar e gerar novo link"}</button>
          <div className="field"><label>Código alternativo</label><div style={{display:"flex",gap:8,alignItems:"stretch"}}><div className="codebox" style={{flex:1,margin:0}}>{info.code}</div><button type="button" className="btn btn-outline" aria-label="Copiar código" onClick={copyCode}><Copy size={17}/></button></div></div>
        </div>
      </details>
    </>:<button type="button" className="btn btn-primary btn-block" onClick={()=>regen("auto_join")} disabled={busy}>{busy?"Gerando...":"Gerar link de convite"}</button>}

    {msg&&<div className={msg.toLowerCase().includes("não")||msg.toLowerCase().includes("erro")?"error":"successbox"}>{msg}</div>}
  </section>
}
