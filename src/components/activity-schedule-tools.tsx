"use client";

import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type ScheduleRow={activity_id:string;title:string;start_date:string;finish_date:string;duration_days:number;early_start:string;early_finish:string;late_start:string;late_finish:string;total_float_days:number;is_critical:boolean;predecessor_count:number;successor_count:number;owner_name:string;progress:number;status:string};
type Dependency={id:string;activity_id:string;depends_on_activity_id:string;dependency_type:"FS"|"SS"|"FF"|"SF";lag_days:number;note:string|null};
type ActivityOption={id:string;title:string};
type Candidate={activity_id:string;title:string;owner:string;duration_days:number;minimum_duration_days:number;theoretical_reduction_days:number;float_days:number;critical:boolean;workload_risk:boolean;max_daily_hours:number;max_weekly_hours:number;recommended_action:string};
type Optimization={project_start:string|null;project_finish:string|null;critical_count:number;near_critical_count:number;critical_path:{activity_id:string;title:string;early_start:string;early_finish:string;float_days:number;owner:string}[];candidates:Candidate[];note:string};

type Props={organizationId:string;projectId:string;projectName:string;currentActivityId:string;activities:ActivityOption[];dependencies:Dependency[];schedule:ScheduleRow[];optimization:Optimization|null};

type Modal="gantt"|"optimize"|"dependencies"|null;

const TYPES=[
 {key:"FS",label:"FS · Finish → Start",hint:"O sucessor começa após o predecessor terminar."},
 {key:"SS",label:"SS · Start → Start",hint:"O sucessor pode iniciar junto/após o início do predecessor."},
 {key:"FF",label:"FF · Finish → Finish",hint:"O término do sucessor depende do término do predecessor."},
 {key:"SF",label:"SF · Start → Finish",hint:"O término do sucessor depende do início do predecessor."},
] as const;

