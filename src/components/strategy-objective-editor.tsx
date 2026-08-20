"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

export function StrategyObjectiveEditor({objective,groups}:{objective:any;groups:any[]}){
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  const [name,setName]=useState(objective.name||""),[description,setDescription]=useState(objective.description||""),[group,setGroup]=useState(objective.group_id||"");
  const [start,setStart]=useState(objective.start_date||""),[end,setEnd]=useState(objective.due_date||""),[status,setStatus]=useState(objective.status||"active"),[progress,setProgress]=useState(String(objective.progress??0));
  async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setMsg("");const s=createClient();const{error}=await s.from("strategic_objectives").update({name:name.trim(),description:description||null,group_id:group||null,start_date:start||null,due_date:end||null,status,progress:Math.max(0,Math.min(100,Number(progress)||0))}).eq("id",objective.id).eq("organization_id",objective.organization_id);setBusy(false);if(error)setMsg(error.message);else location.reload()}
  async function remove(){if(!confirm("Excluir este objetivo estratégico?"))return;setBusy(true);const s=createClient();const{error}=await s.from("strategic_objectives").update({deleted_at:new Date().toISOString()}).eq("id",objective.id).eq("organization_id",objective.organization_id);setBusy(false);if(error)setMsg(error.message);else location.reload()}
  if(!open)return <button className="btn btn-outline" style={{padding:"7px 10px"}} onClick={()=>setOpen(true)}>Editar</button>;
  return <div className="card" style={{marginTop:10,width:"100%"}}><form className="form" onSubmit={save}>
    <div className="field"><label>Objetivo</label><input className="input" value={name} onChange={e=>setName(e.target.value)} required/></div>
    <div className="field"><label>Responsável</label><select className="select" value={group} onChange={e=>setGroup(e.target.value)}><option value="">Organização</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
    <div className="field"><label>Descrição</label><textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)}/></div>
    <div className="grid grid-2"><div className="field"><label>Início</label><input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)}/></div><div className="field"><label>Fim</label><input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)}/></div></div>
    <div className="grid grid-2"><div className="field"><label>Status</label><select className="select" value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Em andamento</option><option value="on_track">On track</option><option value="off_track">Off tracking</option><option value="completed">Concluído</option><option value="paused">Pausado</option></select></div><div className="field"><label>Progresso (%)</label><input className="input" type="number" min="0" max="100" value={progress} onChange={e=>setProgress(e.target.value)}/></div></div>
    <div className="grid grid-2"><button className="btn btn-primary" disabled={busy}>{busy?"Salvando...":"Salvar"}</button><button type="button" className="btn btn-outline" onClick={()=>setOpen(false)} disabled={busy}>Cancelar</button></div>
    <button type="button" className="btn btn-outline" onClick={remove} disabled={busy}>Excluir objetivo</button>{msg&&<div className="error">{msg}</div>}
  </form></div>
}
