"use client";

import {useState} from "react";
import {Pencil} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

export function WorkspaceOwnerSettings({organizationId,organizationName}:{organizationId:string;organizationName:string}){
  const s=createClient();
  const[name,setName]=useState(organizationName);
  const[editing,setEditing]=useState(false);
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState("");

  async function rename(){
    const next=name.trim();
    if(next===organizationName){setEditing(false);return}
    setBusy(true);setMsg("");
    const{error}=await s.rpc("rpc_rename_workspace",{p_organization_id:organizationId,p_name:next});
    setBusy(false);
    if(error){setMsg(error.message);return}
    setEditing(false);
    location.reload();
  }

  return <section className="card form">
    <div className="section-title" style={{margin:0,alignItems:"center"}}>
      <div><span className="eyebrow">Owner</span><h2 style={{marginTop:3}}>Gerenciar workspace</h2></div>
    </div>

    <div className="field">
      <label>Nome do workspace</label>
      {editing?<div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8}}>
        <input className="input" value={name} maxLength={120} onChange={e=>setName(e.target.value)} autoFocus/>
        <button type="button" className="btn btn-primary" onClick={rename} disabled={busy||name.trim().length<2}>{busy?"Salvando...":"Salvar"}</button>
      </div>:<button type="button" className="input" onClick={()=>setEditing(true)} style={{height:58,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",textAlign:"left"}}>
        <strong>{organizationName}</strong><Pencil size={18} style={{color:"var(--primary)"}}/>
      </button>}
      <div className="row-sub">Para excluir um workspace, use a lixeira ao lado de “Usar” ou “Ativo” na lista abaixo.</div>
    </div>

    {msg&&<div className="error">{msg}</div>}
  </section>;
}
