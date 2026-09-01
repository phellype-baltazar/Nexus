"use client";

import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

export function WorkspaceOwnershipTransfer({organizationId,currentUserId,members}:{organizationId:string;currentUserId:string;members:any[]}){
  const candidates=useMemo(()=>members.filter(m=>m.user_id!==currentUserId&&m.role!=="organization_owner"),[members,currentUserId]);
  const [open,setOpen]=useState(false),[userId,setUserId]=useState(""),[confirmText,setConfirmText]=useState(""),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  const selected=candidates.find(m=>m.user_id===userId);

  async function transfer(){
    if(!userId||confirmText!=="TRANSFERIR")return;
    setBusy(true);setMsg("");
    const s=createClient();
    const {error}=await s.rpc("rpc_transfer_workspace_ownership",{p_organization_id:organizationId,p_new_owner_user_id:userId});
    setBusy(false);
    if(error){setMsg(error.message);return}
    location.reload();
  }

  if(!candidates.length)return null;

  return <section className="card" style={{padding:16,display:"grid",gap:12,border:"1px solid #f0d5d5"}}>
    <div>
      <div className="eyebrow">Propriedade do workspace</div>
      <div className="row-title" style={{fontSize:18,marginTop:4}}>Transferir propriedade</div>
      <div className="row-sub" style={{marginTop:4}}>Use quando a responsabilidade pelo workspace passar para outra pessoa. O novo Owner assume o controle e você passa a Owner administrativo.</div>
    </div>
    {!open?<button className="btn btn-outline" type="button" onClick={()=>setOpen(true)}>Transferir propriedade</button>:<div className="form">
      <div className="field"><label>Novo Owner</label><select className="select" value={userId} onChange={e=>setUserId(e.target.value)}><option value="">Selecionar membro</option>{candidates.map(m=><option key={m.user_id} value={m.user_id}>{m.full_name||m.email||"Membro"} · {m.email||""}</option>)}</select></div>
      {selected&&<div className="notice"><strong>{selected.full_name||selected.email}</strong><div className="row-sub">Essa pessoa passará a ser o Owner principal do workspace.</div></div>}
      <div className="field"><label>Confirmação</label><input className="input" value={confirmText} onChange={e=>setConfirmText(e.target.value.toUpperCase())} placeholder="Digite TRANSFERIR"/></div>
      <div className="grid grid-2"><button className="btn btn-primary" type="button" disabled={busy||!userId||confirmText!=="TRANSFERIR"} onClick={transfer}>{busy?"Transferindo...":"Confirmar transferência"}</button><button className="btn btn-outline" type="button" disabled={busy} onClick={()=>{setOpen(false);setUserId("");setConfirmText("");setMsg("")}}>Cancelar</button></div>
      {msg&&<div className="error">{msg}</div>}
    </div>}
  </section>;
}
