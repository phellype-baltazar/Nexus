"use client";

import {useState} from "react";
import {Check,Copy,Link2,Share2,Users} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

const ROLE_LABELS:Record<string,string>={program_manager:"Program Manager",project_manager:"Project Manager",member:"Time"};

function extensionFromType(type:string){
  if(type.includes("png"))return"png";
  if(type.includes("jpeg")||type.includes("jpg"))return"jpg";
  if(type.includes("webp"))return"webp";
  if(type.includes("svg"))return"svg";
  return"png";
}

export function WorkspaceActions({organizationId,organizationName,logoUrl,initial}:{organizationId:string;organizationName:string;logoUrl?:string;initial:any}){
  const [info,setInfo]=useState<any>(initial);
  const [msg,setMsg]=useState("");
  const [inviteRole,setInviteRole]=useState(initial?.default_role||"member");
  const [busy,setBusy]=useState(false);
  const s=createClient();

  async function ensureInvite(){
    if(info?.code && info?.default_role===inviteRole && info?.join_mode==="request") return info;
    setBusy(true);setMsg("");
    const{data,error}=await s.rpc("rpc_regenerate_workspace_invite_code",{
      p_organization_id:organizationId,
      p_join_mode:"request",
      p_expires_at:null,
      p_max_uses:null,
      p_default_role:inviteRole
    });
    setBusy(false);
    if(error){setMsg(error.message);return null}
    setInfo(data);setMsg(`Convite para ${ROLE_LABELS[inviteRole]} gerado. A entrada ficará pendente para sua aprovação.`);
    return data;
  }

  function buildLink(code:string){return `${window.location.origin}/invite/${encodeURIComponent(code)}`}

  async function copyLink(){
    const current=await ensureInvite();
    if(!current?.code)return;
    await navigator.clipboard.writeText(buildLink(current.code));
    setMsg("Link de convite copiado. O acesso só será liberado após sua aprovação.");
  }

  async function getLogoFile(){
    if(!logoUrl || logoUrl.startsWith("data:"))return null;
    try{
      const response=await fetch(logoUrl,{cache:"no-store"});
      if(!response.ok)return null;
      const blob=await response.blob();
      const type=blob.type||"image/png";
      const file=new File([blob],`logo-${organizationName.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}.${extensionFromType(type)}`,{type});
      if(typeof navigator.canShare==="function" && navigator.canShare({files:[file]}))return file;
    }catch{}
    return null;
  }

  async function share(){
    const current=await ensureInvite();
    if(!current?.code)return;
    const url=buildLink(current.code);
    const text=`Você foi convidado para solicitar acesso ao workspace ${organizationName}. Tipo sugerido: ${ROLE_LABELS[inviteRole]}. O acesso será liberado após aprovação do responsável.\n${url}`;
    if(navigator.share){
      try{
        const logoFile=await getLogoFile();
        if(logoFile){
          await navigator.share({title:`Convite · ${organizationName}`,text,files:[logoFile]});
        }else{
          await navigator.share({title:`Convite · ${organizationName}`,text,url});
        }
        setMsg("Convite pronto para compartilhar.");
        return;
      }catch(err:any){if(err?.name==="AbortError")return}
    }
    await navigator.clipboard.writeText(text);setMsg("Convite copiado para compartilhar.");
  }

  async function copyCode(){
    const current=await ensureInvite();
    if(!current?.code)return;
    await navigator.clipboard.writeText(current.code);setMsg("Código copiado.");
  }

  return <section className="card form" style={{overflow:"hidden"}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
      <div style={{width:42,height:42,borderRadius:14,display:"grid",placeItems:"center",background:"color-mix(in srgb, var(--primary, #5b21b6) 10%, white)",color:"var(--primary, #5b21b6)",flexShrink:0}}><Users size={21}/></div>
      <div style={{minWidth:0}}><h2 style={{margin:0}}>Convidar para este workspace</h2><p className="row-sub" style={{margin:"5px 0 0"}}>A pessoa entra pelo link, mas <strong>não recebe acesso automaticamente</strong>. Você revisa e aprova antes de liberar.</p></div>
    </div>

    <div className="field"><label>Tipo sugerido de acesso</label><select className="select" value={inviteRole} onChange={e=>setInviteRole(e.target.value)}>
      <option value="program_manager">Program Manager — Programas, Projetos e Ações</option>
      <option value="project_manager">Project Manager — Projetos e Ações</option>
      <option value="member">Time — cria e atualiza Ações</option>
    </select><div className="row-sub">Este é apenas o tipo sugerido. Na aprovação você poderá alterar.</div></div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <button type="button" className="btn btn-primary" onClick={share} disabled={busy} style={{minHeight:48}}><Share2 size={18}/> Compartilhar</button>
      <button type="button" className="btn btn-outline" onClick={copyLink} disabled={busy} style={{minHeight:48}}><Link2 size={18}/> Copiar link</button>
    </div>

    <div className="notice" style={{display:"flex",alignItems:"flex-start",gap:9}}><Check size={17} style={{marginTop:1,flexShrink:0}}/><span><strong>Aprovação obrigatória:</strong> depois que a pessoa fizer login, a solicitação aparecerá em Pessoas. Você confirma ou altera o perfil e só então libera o acesso.</span></div>

    <details>
      <summary style={{cursor:"pointer",fontWeight:800,color:"var(--primary, #5b21b6)",padding:"6px 0"}}>Código alternativo</summary>
      <div className="form" style={{marginTop:10}}>
        <button type="button" className="btn btn-secondary btn-block" onClick={ensureInvite} disabled={busy}>{busy?"Gerando...":"Gerar novo convite"}</button>
        {info?.code&&<div className="field"><label>Código</label><div style={{display:"flex",gap:8,alignItems:"stretch"}}><div className="codebox" style={{flex:1,margin:0}}>{info.code}</div><button type="button" className="btn btn-outline" aria-label="Copiar código" onClick={copyCode}><Copy size={17}/></button></div></div>}
      </div>
    </details>

    {msg&&<div className={msg.toLowerCase().includes("não")||msg.toLowerCase().includes("erro")?"error":"successbox"}>{msg}</div>}
  </section>;
}
