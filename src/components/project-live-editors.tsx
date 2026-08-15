"use client";

import {ReactNode,useState} from "react";
import {createClient} from "@/lib/supabase/client";

function Sheet({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
  return <div role="dialog" aria-modal="true" onClick={onClose} style={{position:"fixed",inset:0,zIndex:120,background:"rgba(15,23,42,.42)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:620,maxHeight:"92dvh",overflowY:"auto",background:"var(--background,#f8fafc)",borderRadius:"26px 26px 0 0",padding:"10px 16px calc(24px + env(safe-area-inset-bottom,0px))",boxShadow:"0 -18px 50px rgba(15,23,42,.18)"}}>
      <div style={{width:44,height:5,borderRadius:999,background:"#cbd5e1",margin:"2px auto 14px"}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:10}}><h2 style={{margin:0}}>{title}</h2><button type="button" onClick={onClose} aria-label="Fechar" style={{width:40,height:40,borderRadius:"50%",border:"1px solid var(--line)",background:"white",fontSize:24}}>×</button></div>
      {children}
    </div>
  </div>;
}

const riskStatusLabel=(v:string)=>v==="open"?"Open":v==="monitoring"?"Monitoring":v==="materialized"?"Materialized":v==="closed_not_occurred"?"Closed · did not occur":v==="closed_response_complete"?"Closed · response complete":v==="closed"?"Closed":v;
const riskStatusClass=(v:string)=>v==="materialized"?"danger":v.startsWith("closed")?"success":v==="monitoring"?"warning":"";

export function RiskListEditor({risks}:{risks:any[]}){
  const [edit,setEdit]=useState<any|null>(null); const [msg,setMsg]=useState("");
  async function save(e:React.FormEvent){e.preventDefault();if(!edit)return;setMsg("");const s=createClient();const closed=String(edit.status).startsWith("closed")||edit.status==="materialized";const {error}=await s.from("risks").update({title:edit.title.trim(),category:edit.category||null,probability:edit.probability,impact:edit.impact,status:edit.status,review_date:edit.review_date||null,mitigation:edit.mitigation||null,contingency:edit.contingency||null,closed_at:closed?(edit.closed_at||new Date().toISOString()):null,updated_at:new Date().toISOString()}).eq("id",edit.id);if(error)setMsg(error.message);else location.reload();}
  return <>
    <section className="card list">{!risks.length?<div className="empty">Nenhum risco.</div>:risks.map((r:any)=><button type="button" className="row" key={r.id} onClick={()=>setEdit({...r})} style={{width:"100%",border:0,background:"transparent",textAlign:"left",cursor:"pointer"}}><div className="row-main"><div className="row-title">{r.title}</div><div className="row-sub">{r.category||"Sem categoria"} · {r.probability}/{r.impact} · revisão {r.review_date?new Date(`${r.review_date}T12:00:00`).toLocaleDateString("pt-BR"):"—"}</div><div style={{marginTop:7}}><span className={`chip ${riskStatusClass(String(r.status||"open"))}`}>{riskStatusLabel(String(r.status||"open"))}</span></div></div><span className={`chip ${Number(r.score)>=15?"danger":Number(r.score)>=8?"warning":"success"}`}>{r.score??"—"}</span></button>)}</section>
    {edit&&<Sheet title="Atualizar risco" onClose={()=>setEdit(null)}><form className="card form" style={{margin:0}} onSubmit={save}>
      <div className="field"><label>Risco</label><input className="input" value={edit.title||""} onChange={e=>setEdit({...edit,title:e.target.value})} required/></div>
      <div className="field"><label>Status</label><select className="select" value={edit.status||"open"} onChange={e=>setEdit({...edit,status:e.target.value})}><option value="open">Open</option><option value="monitoring">Monitoring</option><option value="materialized">Materialized (ocorreu)</option><option value="closed_not_occurred">Closed · did not occur</option><option value="closed_response_complete">Closed · response complete</option></select><div className="muted" style={{fontSize:12,marginTop:6}}>Se o evento ocorreu, marque Materialized. Se a janela passou sem ocorrência, feche como “did not occur”.</div></div>
      <div className="grid grid-2"><div className="field"><label>Probabilidade</label><select className="select" value={edit.probability} onChange={e=>setEdit({...edit,probability:e.target.value})}>{["very_low","low","medium","high","very_high"].map(v=><option value={v} key={v}>{v.replace("_"," ")}</option>)}</select></div><div className="field"><label>Impacto</label><select className="select" value={edit.impact} onChange={e=>setEdit({...edit,impact:e.target.value})}>{["very_low","low","medium","high","very_high"].map(v=><option value={v} key={v}>{v.replace("_"," ")}</option>)}</select></div></div>
      <div className="field"><label>Categoria</label><input className="input" value={edit.category||""} onChange={e=>setEdit({...edit,category:e.target.value})}/></div>
      <div className="field"><label>Próxima revisão</label><input className="input" type="date" value={String(edit.review_date||"").slice(0,10)} onChange={e=>setEdit({...edit,review_date:e.target.value})}/></div>
      <div className="field"><label>Mitigação</label><textarea className="textarea" value={edit.mitigation||""} onChange={e=>setEdit({...edit,mitigation:e.target.value})}/></div>
      <div className="field"><label>Contingência</label><textarea className="textarea" value={edit.contingency||""} onChange={e=>setEdit({...edit,contingency:e.target.value})}/></div>
      <button className="btn btn-primary btn-block">Salvar risco</button>{msg&&<div className="error">{msg}</div>}
    </form></Sheet>}
  </>;
}

export function KpiListEditor({kpis}:{kpis:any[]}){
  const [edit,setEdit]=useState<any|null>(null); const [msg,setMsg]=useState("");
  async function save(e:React.FormEvent){e.preventDefault();if(!edit)return;setMsg("");const s=createClient();const {error}=await s.from("kpis").update({name:edit.name.trim(),unit:edit.unit||null,baseline:edit.baseline===""?null:Number(edit.baseline),target:edit.target===""?null:Number(edit.target),current_value:edit.current_value===""?null:Number(edit.current_value),frequency:edit.frequency,direction:edit.direction,trend:edit.trend||null,last_measured_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",edit.id);if(error)setMsg(error.message);else location.reload();}
  return <>
    <section className="card list">{!kpis.length?<div className="empty">Nenhum KPI.</div>:kpis.map((k:any)=><button type="button" className="row" key={k.id} onClick={()=>setEdit({...k})} style={{width:"100%",border:0,background:"transparent",textAlign:"left",cursor:"pointer"}}><div className="row-main"><div className="row-title">{k.name}</div><div className="row-sub">Atual {k.current_value??"—"} {k.unit||""} · Meta {k.target??"—"} · {k.frequency==="monthly"?"Mensal":k.frequency==="weekly"?"Semanal":k.frequency==="quarterly"?"Trimestral":"Anual"}</div></div><span className="chip">{k.trend||"—"}</span></button>)}</section>
    {edit&&<Sheet title="Atualizar KPI" onClose={()=>setEdit(null)}><form className="card form" style={{margin:0}} onSubmit={save}>
      <div className="field"><label>Indicador</label><input className="input" value={edit.name||""} onChange={e=>setEdit({...edit,name:e.target.value})} required/></div>
      <div className="field"><label>Unidade</label><input className="input" value={edit.unit||""} onChange={e=>setEdit({...edit,unit:e.target.value})}/></div>
      <div className="grid grid-2"><div className="field"><label>Baseline</label><input className="input" type="number" step="any" value={edit.baseline??""} onChange={e=>setEdit({...edit,baseline:e.target.value})}/></div><div className="field"><label>Meta</label><input className="input" type="number" step="any" value={edit.target??""} onChange={e=>setEdit({...edit,target:e.target.value})}/></div></div>
      <div className="field"><label>Valor atual</label><input className="input" type="number" step="any" value={edit.current_value??""} onChange={e=>setEdit({...edit,current_value:e.target.value})}/></div>
      <div className="grid grid-2"><div className="field"><label>Periodicidade</label><select className="select" value={edit.frequency||"monthly"} onChange={e=>setEdit({...edit,frequency:e.target.value})}><option value="weekly">Semanal</option><option value="monthly">Mensal</option><option value="quarterly">Trimestral</option><option value="yearly">Anual</option></select></div><div className="field"><label>Direção</label><select className="select" value={edit.direction||"higher_is_better"} onChange={e=>setEdit({...edit,direction:e.target.value})}><option value="higher_is_better">Maior é melhor</option><option value="lower_is_better">Menor é melhor</option></select></div></div>
      <div className="field"><label>Tendência</label><select className="select" value={edit.trend||""} onChange={e=>setEdit({...edit,trend:e.target.value})}><option value="">—</option><option value="up">↑ Subindo</option><option value="stable">→ Estável</option><option value="down">↓ Caindo</option></select></div>
      <button className="btn btn-primary btn-block">Salvar KPI</button>{msg&&<div className="error">{msg}</div>}
    </form></Sheet>}
  </>;
}

const statusLabel=(v:string)=>v==="on_track"?"On track":v==="attention"?"Attention":v==="off_track"?"Off tracking":v;
const statusClass=(v:string)=>v==="off_track"?"danger":v==="attention"?"warning":"success";
const statusTone=(v:string)=>v==="off_track"?{background:"#fff1f2",borderColor:"#fecdd3"}:v==="attention"?{background:"#fff7ed",borderColor:"#fed7aa"}:{background:"#ecfdf5",borderColor:"#a7f3d0"};

export function CheckpointListEditor({reports}:{reports:any[]}){
  const [edit,setEdit]=useState<any|null>(null); const [msg,setMsg]=useState("");
  async function save(e:React.FormEvent){e.preventDefault();if(!edit)return;setMsg("");const d=String(edit.period_end||edit.period_start||"").slice(0,10);const s=createClient();const {error}=await s.from("status_reports").update({period_start:d,period_end:d,overall_status:edit.overall_status,progress:edit.progress===""?null:Number(edit.progress),accomplishments:edit.accomplishments||null,next_steps:edit.next_steps||null,issues:edit.issues||null,decisions_needed:edit.decisions_needed||null,updated_at:new Date().toISOString()}).eq("id",edit.id);if(error)setMsg(error.message);else location.reload();}
  return <>
    <section className="form" style={{gap:10}}>{!reports.length?<div className="card empty">Nenhum checkpoint.</div>:reports.map((r:any)=>{const tone=statusTone(r.overall_status);return <button type="button" className="card" key={r.id} onClick={()=>setEdit({...r})} style={{width:"100%",marginTop:0,border:`1px solid ${tone.borderColor}`,background:tone.background,textAlign:"left",cursor:"pointer"}}><div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}><div className="row-main"><div className="eyebrow">Follow-up</div><div className="row-title">{new Date(`${String(r.period_end).slice(0,10)}T12:00:00`).toLocaleDateString("pt-BR")}</div></div><span className={`chip ${statusClass(r.overall_status)}`}>{statusLabel(r.overall_status)}</span></div>{r.progress!=null&&<div style={{marginTop:10}}><span className="eyebrow">Progresso</span> <strong>{Math.round(Number(r.progress))}%</strong></div>}{r.accomplishments&&<div className="row-sub" style={{marginTop:8}}>{r.accomplishments}</div>}{r.next_steps&&<div className="row-sub" style={{marginTop:5}}>Próximos passos: {r.next_steps}</div>}</button>})}</section>
    {edit&&<Sheet title="Atualizar checkpoint" onClose={()=>setEdit(null)}><form className="card form" style={{margin:0}} onSubmit={save}>
      <div className="field"><label>Data do follow-up</label><input className="input" type="date" value={String(edit.period_end||edit.period_start||"").slice(0,10)} onChange={e=>setEdit({...edit,period_end:e.target.value,period_start:e.target.value})} required/></div>
      <div className="grid grid-2"><div className="field"><label>Status</label><select className="select" value={edit.overall_status} onChange={e=>setEdit({...edit,overall_status:e.target.value})}><option value="on_track">On track</option><option value="attention">Attention</option><option value="off_track">Off tracking</option></select></div><div className="field"><label>Progresso %</label><input className="input" type="number" min="0" max="100" value={edit.progress??""} onChange={e=>setEdit({...edit,progress:e.target.value})}/></div></div>
      <div className="field"><label>Entregas / avanços</label><textarea className="textarea" value={edit.accomplishments||""} onChange={e=>setEdit({...edit,accomplishments:e.target.value})}/></div>
      <div className="field"><label>Próximos passos</label><textarea className="textarea" value={edit.next_steps||""} onChange={e=>setEdit({...edit,next_steps:e.target.value})}/></div>
      <div className="field"><label>Problemas / riscos</label><textarea className="textarea" value={edit.issues||""} onChange={e=>setEdit({...edit,issues:e.target.value})}/></div>
      <div className="field"><label>Decisões necessárias</label><textarea className="textarea" value={edit.decisions_needed||""} onChange={e=>setEdit({...edit,decisions_needed:e.target.value})}/></div>
      <button className="btn btn-primary btn-block">Salvar checkpoint</button>{msg&&<div className="error">{msg}</div>}
    </form></Sheet>}
  </>;
}

export function FinanceGridEditor({organizationId,projectId,budget,items,currency="BRL"}:{organizationId:string;projectId:string;budget:any;items:any[];currency?:string}){
  const [edit,setEdit]=useState<any|null>(null); const [msg,setMsg]=useState("");
  const fmt=(v:any)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency,maximumFractionDigits:0}).format(Number(v||0));
  const standards=[{label:"CAPEX Budget",key:"capex_budget"},{label:"OPEX Budget",key:"opex_budget"},{label:"Saving (Full Year)",key:"saving_full_year"},{label:"Saving (Dentro do ano)",key:"saving_in_year"}];
  async function save(e:React.FormEvent){e.preventDefault();if(!edit)return;setMsg("");const s=createClient();if(edit.kind==="standard"){const value=Number(edit.amount||0);if(!budget?.id){const payload:any={organization_id:organizationId,project_id:projectId,currency:"BRL",capex_budget:0,opex_budget:0,saving_full_year:0,saving_in_year:0,budget:0,saving:0,[edit.key]:value};if(edit.key==="capex_budget"||edit.key==="opex_budget")payload.budget=value;if(edit.key==="saving_full_year")payload.saving=value;const {error}=await s.from("budgets").insert(payload);if(error){setMsg(error.message);return;}}else{const patch:any={[edit.key]:value,updated_at:new Date().toISOString()};if(edit.key==="capex_budget")patch.budget=value+Number(budget.opex_budget||0);if(edit.key==="opex_budget")patch.budget=Number(budget.capex_budget||0)+value;if(edit.key==="saving_full_year")patch.saving=value;const {error}=await s.from("budgets").update(patch).eq("id",budget.id);if(error){setMsg(error.message);return;}}}else{const {error}=await s.from("project_financial_items").update({label:edit.label.trim(),amount:Number(edit.amount||0),notes:edit.notes||null,updated_at:new Date().toISOString()}).eq("id",edit.id);if(error){setMsg(error.message);return;}}location.reload();}
  return <>
    <section className="grid grid-2">
      {standards.map(x=><button type="button" className="card" key={x.key} onClick={()=>setEdit({kind:"standard",key:x.key,label:x.label,amount:budget?.[x.key]??0})} style={{marginTop:0,minWidth:0,border:"1px solid var(--line)",background:"white",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center",overflow:"hidden",cursor:"pointer"}}><div className="eyebrow" style={{overflowWrap:"anywhere"}}>{x.label}</div><div style={{fontWeight:900,fontSize:"clamp(16px,4.6vw,22px)",lineHeight:1.05,marginTop:8}}>{fmt(budget?.[x.key])}</div></button>)}
      {items.map((item:any)=><button type="button" className="card" key={item.id} onClick={()=>setEdit({kind:"custom",...item})} style={{marginTop:0,minWidth:0,border:"1px solid var(--line)",background:"white",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center",overflow:"hidden",cursor:"pointer"}}><div className="eyebrow" style={{overflowWrap:"anywhere"}}>{item.label}</div><div style={{fontWeight:900,fontSize:"clamp(16px,4.6vw,22px)",lineHeight:1.05,marginTop:8}}>{fmt(item.amount)}</div>{item.notes&&<div className="muted" style={{fontSize:11,marginTop:7}}>{item.notes}</div>}</button>)}
    </section>
    {edit&&<Sheet title={edit.kind==="standard"?`Atualizar ${edit.label}`:"Atualizar item financeiro"} onClose={()=>setEdit(null)}><form className="card form" style={{margin:0}} onSubmit={save}>
      {edit.kind==="custom"&&<div className="field"><label>Nome do item</label><input className="input" value={edit.label||""} onChange={e=>setEdit({...edit,label:e.target.value})} required/></div>}
      <div className="field"><label>Valor</label><input className="input" type="number" step="any" value={edit.amount??""} onChange={e=>setEdit({...edit,amount:e.target.value})} required/></div>
      {edit.kind==="custom"&&<div className="field"><label>Observação</label><textarea className="textarea" value={edit.notes||""} onChange={e=>setEdit({...edit,notes:e.target.value})}/></div>}
      <button className="btn btn-primary btn-block">Salvar alteração</button>{msg&&<div className="error">{msg}</div>}
    </form></Sheet>}
  </>;
}
