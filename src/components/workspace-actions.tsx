"use client";

import {useMemo,useState} from "react";
import {Check,Copy,Link2,Share2,Users} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

const ROLE_LABELS:Record<string,string>={group_admin:"Diretor",program_manager:"Program Manager",project_manager:"Project Manager",member:"Time"};

type MessageState={text:string;kind:"success"|"error"}|null;

function extensionFromType(type:string){
  if(type.includes("png"))return"png";
  if(type.includes("jpeg")||type.includes("jpg"))return"jpg";
  if(type.includes("webp"))return"webp";
  if(type.includes("svg"))return"svg";
  return"png";
}

export function WorkspaceActions({organizationId,organizationName,logoUrl,initial}:{organizationId:string;organizationName:string;logoUrl?:string;initial:any}){
  const [info,setInfo]=useState<any>(initial);
  const [message,setMessage]=useState<MessageState>(null);
  const [inviteRole,setInviteRole]=useState(initial?.default_role||"member");
  const [busy,setBusy]=useState(false);
  const s=createClient();
  const inviteLink=useMemo(()=>info?.code&&typeof window!=="undefined"?`${window.location.origin}/invite/${encodeURIComponent(info.code)}`:"",[info?.code]);

  async function ensureInvite(forceNew=false){
    if(!forceNew&&info?.code&&info?.default_role===inviteRole&&info?.join_mode==="request")return info;
    setBusy(true);setMessage(null);
    const{data,error}=await s.rpc("rpc_regenerate_workspace_invite_code",{
      p_organization_id:organizationId,p_join_mode:"request",p_expires_at:null,p_max_uses:null,p_default_role:inviteRole
    });
    setBusy(false);
    if(error){setMessage({text:"Não foi possível gerar o convite. Tente novamente.",kind:"error"});return null}
    setInfo(data);
    setMessage({text:`Convite para ${ROLE_LABELS[inviteRole]} criado. O acesso ficará pendente para aprovação.`,kind:"success"});
    return data;
  }

  function buildLink(code:string){return `${window.location.origin}/invite/${encodeURIComponent(code)}`}

  async function copyLink(){
    const current=await ensureInvite(); if(!current?.code)return;
    try{await navigator.clipboard.writeText(buildLink(current.code));setMessage({text:"Link de convite copiado.",kind:"success"});}
    catch{setMessage({text:"Não foi possível copiar o link neste dispositivo.",kind:"error"});}
  }

  async function getLogoFile(){
    if(!logoUrl||logoUrl.startsWith("data:"))return null;
    try{const response=await fetch(logoUrl,{cache:"no-store"});if(!response.ok)return null;const blob=await response.blob();const type=blob.type||"image/png";const file=new File([blob],`logo-${organizationName.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}.${extensionFromType(type)}`,{type});if(typeof navigator.canShare==="function"&&navigator.canShare({files:[file]}))return file;}catch{}
    return null;
  }

  async function share(){
    const current=await ensureInvite(); if(!current?.code)return;
    const url=buildLink(current.code);
    const text=`Você foi convidado para solicitar acesso ao workspace ${organizationName}. Tipo sugerido: ${ROLE_LABELS[inviteRole]}. O acesso será liberado após aprovação.\n${url}`;
    if(navigator.share){
      try{const logoFile=await getLogoFile();if(logoFile)await navigator.share({title:`Convite · ${organizationName}`,text,files:[logoFile]});else await navigator.share({title:`Convite · ${organizationName}`,text,url});setMessage({text:"Convite pronto para compartilhar.",kind:"success"});return;}catch(err:any){if(err?.name==="AbortError")return;}
    }
    try{await navigator.clipboard.writeText(text);setMessage({text:"Convite copiado para compartilhar.",kind:"success"});}
    catch{setMessage({text:"Não foi possível compartilhar ou copiar o convite neste dispositivo.",kind:"error"});}
  }

  async function copyCode(){const current=await ensureInvite();if(!current?.code)return;try{await navigator.clipboard.writeText(current.code);setMessage({text:"Código copiado.",kind:"success"});}catch{setMessage({text:"Não foi possível copiar o código.",kind:"error"});}}

  return <section className="card form" style={{overflow:"hidden"}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
      <div style={{width:42,height:42,borderRadius:14,display:"grid",placeItems:"center",background:"color-mix(in srgb, var(--primary, #5b21b6) 10%, white)",color:"var(--primary, #5b21b6)",flexShrink:0}}><Users size={21}/></div>
      <div style={{minWidth:0}}><h2 style={{margin:0}}>Convidar para este workspace</h2><p className="row-sub" style={{margin:"5px 0 0"}}>Todos os membros podem compartilhar convites. A aprovação depende do nível solicitado.</p></div>
    </div>

    <div className="field"><label>Tipo sugerido de acesso</label><select className="select" value={inviteRole} onChange={e=>{setInviteRole(e.target.value);setMessage(null)}}>
      <option value="group_admin">Diretor — aprovação somente pelo Owner</option>
      <option value="program_manager">Program Manager — Diretor ou Owner</option>
      <option value="project_manager">Project Manager — Diretor ou Owner</option>
      <option value="member">Time — Manager, Diretor ou Owner</option>
    </select><div className="row-sub">O perfil é apenas sugerido. Quem aprovar pode revisar dentro do nível permitido.</div></div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <button type="button" className="btn btn-primary" onClick={share} disabled={busy} style={{minHeight:48}}><Share2 size={18}/> {busy?"Gerando...":"Compartilhar"}</button>
      <button type="button" className="btn btn-outline" onClick={copyLink} disabled={busy} style={{minHeight:48}}><Link2 size={18}/> Copiar link</button>
    </div>

    {inviteLink&&info?.default_role===inviteRole&&<div className="notice" style={{display:"grid",gap:6}}><strong>Convite ativo · {ROLE_LABELS[inviteRole]}</strong><div className="row-sub" style={{wordBreak:"break-all"}}>{inviteLink}</div><div className="row-sub">Este link continua válido mesmo se outros convites forem criados depois.</div></div>}

    <div className="notice" style={{display:"flex",alignItems:"flex-start",gap:9}}><Check size={17} style={{marginTop:1,flexShrink:0}}/><span><strong>Aprovação:</strong> Diretor → Owner. Managers → Diretor ou Owner. Time → Managers, Diretor ou Owner. O Time pode convidar, mas não aprovar.</span></div>

    <details><summary style={{cursor:"pointer",fontWeight:800,color:"var(--primary, #5b21b6)",padding:"6px 0"}}>Código alternativo</summary><div className="form" style={{marginTop:10}}><button type="button" className="btn btn-secondary btn-block" onClick={()=>ensureInvite(true)} disabled={busy}>{busy?"Gerando...":"Gerar outro convite"}</button>{info?.code&&<div className="field"><label>Código</label><div style={{display:"flex",gap:8,alignItems:"stretch"}}><div className="codebox" style={{flex:1,margin:0}}>{info.code}</div><button type="button" className="btn btn-outline" aria-label="Copiar código" onClick={copyCode}><Copy size={17}/></button></div></div>}</div></details>

    {message&&<div className={message.kind==="error"?"error":"successbox"}>{message.text}</div>}
  </section>;
}
