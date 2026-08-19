"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Milestone={id:string;name:string;milestone_date:string};

type Props={organizationId:string;projectId:string;milestones:Milestone[]};

function dateBR(v:string){return new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR")}

export function MilestoneManager({organizationId,projectId,milestones}:Props){
 const [open,setOpen]=useState(false),[editing,setEditing]=useState<Milestone|null>(null),[name,setName]=useState(""),[date,setDate]=useState(""),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 function startNew(){setEditing(null);setName("");setDate("");setMsg("");setOpen(true)}
 function startEdit(m:Milestone){setEditing(m);setName(m.name);setDate(m.milestone_date);setMsg("");setOpen(true)}
 async function save(){
  if(!name.trim()||!date)return setMsg("Informe nome e data.");
  setBusy(true);setMsg("");const s=createClient();
  const payload={organization_id:organizationId,project_id:projectId,name:name.trim(),milestone_date:date,updated_at:new Date().toISOString()};
  const {error}=editing?await s.from("project_milestones").update(payload).eq("id",editing.id):await s.from("project_milestones").insert(payload);
  if(error){setMsg(error.message);setBusy(false);return}location.reload();
 }
 async function remove(id:string){if(!confirm("Excluir este milestone?"))return;setBusy(true);const s=createClient();const {error}=await s.from("project_milestones").update({deleted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",id);if(error){setMsg(error.message);setBusy(false);return}location.reload()}
 return <>
  <section className="card" style={{marginTop:12}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><div><div className="eyebrow">Marcos do projeto</div><h2 style={{margin:"2px 0 0"}}>Milestones</h2></div><button className="btn btn-primary" type="button" onClick={startNew}>+ Adicionar</button></div>
   <p className="muted" style={{marginTop:6}}>Milestones têm apenas nome e data. Não possuem horas, workload ou responsável obrigatório.</p>
   {!milestones.length?<div className="empty">Nenhum milestone criado.</div>:milestones.map(m=><div className="row" key={m.id}><button type="button" onClick={()=>startEdit(m)} style={{border:0,background:"transparent",textAlign:"left",padding:0,flex:1,minWidth:0}}><div className="row-title">◆ {m.name}</div><div className="row-sub">{dateBR(m.milestone_date)}</div></button><button className="chip danger" type="button" disabled={busy} onClick={()=>remove(m.id)}>Excluir</button></div>)}
  </section>
  {open&&<div role="dialog" aria-modal="true" onClick={()=>!busy&&setOpen(false)} style={{position:"fixed",inset:0,zIndex:130,background:"rgba(15,23,42,.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:620,background:"white",borderRadius:"28px 28px 0 0",padding:"16px 16px calc(28px + env(safe-area-inset-bottom,0px))"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0}}>{editing?"Editar milestone":"Novo milestone"}</h2><button type="button" onClick={()=>setOpen(false)} style={{width:42,height:42,borderRadius:"50%",border:"1px solid var(--line)",background:"white",fontSize:24}}>×</button></div><div className="field" style={{marginTop:14}}><label>Nome</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Go-live"/></div><div className="field" style={{marginTop:10}}><label>Data</label><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>{msg&&<div className="error" style={{marginTop:10}}>{msg}</div>}<button className="btn btn-primary btn-block" type="button" disabled={busy} onClick={save} style={{marginTop:14}}>{busy?"Salvando...":"Salvar milestone"}</button></div></div>}
 </>;
}
