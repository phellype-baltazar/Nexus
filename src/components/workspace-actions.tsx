"use client";

import {useState} from "react";
import {Check,Copy,Link2,Share2,Users} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

const ROLE_LABELS:Record<string,string>={program_manager:"Program Manager",project_manager:"Project Manager",member:"Time"};

export function WorkspaceActions({organizationId,organizationName,initial}:{organizationId:string;organizationName:string;initial:any}){
  const [info,setInfo]=useState<any>(initial);
  const [msg,setMsg]=useState("");
  const [joinMode,setJoinMode]=useState(initial?.join_mode||"auto_join");
  const [inviteRole,setInviteRole]=useState(initial?.default_role||"member");
  const [busy,setBusy]=useState(false);
  const s=createClient();

  async function regen(mode=joinMode,role=inviteRole){
    setBusy(true);setMsg("");
    const{data,error}=await s.rpc("rpc_regenerate_workspace_invite_code",{p_organization_id:organizationId,p_join_mode:mode,p_expires_at:null,p_max_uses:null,p_default_role:role});
    if(error)setMsg(error.message);else{setInfo(data);setJoinMode(mode);setInviteRole(role);setMsg(`Convite para ${ROLE_LABELS[role]||role} gerado.`)}
    setBusy(false);
  }

  async function ensureDirect(){
    if(info?.code && info?.join_mode==="auto_join" && info?.default_role===inviteRole) return info;
    setBusy(true);setMsg("");
    const{data,error}=await s.rpc("rpc_regenerate_workspace_invite_code",{p_organization_id:organizationId,p_join_mode:"auto_join",p_expires_at:null,p_max_uses:null,p_default_role:inviteRole});
    setBusy(false);
    if(error){setMsg(error.message);return null}
    setInfo(data);setJoinMode("auto_join");setMsg(`Convite direto para ${ROLE_LABELS[inviteRole]} ativado.`);
    return data;
  }

  function buildLink(code:string){return `${window.location.origin}/onboarding?invite=${encodeURIComponent(code)}`}

  async function copyLink(){
    let current=await ensureDirect();
    if(!current?.code)return;
    await navigator.clipboard.writeText(buildLink(current.code));
    setMsg("Link de convite copiado.");
  }

  async function share(){
    let current=await ensureDirect();
    if(!current?.code)return;
    const url=buildLink(current.code);
    const text=`Você foi convidado como ${ROLE_LABELS[inviteRole]} para o workspace ${organizationName} no Nexus.`;
    if(navigator.share){
      try{await navigator.share({title:`Convite · ${organizationName}`,text,url});setMsg("Convite pronto para compartilhar.");return}catch(err:any){if(err?.name==="AbortError")return}
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);setMsg("Convite copiado para compartilhar.");
  }

  async function copyCode(){if(!info?.code)return;await navigator.clipboard.writeText(info.code);setMsg("Código copiado.")}

  return <section className="card form" style={{overflow:"hidden"}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
      <div style={{width:42,height:42,borderRadius:14,display:"grid",placeItems:"center",background:"color-mix(in srgb, var(--primary, #5b21b6) 10%, white)",color:"var(--primary, #5b21b6)",flexShrink:0}}><Users size={21}/></div>
      <div style={{minWidth:0}}><h2 style={{margin:0}}>Convidar para este workspace</h2><p className="row-sub" style={{margin:"5px 0 0"}}>Escolha o tipo de usuário e compartilhe. O acesso chegará diretamente em <strong>{organizationName}</strong>.</p></div>
    </div>

    <div className="field"><label>Tipo de usuário</label><select className="select" value={inviteRole} onChange={e=>setInviteRole(e.target.value)}>
      <option value="program_manager">Program Manager — cria e gerencia Programas</option>
      <option value="project_manager">Project Manager — cria Projetos e Ações</option>
      <option value="member">Time — atualiza Ações atribuídas</option>
    </select></div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <button type="button" className="btn btn-primary" onClick={share} disabled={busy} style={{minHeight:48}}><Share2 size={18}/> Compartilhar</button>
      <button type="button" className="btn btn-outline" onClick={copyLink} disabled={busy} style={{minHeight:48}}><Link2 size={18}/> Copiar link</button>
    </div>

    <div className="notice" style={{display:"flex",alignItems:"flex-start",gap:9}}><Check size={17} style={{marginTop:1,flexShrink:0}}/><span>O link é vinculado a <strong>{organizationName}</strong> e ao papel <strong>{ROLE_LABELS[inviteRole]}</strong>. Após login, a pessoa entra diretamente neste workspace.</span></div>

    <details>
      <summary style={{cursor:"pointer",fontWeight:800,color:"var(--primary, #5b21b6)",padding:"6px 0"}}>Opções avançadas</summary>
      <div className="form" style={{marginTop:10}}>
        <div className="field"><label>Modo de entrada</label><select className="select" value={joinMode} onChange={e=>setJoinMode(e.target.value)}><option value="auto_join">Entrada automática</option><option value="request">Exigir aprovação</option></select></div>
        <button type="button" className="btn btn-secondary btn-block" onClick={()=>regen(joinMode,inviteRole)} disabled={busy}>{busy?"Atualizando...":"Aplicar e gerar novo link"}</button>
        {info?.code&&<div className="field"><label>Código alternativo</label><div style={{display:"flex",gap:8,alignItems:"stretch"}}><div className="codebox" style={{flex:1,margin:0}}>{info.code}</div><button type="button" className="btn btn-outline" aria-label="Copiar código" onClick={copyCode}><Copy size={17}/></button></div></div>}
      </div>
    </details>

    {msg&&<div className={msg.toLowerCase().includes("não")||msg.toLowerCase().includes("erro")?"error":"successbox"}>{msg}</div>}
  </section>;
}
