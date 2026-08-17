"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

const LABELS:Record<string,string>={organization_owner:"Owner",organization_admin:"Owner",group_admin:"Diretor",program_manager:"Program Manager",project_manager:"Project Manager",member:"Time",viewer:"Visualizador",guest:"Convidado"};

export function roleLabel(role?:string|null){return LABELS[String(role||"")]||String(role||"Membro")}

export function MemberRoleEditor({organizationId,userId,role,isOwner}:{organizationId:string;userId:string;role:string;isOwner?:boolean}){
  const [value,setValue]=useState(role);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");

  async function change(next:string){
    setValue(next);setBusy(true);setMsg("");
    const s=createClient();
    const {error}=await s.from("organization_members").update({role:next,updated_at:new Date().toISOString()}).eq("organization_id",organizationId).eq("user_id",userId);
    if(error){setValue(role);setMsg(error.message)}else{setMsg("Papel atualizado.");setTimeout(()=>location.reload(),350)}
    setBusy(false);
  }

  if(isOwner||role==="organization_owner")return <span className="chip">Owner</span>;

  return <div style={{width:"100%",maxWidth:280}}>
    <select className="select" value={value} disabled={busy} onChange={e=>change(e.target.value)} aria-label="Tipo de usuário" style={{width:"100%"}}>
      <option value="group_admin">Diretor</option>
      <option value="program_manager">Program Manager</option>
      <option value="project_manager">Project Manager</option>
      <option value="member">Time</option>
    </select>
    {msg&&<div className="row-sub" style={{marginTop:4}}>{msg}</div>}
  </div>;
}
