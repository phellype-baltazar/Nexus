"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

export function PrioritizationManager({organizationId,projects}:{organizationId:string;projects:any[]}) {
  const [project,setProject]=useState(""),[alignment,setAlignment]=useState("50"),[value,setValue]=useState("50"),[urgency,setUrgency]=useState("50"),[risk,setRisk]=useState("50"),[effort,setEffort]=useState("50"),[compliance,setCompliance]=useState("50"),[capacity,setCapacity]=useState("50"),[msg,setMsg]=useState("");
  async function submit(e:React.FormEvent){e.preventDefault();const s=createClient();const row={organization_id:organizationId,project_id:project,strategic_alignment:Number(alignment),expected_value:Number(value),urgency:Number(urgency),risk:Number(risk),effort:Number(effort),compliance:Number(compliance),capacity_fit:Number(capacity),updated_at:new Date().toISOString()};const{error}=await s.from("portfolio_scores").upsert(row,{onConflict:"project_id"});if(error)setMsg(error.message);else location.reload()}
  const f=(label:string,v:string,set:(v:string)=>void)=><div className="field"><label>{label}</label><input className="input" type="number" min="0" max="100" value={v} onChange={e=>set(e.target.value)}/></div>;
  return <form className="card form" onSubmit={submit}><h2>Pontuar projeto</h2><div className="field"><label>Projeto</label><select className="select" value={project} onChange={e=>setProject(e.target.value)} required><option value="">Selecionar</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="grid grid-2">{f("Alinhamento",alignment,setAlignment)}{f("Valor esperado",value,setValue)}{f("Urgência",urgency,setUrgency)}{f("Risco",risk,setRisk)}{f("Esforço",effort,setEffort)}{f("Compliance",compliance,setCompliance)}{f("Fit de capacidade",capacity,setCapacity)}</div><button className="btn btn-primary btn-block">Calcular prioridade</button>{msg&&<div className="error">{msg}</div>}</form>
}
