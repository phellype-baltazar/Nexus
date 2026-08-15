"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

export function ActivityCreatorV2({organizationId,projectId,members}:{organizationId:string;projectId:string;members:any[]}){
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [start,setStart]=useState("");
  const [due,setDue]=useState("");
  const [owner,setOwner]=useState("");
  const [priority,setPriority]=useState("medium");
  const [hours,setHours]=useState("");
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg("");
    const s=createClient();
    const {error}=await s.from("activities").insert({
      organization_id:organizationId,
      project_id:projectId,
      title:title.trim(),
      description:description.trim()||null,
      start_date:start||null,
      due_date:due||null,
      primary_owner_id:owner||null,
      priority,
      status:"todo",
      estimated_hours:hours?Number(hours):null,
    });
    if(error){setMsg(error.message);setBusy(false);return;}
    location.reload();
  }

  return <form className="card form" onSubmit={submit}>
    <h2>Nova atividade</h2>
    <div className="field"><label>Título</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)} required/></div>
    <div className="field"><label>Descrição</label><textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)}/></div>
    <div className="grid grid-2">
      <div className="field"><label>Início</label><input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)}/></div>
      <div className="field"><label>Data prevista</label><input className="input" type="date" value={due} onChange={e=>setDue(e.target.value)} required/></div>
    </div>
    <div className="field"><label>Responsável</label><select className="select" value={owner} onChange={e=>setOwner(e.target.value)}><option value="">Sem responsável</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.full_name||m.email||"Usuário"}</option>)}</select></div>
    <div className="grid grid-2">
      <div className="field"><label>Prioridade</label><select className="select" value={priority} onChange={e=>setPriority(e.target.value)}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="critical">Crítica</option></select></div>
      <div className="field"><label>Horas estimadas</label><input className="input" type="number" min="0" value={hours} onChange={e=>setHours(e.target.value)}/></div>
    </div>
    <div className="notice">O status é automático: dentro do prazo = Em andamento; fora do prazo = Atrasada. Depois você pode marcar como Feita ou Cancelada.</div>
    <button className="btn btn-primary btn-block" disabled={busy}>{busy?"Salvando...":"Adicionar atividade"}</button>
    {msg&&<div className="error">{msg}</div>}
  </form>;
}
