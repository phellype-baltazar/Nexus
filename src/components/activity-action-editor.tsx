"use client";

import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

function derivedStatus(status:string,dueDate:string|null){
  if(status==="done") return {label:"Feita",className:"success"};
  if(status==="cancelled") return {label:"Cancelada",className:"danger"};
  const today=new Date().toISOString().slice(0,10);
  if(dueDate&&dueDate<today) return {label:"Atrasada",className:"danger"};
  return {label:"Em andamento",className:"warning"};
}

export function ActivityActionEditor({id,initialStatus,dueDate,initialOwnerId,members}:{id:string;initialStatus:string;dueDate:string|null;initialOwnerId:string|null;members:{user_id:string;full_name:string|null}[]}){
  const [status,setStatus]=useState(initialStatus);
  const [ownerId,setOwnerId]=useState(initialOwnerId||"");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const visual=useMemo(()=>derivedStatus(status,dueDate),[status,dueDate]);

  async function updateStatus(next:"done"|"cancelled"){
    setBusy(true);setMessage("");
    const s=createClient();
    const payload:any={status:next};
    if(next==="done") payload.progress=100;
    const {error}=await s.from("activities").update(payload).eq("id",id);
    if(error){setMessage(error.message);setBusy(false);return;}
    setStatus(next);setBusy(false);location.reload();
  }

  async function updateOwner(next:string){
    setOwnerId(next);setBusy(true);setMessage("");
    const s=createClient();
    const {error}=await s.from("activities").update({primary_owner_id:next||null}).eq("id",id);
    if(error){setMessage(error.message);setBusy(false);return;}
    setBusy(false);location.reload();
  }

  return <section className="card form" style={{marginTop:12}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <h2 style={{margin:0}}>Atualizar ação</h2>
      <span className={`chip ${visual.className}`}>{visual.label}</span>
    </div>

    <div className="field">
      <label>Responsável</label>
      <select className="select" value={ownerId} onChange={e=>updateOwner(e.target.value)} disabled={busy}>
        <option value="">Sem responsável</option>
        {members.map(m=><option key={m.user_id} value={m.user_id}>{m.full_name||"Usuário"}</option>)}
      </select>
    </div>

    <div className="grid grid-2">
      <button className="btn btn-secondary" type="button" disabled={busy||status==="done"} onClick={()=>updateStatus("done")}>Marcar feita</button>
      <button className="btn btn-outline" type="button" disabled={busy||status==="cancelled"} onClick={()=>updateStatus("cancelled")}>Cancelar ação</button>
    </div>

    <div className="muted" style={{fontSize:12}}>A data prevista é fixa depois de definida. Enquanto a ação não estiver feita ou cancelada, o status é calculado automaticamente pelo prazo.</div>
    {message&&<div className="error">{message}</div>}
  </section>;
}
