"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type EntityType = "group" | "program" | "project" | "activity";
const config = {
  group: { table:"groups", title:"name", back:"/app/groups" },
  program: { table:"programs", title:"name", back:"/app/programs" },
  project: { table:"projects", title:"name", back:"/app/projects" },
  activity: { table:"activities", title:"title", back:"/app/activities" },
} as const;

export function EntityActions({type,id,initialTitle,initialDescription}:{type:EntityType;id:string;initialTitle:string;initialDescription:string}) {
  const r=useRouter(), c=config[type];
  const [editing,setEditing]=useState(false), [title,setTitle]=useState(initialTitle), [description,setDescription]=useState(initialDescription), [msg,setMsg]=useState(""), [busy,setBusy]=useState(false);

  async function save(){
    setBusy(true); setMsg("");
    const s=createClient();
    const payload:any={ [c.title]:title.trim(), description:description.trim()||null, updated_at:new Date().toISOString() };
    const {error}=await s.from(c.table).update(payload).eq("id",id);
    if(error){setMsg(error.message);setBusy(false);return}
    setEditing(false);setBusy(false);r.refresh();
  }

  async function archive(){
    if(!confirm(`Arquivar "${title}"? O histórico será preservado.`)) return;
    setBusy(true); setMsg(""); const s=createClient();
    const field=type==="activity"?"deleted_at":"archived_at";
    const {error}=await s.from(c.table).update({[field]:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",id);
    if(error){setMsg(error.message);setBusy(false);return}
    r.push(c.back);r.refresh();
  }

  async function remove(){
    if(!confirm(`Excluir "${title}"? O item será removido das visões do Nexus, mantendo o histórico técnico para segurança.`)) return;
    setBusy(true); setMsg(""); const s=createClient();
    const {error}=await s.from(c.table).update({deleted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",id);
    if(error){setMsg(error.message);setBusy(false);return}
    r.push(c.back);r.refresh();
  }

  if(editing) return <section className="card form">
    <h2>Editar</h2>
    <div className="field"><label>{type==="activity"?"Título":"Nome"}</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)}/></div>
    <div className="field"><label>Descrição</label><textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)}/></div>
    <button className="btn btn-primary btn-block" onClick={save} disabled={busy||!title.trim()}>Salvar alterações</button>
    <button className="btn btn-outline btn-block" onClick={()=>setEditing(false)}>Cancelar</button>
    {msg&&<div className="error">{msg}</div>}
  </section>;

  return <section className="card form">
    <h2>Ações</h2>
    <button className="btn btn-primary btn-block" onClick={()=>setEditing(true)}>✎ Editar</button>
    {type!=="activity"&&<button className="btn btn-outline btn-block" onClick={archive} disabled={busy}>Arquivar</button>}
    <button type="button" className="btn btn-block" onClick={remove} disabled={busy} style={{border:"1px solid #fecaca",background:"#fff1f2",color:"#b91c1c",fontWeight:800}}>Excluir</button>
    {msg&&<div className="error">{msg}</div>}
  </section>;
}