"use client";

import {useState} from "react";
import {Trash2,X} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

export function WorkspaceDeleteButton({organizationId,organizationName,active}:{organizationId:string;organizationName:string;active:boolean}){
  const s=createClient();
  const[open,setOpen]=useState(false);
  const[confirmName,setConfirmName]=useState("");
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState("");

  async function remove(){
    if(confirmName!==organizationName)return;
    setBusy(true);setMsg("");
    const{error}=await s.rpc("rpc_delete_workspace",{p_organization_id:organizationId,p_confirm_name:confirmName});
    setBusy(false);
    if(error){setMsg(error.message);return}
    if(active) location.href="/onboarding";
    else location.reload();
  }

  return <>
    <button
      type="button"
      aria-label={`Excluir ${organizationName}`}
      title="Excluir workspace"
      onClick={e=>{e.preventDefault();e.stopPropagation();setOpen(true);}}
      style={{width:44,height:44,borderRadius:14,border:"1px solid #f3b4ae",background:"#fff",color:"#b42318",display:"grid",placeItems:"center",flexShrink:0,cursor:"pointer"}}
    ><Trash2 size={19}/></button>

    {open&&<div onClick={()=>!busy&&setOpen(false)} style={{position:"fixed",inset:0,zIndex:1200,background:"rgba(15,23,42,.55)",display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(560px,100%)",background:"white",borderRadius:24,padding:20,boxShadow:"0 24px 60px rgba(0,0,0,.28)"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"}}>
          <div><h3 style={{margin:0}}>Excluir workspace?</h3><p className="row-sub" style={{margin:"6px 0 0"}}>Esta ação desativa <strong>{organizationName}</strong> e remove o acesso dos membros. Digite o nome para confirmar.</p></div>
          <button type="button" onClick={()=>setOpen(false)} disabled={busy} aria-label="Fechar" style={{border:0,background:"transparent",padding:2}}><X size={21}/></button>
        </div>
        <input className="input" value={confirmName} onChange={e=>setConfirmName(e.target.value)} placeholder={organizationName} style={{marginTop:16}} autoFocus/>
        {msg&&<div className="error" style={{marginTop:10}}>{msg}</div>}
        <button type="button" className="btn btn-block" onClick={remove} disabled={busy||confirmName!==organizationName} style={{marginTop:12,background:"#b42318",color:"#fff"}}>{busy?"Excluindo...":"Excluir workspace"}</button>
      </div>
    </div>}
  </>;
}
