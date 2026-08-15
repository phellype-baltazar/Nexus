"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {FloatingCreate} from "@/components/floating-create";

export function StatusCheckpointCreator({organizationId,projectId,userId}:{organizationId:string;projectId:string;userId:string}){
  const [followUpDate,setFollowUpDate]=useState("");
  const [status,setStatus]=useState("on_track");
  const [progress,setProgress]=useState("");
  const [done,setDone]=useState("");
  const [next,setNext]=useState("");
  const [issues,setIssues]=useState("");
  const [decisions,setDecisions]=useState("");
  const [msg,setMsg]=useState("");

  async function submit(e:React.FormEvent){
    e.preventDefault();
    const s=createClient();
    const {error}=await s.from("status_reports").insert({
      organization_id:organizationId,
      project_id:projectId,
      period_start:followUpDate,
      period_end:followUpDate,
      overall_status:status,
      progress:progress?Number(progress):null,
      accomplishments:done||null,
      next_steps:next||null,
      issues:issues||null,
      decisions_needed:decisions||null,
      submitted_by:userId||null,
      submitted_at:new Date().toISOString()
    });
    if(error)setMsg(error.message);else location.reload();
  }

  return <FloatingCreate title="Novo checkpoint">
    <form className="card form" style={{margin:0}} onSubmit={submit}>
      <div className="field"><label>Data do follow-up</label><input className="input" type="date" value={followUpDate} onChange={e=>setFollowUpDate(e.target.value)} required/></div>
      <div className="grid grid-2">
        <div className="field"><label>Status</label><select className="select" value={status} onChange={e=>setStatus(e.target.value)}><option value="on_track">On track</option><option value="attention">Attention</option><option value="off_track">Off tracking</option></select></div>
        <div className="field"><label>Progresso %</label><input className="input" type="number" min="0" max="100" value={progress} onChange={e=>setProgress(e.target.value)}/></div>
      </div>
      <div className="field"><label>Entregas / avanços</label><textarea className="textarea" value={done} onChange={e=>setDone(e.target.value)}/></div>
      <div className="field"><label>Próximos passos</label><textarea className="textarea" value={next} onChange={e=>setNext(e.target.value)}/></div>
      <div className="field"><label>Problemas / riscos</label><textarea className="textarea" value={issues} onChange={e=>setIssues(e.target.value)}/></div>
      <div className="field"><label>Decisões necessárias</label><textarea className="textarea" value={decisions} onChange={e=>setDecisions(e.target.value)}/></div>
      <button className="btn btn-primary btn-block">Salvar checkpoint</button>
      {msg&&<div className="error">{msg}</div>}
    </form>
  </FloatingCreate>;
}
