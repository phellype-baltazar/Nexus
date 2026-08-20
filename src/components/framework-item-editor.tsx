"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

export function FrameworkItemEditor({item}:{item:any}){
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
  const [name,setName]=useState(item.name||""),[category,setCategory]=useState(item.category||""),[classification,setClassification]=useState(item.classification||""),[status,setStatus]=useState(item.status||"active");
  const [baseline,setBaseline]=useState(item.baseline_text||""),[plan,setPlan]=useState(item.planned_delivery||""),[target,setTarget]=useState(item.target_text||"");
  async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setMsg("");const s=createClient();const{error}=await s.from("strategic_framework_items").update({name:name.trim(),category:category||null,classification:classification||null,status,baseline_text:baseline||null,planned_delivery:plan||null,target_text:target||null}).eq("id",item.id).eq("organization_id",item.organization_id);setBusy(false);if(error)setMsg(error.message);else location.reload()}
  if(!open)return <button className="btn btn-outline" style={{padding:"6px 9px"}} onClick={()=>setOpen(true)}>Editar</button>;
  return <form className="form" style={{marginTop:10,width:"100%"}} onSubmit={save}>
    <div className="field"><label>Item</label><input className="input" value={name} onChange={e=>setName(e.target.value)} required/></div>
    <div className="grid grid-2"><div className="field"><label>Frente</label><input className="input" value={category} onChange={e=>setCategory(e.target.value)}/></div><div className="field"><label>Classificação</label><input className="input" value={classification} onChange={e=>setClassification(e.target.value)}/></div></div>
    <div className="field"><label>Status</label><select className="select" value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Em andamento</option><option value="on_track">On track</option><option value="off_track">Off tracking</option><option value="completed">Concluído</option><option value="paused">Pausado</option></select></div>
    <div className="field"><label>Baseline</label><textarea className="textarea" value={baseline} onChange={e=>setBaseline(e.target.value)}/></div>
    <div className="field"><label>Plano / entrega prevista</label><textarea className="textarea" value={plan} onChange={e=>setPlan(e.target.value)}/></div>
    <div className="field"><label>Meta</label><textarea className="textarea" value={target} onChange={e=>setTarget(e.target.value)}/></div>
    <div className="grid grid-2"><button className="btn btn-primary" disabled={busy}>{busy?"Salvando...":"Salvar"}</button><button type="button" className="btn btn-outline" onClick={()=>setOpen(false)} disabled={busy}>Cancelar</button></div>{msg&&<div className="error">{msg}</div>}
  </form>
}
