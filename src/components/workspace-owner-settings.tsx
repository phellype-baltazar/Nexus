"use client";

import {useState} from "react";
import {Pencil,Trash2,X} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

export function WorkspaceOwnerSettings({organizationId,organizationName}:{organizationId:string;organizationName:string}){
  const s=createClient();
  const[name,setName]=useState(organizationName);
  const[editing,setEditing]=useState(false);
  const[deleting,setDeleting]=useState(false);
  const[confirmName,setConfirmName]=useState("");
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

  async function remove(){
    if(confirmName!==organizationName)return;
    setBusy(true);setMsg("");
    const{error}=await s.rpc("rpc_delete_workspace",{p_organization_id:organizationId,p_confirm_name:confirmName});
    setBusy(false);
    if(error){setMsg(error.message);return}
    location.href="/onboarding";
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
    </div>

    <div style={{borderTop:"1px solid var(--line)",paddingTop:16}}>
      {!deleting?<button type="button" className="btn btn-outline btn-block" onClick={()=>{setDeleting(true);setMsg("")}} style={{color:"#b42318",borderColor:"#f3b4ae"}}><Trash2 size={18}/> Excluir workspace</button>:
      <div className="form" style={{background:"#fff7f6",border:"1px solid #f3b4ae",borderRadius:16,padding:14}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"}}><div><strong style={{color:"#9f1c12"}}>Excluir workspace</strong><div className="row-sub" style={{marginTop:4}}>Esta ação desativa o workspace e remove o acesso de todos. Digite o nome exatamente para confirmar.</div></div><button type="button" onClick={()=>{setDeleting(false);setConfirmName("")}} aria-label="Cancelar exclusão" style={{border:0,background:"transparent",padding:2}}><X size={20}/></button></div>
        <input className="input" value={confirmName} onChange={e=>setConfirmName(e.target.value)} placeholder={organizationName}/>
        <button type="button" className="btn btn-block" onClick={remove} disabled={busy||confirmName!==organizationName} style={{background:"#b42318",color:"white"}}>{busy?"Excluindo...":"Excluir definitivamente do uso"}</button>
      </div>}
    </div>
    {msg&&<div className="error">{msg}</div>}
  </section>;
}
