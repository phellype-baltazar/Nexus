"use client";

import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

function inclusiveDays(start:string,due:string){
  if(!start||!due)return 0;
  const a=new Date(`${start}T12:00:00Z`).getTime();
  const b=new Date(`${due}T12:00:00Z`).getTime();
  if(!Number.isFinite(a)||!Number.isFinite(b)||b<a)return 0;
  return Math.floor((b-a)/86400000)+1;
}

export function ActivityCreatorV2({organizationId,projectId,members}:{organizationId:string;projectId:string;members:any[]}){
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [start,setStart]=useState("");
  const [due,setDue]=useState("");
  const [owner,setOwner]=useState("");
  const [externalOwner,setExternalOwner]=useState("");
  const [priority,setPriority]=useState("medium");
  const [hours,setHours]=useState("");
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);

  const days=useMemo(()=>inclusiveDays(start,due),[start,due]);
  const maxHours=days*10;

  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg("");
    if(!start||!due){setMsg("Informe data de início e data prevista.");setBusy(false);return;}
    if(due<start){setMsg("A data prevista não pode ser anterior à data de início.");setBusy(false);return;}
    if(owner==="__external__"&&!externalOwner.trim()){setMsg("Informe o nome do responsável externo.");setBusy(false);return;}
    const hoursValue=hours?Number(hours):0;
    if(!Number.isFinite(hoursValue)||hoursValue<0){setMsg("Informe uma quantidade válida de horas.");setBusy(false);return;}
    if(hoursValue>maxHours){setMsg(`Máximo permitido para este período: ${maxHours} h (${days} dias × 10 h/dia).`);setBusy(false);return;}

    const s=createClient();
    const {error}=await s.from("activities").insert({
      organization_id:organizationId,
      project_id:projectId,
      title:title.trim(),
      description:description.trim()||null,
      start_date:start,
      due_date:due,
      primary_owner_id:owner&&owner!=="__external__"?owner:null,
      external_owner_name:owner==="__external__"?externalOwner.trim():null,
      priority,
      status:"todo",
      estimated_hours:hours?hoursValue:null,
    });
    if(error){setMsg(error.message);setBusy(false);return;}
    location.reload();
  }

  return <form className="card form" onSubmit={submit}>
    <h2>Nova atividade</h2>
    <div className="field"><label>Título</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)} required/></div>
    <div className="field"><label>Descrição</label><textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)}/></div>
    <div className="grid grid-2">
      <div className="field"><label>Início</label><input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} required/></div>
      <div className="field"><label>Data prevista</label><input className="input" type="date" value={due} min={start||undefined} onChange={e=>setDue(e.target.value)} required/></div>
    </div>
    <div className="field"><label>Responsável</label><select className="select" value={owner} onChange={e=>setOwner(e.target.value)}><option value="">Sem responsável</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.full_name||m.email||"Usuário"}</option>)}<option value="__external__">Outro / responsável externo</option></select></div>
    {owner==="__external__"&&<div className="field"><label>Nome do responsável externo</label><input className="input" value={externalOwner} onChange={e=>setExternalOwner(e.target.value)} placeholder="Digite o nome" maxLength={160}/></div>}
    <div className="grid grid-2">
      <div className="field"><label>Prioridade</label><select className="select" value={priority} onChange={e=>setPriority(e.target.value)}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="critical">Crítica</option></select></div>
      <div className="field"><label>Horas previstas</label><input className="input" type="number" min="0" max={maxHours||undefined} step="0.5" value={hours} onChange={e=>setHours(e.target.value)}/>{days>0&&<div className="muted" style={{fontSize:11,marginTop:5}}>Máximo: {maxHours} h · {days} dias corridos × 10 h/dia.</div>}</div>
    </div>
    <div className="notice">A soma da carga planejada do responsável também é limitada a 10 h por dia. O Nexus bloqueia excesso diário e sinaliza risco quando o planejamento ultrapassa 44 h na semana ou gera 7 dias consecutivos de trabalho.</div>
    <button className="btn btn-primary btn-block" disabled={busy}>{busy?"Salvando...":"Adicionar atividade"}</button>
    {msg&&<div className="error">{msg}</div>}
  </form>;
}