function d(v:string|null|undefined){return v?new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR"):"—"}
function diffDays(a:string,b:string){return Math.round((new Date(`${b}T12:00:00Z`).getTime()-new Date(`${a}T12:00:00Z`).getTime())/86400000)}
function plusDays(a:string,days:number){const x=new Date(`${a}T12:00:00Z`);x.setUTCDate(x.getUTCDate()+days);return x.toLocaleDateString("pt-BR")}

export function ActivityScheduleTools(p:Props){
 const {organizationId,projectId,projectName,currentActivityId,activities,dependencies,schedule,optimization}=p;
 const [modal,setModal]=useState<Modal>(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 const [relation,setRelation]=useState<"predecessor"|"successor">("predecessor"),[otherId,setOtherId]=useState(""),[depType,setDepType]=useState<"FS"|"SS"|"FF"|"SF">("FS"),[lag,setLag]=useState("0"),[note,setNote]=useState("");
 const [simActivity,setSimActivity]=useState(""),[simDays,setSimDays]=useState("1");
 const current=schedule.find(x=>x.activity_id===currentActivityId);
 const preds=dependencies.filter(x=>x.activity_id===currentActivityId),succs=dependencies.filter(x=>x.depends_on_activity_id===currentActivityId);
 const byId=useMemo(()=>new Map(activities.map(a=>[a.id,a.title])),[activities]);
 const candidates=optimization?.candidates||[];
 const simCandidate=candidates.find(x=>x.activity_id===simActivity);
 const requested=Math.max(0,Math.floor(Number(simDays||0)));
 const allowed=simCandidate?Math.min(requested,Math.max(0,simCandidate.theoretical_reduction_days)):0;
 const simulatedFinish=optimization?.project_finish&&simCandidate?.critical&&allowed>0?plusDays(optimization.project_finish,-allowed):null;

 async function addDependency(){
  if(!otherId)return setMsg("Selecione uma atividade.");
  setBusy(true);setMsg("");const s=createClient();
  const payload=relation==="predecessor"?{organization_id:organizationId,project_id:projectId,activity_id:currentActivityId,depends_on_activity_id:otherId,dependency_type:depType,lag_days:Number(lag||0),note:note.trim()||null}:{organization_id:organizationId,project_id:projectId,activity_id:otherId,depends_on_activity_id:currentActivityId,dependency_type:depType,lag_days:Number(lag||0),note:note.trim()||null};
  const {error}=await s.from("activity_dependencies").insert(payload);
  if(error){setMsg(error.message);setBusy(false);return}location.reload();
 }
 async function removeDependency(id:string){setBusy(true);const s=createClient();const {error}=await s.from("activity_dependencies").delete().eq("id",id);if(error){setMsg(error.message);setBusy(false);return}location.reload()}

 const minDate=schedule.length?schedule.reduce((m,x)=>x.early_start<m?x.early_start:m,schedule[0].early_start):null;
 const maxDate=schedule.length?schedule.reduce((m,x)=>x.early_finish>m?x.early_finish:m,schedule[0].early_finish):null;
 const span=minDate&&maxDate?Math.max(1,diffDays(minDate,maxDate)+1):1;

 return <>
  <section style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10,margin:"12px 0"}}>
   <button className="btn btn-outline" type="button" onClick={()=>setModal("gantt")} style={{minHeight:52}}>📊 Gantt do Projeto</button>
   <button className="btn btn-primary" type="button" onClick={()=>setModal("optimize")} style={{minHeight:52}}>⚡ Otimizar prazo</button>
  </section>
  <button type="button" onClick={()=>setModal("dependencies")} className="card" style={{width:"100%",textAlign:"left",border:"1px solid var(--line)",background:"white",marginTop:0,padding:14,cursor:"pointer"}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><div><div className="eyebrow">Dependências do cronograma</div><strong>{preds.length} predecessor{preds.length===1?"":"es"} · {succs.length} sucessor{succs.length===1?"":"es"}</strong></div><span className="chip">Configurar</span></div>
   {current&&<div className="muted" style={{fontSize:12,marginTop:6}}>{current.is_critical?"🔴 Atividade crítica · 0 dias de folga":`Folga total: ${current.total_float_days} dias`}</div>}
  </button>

  {modal&&<div role="dialog" aria-modal="true" onClick={()=>!busy&&setModal(null)} style={{position:"fixed",inset:0,zIndex:120,background:"rgba(15,23,42,.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:760,maxHeight:"94dvh",overflowY:"auto",background:"#f6f8fb",borderRadius:"28px 28px 0 0",padding:"12px 14px calc(28px + env(safe-area-inset-bottom,0px))",boxSizing:"border-box"}}>
   <div style={{width:44,height:5,borderRadius:999,background:"#cbd5e1",margin:"0 auto 14px"}}/>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:14}}><div><div className="eyebrow">{projectName}</div><h2 style={{margin:0}}>{modal==="gantt"?"Gantt do Projeto":modal==="optimize"?"Otimizar prazo":"Predecessores e sucessores"}</h2></div><button type="button" onClick={()=>setModal(null)} style={{width:42,height:42,borderRadius:"50%",border:"1px solid var(--line)",background:"white",fontSize:24}}>×</button></div>

   {modal==="gantt"&&<>
    {!schedule.length?<div className="card">Não há atividades com datas suficientes para gerar o Gantt.</div>:<section className="card" style={{overflow:"hidden"}}>
     <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}><span className="chip danger">Crítico</span><span className="chip">Não crítico</span><span className="muted" style={{fontSize:12}}>Período CPM: {d(minDate)} → {d(maxDate)}</span></div>
     <div style={{overflowX:"auto",paddingBottom:6}}><div style={{minWidth:620}}>{schedule.map(row=>{const left=minDate?Math.max(0,diffDays(minDate,row.early_start)/span*100):0;const width=Math.max(2,row.duration_days/span*100);const active=row.activity_id===currentActivityId;return <div key={row.activity_id} style={{display:"grid",gridTemplateColumns:"190px 1fr",gap:10,alignItems:"center",padding:"8px 0",borderTop:"1px solid var(--line)"}}><div style={{minWidth:0}}><div style={{fontWeight:800,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{active?"▶ ":""}{row.title}</div><div className="muted" style={{fontSize:11}}>{row.total_float_days} d folga · {Math.round(Number(row.progress||0))}%</div></div><div style={{height:34,position:"relative",background:"#eef2f7",borderRadius:8,overflow:"hidden"}}><div title={`${d(row.early_start)} → ${d(row.early_finish)}`} style={{position:"absolute",left:`${left}%`,width:`${width}%`,minWidth:8,top:6,bottom:6,borderRadius:6,background:row.is_critical?"#dc2626":"#2563eb",outline:active?"3px solid #0f172a":"none"}}/></div></div>})}</div></div>
    </section>}
    <div className="notice" style={{marginTop:10}}>O Gantt usa o forecast atual e as dependências configuradas. Vermelho = caminho crítico (folga total ≤ 0).</div>
   </>}

   {modal==="optimize"&&<>
    {!optimization?<div className="card">Não foi possível calcular o caminho crítico deste projeto.</div>:<>
     <section className="grid grid-2" style={{gap:10}}><div className="card" style={{marginTop:0,textAlign:"center"}}><div className="eyebrow">Fim atual</div><strong style={{fontSize:22}}>{d(optimization.project_finish)}</strong></div><div className="card" style={{marginTop:0,textAlign:"center"}}><div className="eyebrow">Atividades críticas</div><strong style={{fontSize:28}}>{optimization.critical_count}</strong></div></section>
     <section className="card" style={{marginTop:10}}><h3 style={{marginTop:0}}>Caminho crítico</h3>{!optimization.critical_path?.length?<div className="empty">Sem caminho crítico calculável.</div>:optimization.critical_path.map((x,i)=><div className="row" key={x.activity_id}><div className="row-main"><div className="row-title">{i+1}. {x.title}</div><div className="row-sub">{d(x.early_start)} → {d(x.early_finish)} · {x.owner}</div></div><span className="chip danger">0 d</span></div>)}</section>
     <section className="card"><h3 style={{marginTop:0}}>Onde agir primeiro</h3>{candidates.slice(0,8).map(c=><button type="button" key={c.activity_id} onClick={()=>{setSimActivity(c.activity_id);setSimDays(String(Math.max(1,Math.min(3,c.theoretical_reduction_days||1))))}} className="row" style={{width:"100%",border:0,background:"transparent",textAlign:"left",cursor:"pointer"}}><div className="row-main"><div className="row-title">{c.title}</div><div className="row-sub">{c.recommended_action} · potencial teórico {c.theoretical_reduction_days} d · {c.owner}</div></div><span className={`chip ${c.workload_risk?"warning":c.critical?"danger":""}`}>{c.critical?"Crítica":`${c.float_days} d`}</span></button>)}</section>
     {simCandidate&&<section className="card"><h3 style={{marginTop:0}}>Simular compressão</h3><div className="row"><div className="row-main"><div className="row-title">{simCandidate.title}</div><div className="row-sub">Duração {simCandidate.duration_days} d · mínimo teórico {simCandidate.minimum_duration_days} d</div></div></div><div className="field" style={{marginTop:10}}><label>Reduzir quantos dias?</label><input className="input" type="number" min="0" max={simCandidate.theoretical_reduction_days} value={simDays} onChange={e=>setSimDays(e.target.value)}/></div>{simulatedFinish?<div className="notice" style={{marginTop:10}}>Cenário heurístico: o fim poderia passar de <strong>{d(optimization.project_finish)}</strong> para aproximadamente <strong>{simulatedFinish}</strong>, se o caminho crítico não mudar e a capacidade for viável.</div>:<div className="notice" style={{marginTop:10}}>Esta atividade não reduz diretamente o fim atual ou não possui compressão disponível.</div>}{simCandidate.workload_risk&&<div className="error" style={{marginTop:10}}>Há risco de workload. Não comprimir antes de redistribuir capacidade.</div>}</section>}
     <div className="notice">Crashing e fast tracking aparecem como recomendações, não como alteração automática. O Nexus não muda baseline ou dependências sem decisão do usuário.</div>
    </>}
   </>}

   {modal==="dependencies"&&<>
    <section className="card"><h3 style={{marginTop:0}}>Relacionamentos atuais</h3><div className="eyebrow">Predecessores</div>{!preds.length?<div className="empty" style={{padding:"12px 0"}}>Nenhum predecessor.</div>:preds.map(x=><div className="row" key={x.id}><div className="row-main"><div className="row-title">{byId.get(x.depends_on_activity_id)||"Atividade"}</div><div className="row-sub">{x.dependency_type} · lag {x.lag_days} d{x.note?` · ${x.note}`:""}</div></div><button className="chip danger" disabled={busy} onClick={()=>removeDependency(x.id)}>Remover</button></div>)}<div className="eyebrow" style={{marginTop:14}}>Sucessores</div>{!succs.length?<div className="empty" style={{padding:"12px 0"}}>Nenhum sucessor.</div>:succs.map(x=><div className="row" key={x.id}><div className="row-main"><div className="row-title">{byId.get(x.activity_id)||"Atividade"}</div><div className="row-sub">{x.dependency_type} · lag {x.lag_days} d{x.note?` · ${x.note}`:""}</div></div><button className="chip danger" disabled={busy} onClick={()=>removeDependency(x.id)}>Remover</button></div>)}</section>
    <section className="card"><h3 style={{marginTop:0}}>Adicionar dependência</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><button type="button" className={`btn ${relation==="predecessor"?"btn-primary":"btn-outline"}`} onClick={()=>setRelation("predecessor")}>Predecessor</button><button type="button" className={`btn ${relation==="successor"?"btn-primary":"btn-outline"}`} onClick={()=>setRelation("successor")}>Sucessor</button></div><div className="field" style={{marginTop:12}}><label>Atividade</label><select className="select" value={otherId} onChange={e=>setOtherId(e.target.value)}><option value="">Selecione...</option>{activities.filter(a=>a.id!==currentActivityId).map(a=><option value={a.id} key={a.id}>{a.title}</option>)}</select></div><div className="field" style={{marginTop:10}}><label>Tipo de relação</label><select className="select" value={depType} onChange={e=>setDepType(e.target.value as any)}>{TYPES.map(t=><option value={t.key} key={t.key}>{t.label}</option>)}</select><div className="muted" style={{fontSize:11,marginTop:4}}>{TYPES.find(t=>t.key===depType)?.hint}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}><div className="field"><label>Lag / Lead (dias)</label><input className="input" type="number" min="-3650" max="3650" value={lag} onChange={e=>setLag(e.target.value)}/></div><div className="field"><label>Observação</label><input className="input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Opcional"/></div></div>{msg&&<div className="error" style={{marginTop:10}}>{msg}</div>}<button className="btn btn-primary btn-block" type="button" disabled={busy||!otherId} onClick={addDependency} style={{marginTop:12}}>{busy?"Salvando...":"Adicionar dependência"}</button></section>
    <div className="notice">O Nexus impede automaticamente dependência consigo mesma, dependência entre projetos diferentes e ciclos no cronograma.</div>
   </>}
  </div></div>}
 </>;
}
