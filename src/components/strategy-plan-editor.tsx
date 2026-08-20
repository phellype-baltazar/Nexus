"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

export function StrategyPlanEditor({plan}:{plan:any}){
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  const [name,setName]=useState(plan.name||""),[intent,setIntent]=useState(plan.strategic_intent||""),[start,setStart]=useState(plan.period_start||""),[end,setEnd]=useState(plan.period_end||""),[status,setStatus]=useState(plan.status||"active"),[version,setVersion]=useState(String(plan.version||1));
  async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setMsg("");const s=createClient();const{error}=await s.from("strategic_plans").update({name:name.trim(),strategic_intent:intent||null,period_start:start||null,period_end:end||null,status,version:Math.max(1,Number(version)||1)}).eq("id",plan.id).eq("organization_id",plan.organization_id);setBusy(false);if(error)setMsg(error.message);else location.reload()}
  if(!open)return <button className="btn btn-outline" style={{marginTop:10}} onClick={()=>setOpen(true)}>Editar plano</button>;
  return <form className="form" style={{marginTop:12}} onSubmit={save}>
    <div className="field"><label>Nome do plano</label><input className="input" value={name} onChange={e=>setName(e.target.value)} required/></div>
    <div className="field"><label>Intenção estratégica</label><textarea className="textarea" value={intent} onChange={e=>setIntent(e.target.value)}/></div>
    <div className="grid grid-2"><div className="field"><label>Início</label><input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)}/></div><div className="field"><label>Fim</label><input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)}/></div></div>
    <div className="grid grid-2"><div className="field"><label>Status</label><select className="select" value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Em execução</option><option value="draft">Rascunho</option><option value="completed">Concluído</option><option value="archived">Arquivado</option></select></div><div className="field"><label>Versão</label><input className="input" type="number" min="1" value={version} onChange={e=>setVersion(e.target.value)}/></div></div>
    <div className="grid grid-2"><button className="btn btn-primary" disabled={busy}>{busy?"Salvando...":"Salvar plano"}</button><button type="button" className="btn btn-outline" onClick={()=>setOpen(false)} disabled={busy}>Cancelar</button></div>{msg&&<div className="error">{msg}</div>}
  </form>
}
