"use client";

import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

export type ActivityMember={user_id:string;full_name:string|null};
export type ActivityComment={id:string;body:string;created_at:string;author_name:string};
export type WorkloadPoint={work_date:string;planned_hours:number;relative_weight:number};
type EffortProfile="flat"|"front_loaded"|"back_loaded"|"bell"|"double_peak"|"shifted_peak";
type Editor="progress"|"status"|"owner"|"hours"|"forecast"|null;

type Props={id:string;organizationId:string;userId:string;progress:number;status:string;startDate:string|null;dueDate:string|null;forecastDueDate:string|null;completedAt:string|null;estimatedHours:number|null;baselineEstimatedHours:number|null;effortProfile:EffortProfile;shiftedPeakTiming:"early"|"late"|null;ownerId:string|null;externalOwnerName:string|null;ownerName:string;members:ActivityMember[];comments:ActivityComment[];legacyDescription:string|null;workloadCurve:WorkloadPoint[];riskMessages?:string[]};

const PROFILES=[
 {key:"flat",label:"Flat",short:"Constante",path:"M3 13 L29 13",hint:"Esforço uniforme durante todo o período."},
 {key:"front_loaded",label:"Front-Loaded",short:"Início",path:"M3 4 C10 5 17 10 29 17",hint:"Maior esforço no início, reduzindo até o fim."},
 {key:"back_loaded",label:"Back-Loaded",short:"Final",path:"M3 17 C15 16 22 8 29 4",hint:"Começa leve e concentra esforço no final."},
 {key:"bell",label:"Bell-Shaped",short:"Sino",path:"M3 17 C9 17 10 5 16 4 C22 5 23 17 29 17",hint:"Esforço cresce até o meio e depois diminui."},
 {key:"double_peak",label:"Double Peak",short:"Duplo pico",path:"M3 16 C7 4 11 4 14 15 C17 18 20 4 24 4 C27 6 28 12 29 16",hint:"Picos no início e no final, com vale no meio."},
 {key:"shifted_peak",label:"Early / Late",short:"Pico deslocado",path:"M3 17 C7 16 8 6 12 4 C18 7 22 14 29 17",hint:"Pico deslocado para o início ou para o final."}
] as const;

const today=()=>new Date().toISOString().slice(0,10);
const dateOnly=(v:string|null)=>{if(!v)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString().slice(0,10)};
const dateBR=(v:string|null)=>v?new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR"):"—";
const maxDate=(a:string|null,b:string|null)=>!a?b:!b?a:a>b?a:b;
const inclusiveDays=(a:string|null,b:string|null)=>{if(!a||!b||b<a)return 0;return Math.floor((new Date(`${b}T12:00:00Z`).getTime()-new Date(`${a}T12:00:00Z`).getTime())/86400000)+1};
const fmtHours=(v:number|null|undefined)=>`${Number(v||0).toLocaleString("pt-BR",{maximumFractionDigits:1})} h`;
function weights(n:number,p:EffortProfile,t:"early"|"late"="early"){return Array.from({length:n},(_,i)=>{const x=(i+.5)/Math.max(n,1);if(p==="flat")return 1;if(p==="front_loaded")return Math.max(n-i,.1);if(p==="back_loaded")return Math.max(i+1,.1);if(p==="bell")return Math.max(Math.sin(Math.PI*x),.05);if(p==="double_peak")return Math.max(Math.exp(-Math.pow((x-.18)/.16,2))+Math.exp(-Math.pow((x-.82)/.16,2)),.05);return Math.max(Math.exp(-Math.pow((x-(t==="late"?.72:.28))/.22,2)),.05)})}
function profileMaxHours(n:number,p:EffortProfile,t:"early"|"late"="early"){if(n<=0)return 0;const w=weights(n,p,t),sum=w.reduce((a,b)=>a+b,0),mx=Math.max(...w);return Math.floor((10*sum/mx)*2)/2}
function visualStatus(status:string,due:string|null,completed:string|null){const d=dateOnly(due),c=dateOnly(completed),t=today();if(status==="cancelled")return {label:"Cancelada",bg:"#eef1f5",color:"#5d6675",border:"#d9dee7"};if(status==="done"){if(!d||!c)return {label:"Feita",bg:"#e8f7ef",color:"#0b7a46",border:"#bfe8d1"};if(c<d)return {label:"Feita antes do prazo",bg:"#e8f7ef",color:"#0b7a46",border:"#bfe8d1"};if(c===d)return {label:"Feita no prazo",bg:"#e8f7ef",color:"#0b7a46",border:"#bfe8d1"};return {label:"Feita fora do prazo",bg:"#fdecef",color:"#b42318",border:"#f3c6ce"}}if(d&&d<t)return {label:"Atrasada",bg:"#fdecef",color:"#b42318",border:"#f3c6ce"};return {label:"Em andamento",bg:"#fff4dd",color:"#9a5b00",border:"#f1ddb0"}}
const card=()=>({minHeight:122,height:122,minWidth:0,marginTop:0,padding:"16px 12px",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",gap:9,boxSizing:"border-box" as const,overflow:"hidden",textAlign:"center" as const,width:"100%"});
const size=(s:string)=>/^\d{2}\/\d{2}\/\d{4}$/.test(s)?19:s.length>25?15:s.length>18?17:s.length>12?19:29;
function Curve({path}:{path:string}){return <svg viewBox="0 0 32 22" width="46" height="31"><path d="M2 19 H30" fill="none" stroke="currentColor" strokeWidth="1" opacity=".28"/><path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>}

export function ActivityInteractiveDashboard(p:Props){
 const {id,organizationId,userId,progress,status,startDate,dueDate,forecastDueDate,completedAt,estimatedHours,baselineEstimatedHours,effortProfile,shiftedPeakTiming,ownerId,externalOwnerName,ownerName,members,comments,legacyDescription,workloadCurve,riskMessages=[]}=p;
 const cutoff=today(),terminal=status==="done"||status==="cancelled",revisionStart=maxDate(startDate,cutoff),forecastEnd=forecastDueDate||dueDate,timing=shiftedPeakTiming||"early";
 const [editor,setEditor]=useState<Editor>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[comment,setComment]=useState("");
 const [progressValue,setProgressValue]=useState(String(Math.round(progress||0))),[reopenProgress,setReopenProgress]=useState("99"),[hoursValue,setHoursValue]=useState(estimatedHours==null?"":String(estimatedHours)),[forecastValue,setForecastValue]=useState(forecastEnd||"");
 const [ownerValue,setOwnerValue]=useState(externalOwnerName?"__external__":ownerId||""),[externalOwner,setExternalOwner]=useState(externalOwnerName||"");
 const [proposal,setProposal]=useState<{profile:EffortProfile;timing:"early"|"late";max:number}|null>(null);
 const visual=useMemo(()=>visualStatus(status,dueDate,completedAt),[status,dueDate,completedAt]);
 const pastPlanned=useMemo(()=>workloadCurve.filter(x=>revisionStart&&x.work_date<revisionStart).reduce((s,x)=>s+Number(x.planned_hours||0),0),[workloadCurve,revisionStart]);
 const futurePlanned=useMemo(()=>terminal?0:workloadCurve.filter(x=>x.work_date>=cutoff).reduce((s,x)=>s+Number(x.planned_hours||0),0),[workloadCurve,terminal,cutoff]);
 const considered=useMemo(()=>workloadCurve.reduce((s,x)=>s+Number(x.planned_hours||0),0),[workloadCurve]);
 const remainingByProgress=terminal?0:Number(estimatedHours||0)*(1-Math.max(0,Math.min(100,Number(progress||0)))/100);
 const futureDays=inclusiveDays(revisionStart,forecastEnd),currentMax=pastPlanned+profileMaxHours(futureDays,effortProfile,timing);
 const pastMaxBar=Math.max(0,...workloadCurve.filter(x=>x.work_date<cutoff).map(x=>Number(x.planned_hours||0)));
 const futureMaxBar=Math.max(0,...workloadCurve.filter(x=>x.work_date>=cutoff).map(x=>Number(x.planned_hours||0)));
 const profile=PROFILES.find(x=>x.key===effortProfile)||PROFILES[3];

 async function update(payload:Record<string,unknown>){setBusy(true);setMessage("");const s=createClient(),{error}=await s.from("activities").update(payload).eq("id",id);if(error){setMessage(error.message);setBusy(false);return}location.reload()}
 async function saveProgress(){const v=Math.max(0,Math.min(100,Number(progressValue||0)));await update(v>=100?{progress:100,status:"done"}:{progress:v,...(terminal?{status:"in_progress"}:{})})}
 async function saveStatus(v:"done"|"cancelled"){await update({status:v,progress:100})}
 async function reopen(){await update({status:"in_progress",progress:Math.max(0,Math.min(99,Number(reopenProgress||0)))})}
 async function saveHours(){const v=Number(hoursValue);if(!Number.isFinite(v)||v<0)return setMessage("Informe uma quantidade válida de horas.");if(v+0.001<pastPlanned)return setMessage(`O forecast não pode ficar abaixo das ${fmtHours(pastPlanned)} já preservadas.`);if(futureDays&&v>currentMax+.001)return setMessage(`Com a curva atual, o forecast máximo é ${fmtHours(currentMax)}.`);await update({estimated_hours:v})}
 async function saveForecast(){if(!forecastValue)return setMessage("Informe a previsão atual de conclusão.");if(startDate&&forecastValue<startDate)return setMessage("A previsão atual não pode ser anterior à data de início.");await update({forecast_due_date:forecastValue})}
 async function chooseProfile(profile:EffortProfile,newTiming:"early"|"late"=timing){const max=pastPlanned+profileMaxHours(futureDays,profile,newTiming);if(!terminal&&futureDays&&Number(estimatedHours||0)>max+.001)return setProposal({profile,timing:newTiming,max});await update({effort_profile:profile,shifted_peak_timing:profile==="shifted_peak"?newTiming:null})}
 async function applyProposal(){if(proposal)await update({estimated_hours:proposal.max,effort_profile:proposal.profile,shifted_peak_timing:proposal.profile==="shifted_peak"?proposal.timing:null})}
 async function saveOwner(){if(ownerValue==="__external__"){if(!externalOwner.trim())return setMessage("Informe o nome do responsável externo.");await update({primary_owner_id:null,external_owner_name:externalOwner.trim()})}else await update({primary_owner_id:ownerValue||null,external_owner_name:null})}
 async function addComment(e:React.FormEvent){e.preventDefault();if(!comment.trim())return;setBusy(true);const s=createClient(),{error}=await s.from("comments").insert({organization_id:organizationId,author_user_id:userId,entity_type:"activity",entity_id:id,body:comment.trim()});if(error){setMessage(error.message);setBusy(false);return}location.reload()}

 const pText=`${Math.round(progress||0)}%`,hText=estimatedHours==null?"—":fmtHours(estimatedHours);
 return <>
  <section style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginTop:14,width:"100%"}}>
   <button className="card" onClick={()=>{setProgressValue(String(Math.round(progress||0)));setEditor("progress")}} style={{...card(),border:"1px solid var(--line)",background:"white"}}><div className="eyebrow">Progresso</div><strong style={{fontSize:size(pText)}}>{pText}</strong></button>
   <button className="card" onClick={()=>setEditor("status")} style={{...card(),border:`1px solid ${visual.border}`,background:visual.bg,color:visual.color}}><div className="eyebrow" style={{color:visual.color}}>Status</div><strong style={{fontSize:size(visual.label),lineHeight:1.08}}>{visual.label}</strong></button>
   <div className="card" style={{...card(),border:"1px solid var(--line)"}}><div className="eyebrow">Data de início</div><strong style={{fontSize:19,whiteSpace:"nowrap"}}>{dateBR(startDate)}</strong><span className="muted" style={{fontSize:10}}>Baseline</span></div>
   <div className="card" style={{...card(),border:"1px solid var(--line)"}}><div className="eyebrow">Data prevista</div><strong style={{fontSize:19,whiteSpace:"nowrap"}}>{dateBR(dueDate)}</strong><span className="muted" style={{fontSize:10}}>Baseline imutável</span></div>
   <button className="card" onClick={()=>setEditor("owner")} style={{...card(),border:"1px solid var(--line)",background:"white"}}><div className="eyebrow">Responsável</div><strong style={{fontSize:size(ownerName),lineHeight:1.08,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{ownerName}</strong></button>
   <button className="card" onClick={()=>{setHoursValue(estimatedHours==null?"":String(estimatedHours));setEditor("hours")}} style={{...card(),border:"1px solid var(--line)",background:"white"}}><div className="eyebrow">Horas forecast</div><strong style={{fontSize:size(hText)}}>{hText}</strong><span className="muted" style={{fontSize:10}}>Baseline {fmtHours(baselineEstimatedHours)}</span></button>
  </section>

  <section className="card" style={{marginTop:12}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"}}><div><h2 style={{marginBottom:4}}>Workload da atividade</h2><p className="muted" style={{marginTop:0,fontSize:13}}>Baseline preservado; revisões afetam somente o futuro.</p></div>{!terminal&&<button className="chip" onClick={()=>{setForecastValue(forecastEnd||"");setEditor("forecast")}}>Previsão {dateBR(forecastEnd)}</button>}</div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8,marginTop:12}}>{[["Baseline",baselineEstimatedHours],["Forecast",estimatedHours],["Carga futura",futurePlanned]].map(([l,v])=><div key={String(l)} style={{padding:10,border:"1px solid var(--line)",borderRadius:14,textAlign:"center"}}><div className="eyebrow">{l}</div><strong>{fmtHours(Number(v||0))}</strong></div>)}</div>
   {!terminal&&<div className="notice" style={{marginTop:10}}>Avanço de <strong>{Math.round(progress||0)}%</strong> → trabalho restante teórico <strong>{fmtHours(remainingByProgress)}</strong>. A curva distribui exatamente esse saldo até a previsão.</div>}
   {terminal&&<div className="notice" style={{marginTop:10}}>Workload considerado até o encerramento: <strong>{fmtHours(considered)}</strong>. O restante futuro foi retirado da capacidade.</div>}
   {riskMessages.length>0&&<div className="error" style={{marginTop:10}}><strong>Risco de workload — corrigir</strong>{riskMessages.map((m,i)=><div key={i} style={{marginTop:4}}>• {m}</div>)}</div>}
  </section>

  <section className="card" style={{marginTop:12}}><h2 style={{marginBottom:4}}>Distribuição do esforço</h2><p className="muted" style={{marginTop:0,fontSize:13}}>O passado fica congelado. A curva selecionada distribui somente a carga futura restante.</p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8,marginTop:12}}>{PROFILES.map(x=>{const active=effortProfile===x.key;return <button key={x.key} disabled={busy||terminal} onClick={()=>chooseProfile(x.key)} style={{minHeight:88,borderRadius:16,border:`1px solid ${active?"var(--primary)":"var(--line)"}`,background:active?"#edf4ff":"white",color:active?"var(--primary)":"var(--text)",padding:7,fontWeight:800,opacity:terminal?.6:1}}><Curve path={x.path}/><div style={{fontSize:11}}>{x.short}</div></button>})}</div>
   {effortProfile==="shifted_peak"&&!terminal&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}><button className={`btn ${timing==="early"?"btn-primary":"btn-outline"}`} onClick={()=>chooseProfile("shifted_peak","early")}>Pico Early</button><button className={`btn ${timing==="late"?"btn-primary":"btn-outline"}`} onClick={()=>chooseProfile("shifted_peak","late")}>Pico Late</button></div>}
   <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid var(--line)"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:10}}><div><strong>{profile.label}</strong><div className="muted" style={{fontSize:11}}>{profile.hint} Aplicada ao forecast futuro.</div></div><div style={{textAlign:"right"}}><strong>{fmtHours(futurePlanned)}</strong><div className="muted" style={{fontSize:10}}>carga futura</div></div></div>
    {workloadCurve.length?<>
      <div style={{display:"flex",justifyContent:"space-between",gap:10,marginTop:12,fontSize:11,fontWeight:800}}><span style={{color:"#64748b"}}>■ Histórico congelado</span><span style={{color:"var(--primary)"}}>■ Forecast futuro</span></div>
      <div style={{height:96,display:"flex",alignItems:"flex-end",gap:2,marginTop:6,borderBottom:"1px solid var(--line)",overflow:"hidden"}}>{workloadCurve.map((x,i)=>{const historical=x.work_date<cutoff;const firstFuture=!historical&&(i===0||workloadCurve[i-1].work_date<cutoff);const segmentMax=historical?pastMaxBar:futureMaxBar;return <div key={`${x.work_date}-${i}`} title={`${dateBR(x.work_date)} · ${fmtHours(x.planned_hours)}${historical?" · histórico":" · forecast"}`} style={{flex:1,minWidth:2,maxWidth:18,height:`${Math.max(5,segmentMax?Math.round(x.planned_hours/segmentMax*82):5)}px`,background:historical?"#94a3b8":x.planned_hours>10?"#b42318":"var(--primary)",borderRadius:"3px 3px 0 0",opacity:historical?.55:.9,borderLeft:firstFuture?"3px solid #f59e0b":undefined,marginLeft:firstFuture?2:0}}/>})}</div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:10}}><span className="muted">Passado</span><strong style={{color:"#b45309"}}>Hoje · {dateBR(cutoff)}</strong><span className="muted">Previsão</span></div>
    </>:<div className="notice" style={{marginTop:10}}>Sem carga calculada para o período atual.</div>}
   </div>
  </section>

  <section className="card" style={{marginTop:12}}><h2>Comentários</h2>{legacyDescription&&<div style={{padding:"10px 0"}}><div className="muted" style={{fontSize:12,fontWeight:800}}>Descrição original</div><div>{legacyDescription}</div></div>}{!comments.length&&!legacyDescription&&<p className="muted">Nenhum comentário ainda.</p>}{comments.map(c=><div key={c.id} style={{padding:"12px 0",borderTop:"1px solid var(--line)"}}><strong style={{fontSize:13}}>{c.author_name}</strong><div className="muted" style={{fontSize:11}}>{new Date(c.created_at).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}</div><div style={{marginTop:6,whiteSpace:"pre-wrap"}}>{c.body}</div></div>)}<form onSubmit={addComment} style={{marginTop:12}}><textarea className="textarea" value={comment} onChange={e=>setComment(e.target.value)} placeholder="Adicionar comentário..." rows={3}/><button className="btn btn-primary btn-block" disabled={busy||!comment.trim()} style={{marginTop:8}}>Comentar</button></form>{message&&<div className="error" style={{marginTop:8}}>{message}</div>}</section>

  {proposal&&<div role="dialog" style={{position:"fixed",inset:0,zIndex:130,background:"rgba(15,23,42,.4)",display:"flex",alignItems:"flex-end",padding:18}}><div className="card" style={{width:"100%",maxWidth:520,margin:"0 auto",padding:20,borderRadius:24}}><h2>Ajustar forecast?</h2><p>A nova curva ultrapassaria 10 h/dia no período futuro.</p><div className="notice">Preservando o histórico, o forecast máximo é <strong>{fmtHours(proposal.max)}</strong>.</div><button className="btn btn-primary btn-block" onClick={applyProposal} style={{marginTop:12}}>Ajustar e aplicar</button><button className="btn btn-outline btn-block" onClick={()=>setProposal(null)} style={{marginTop:10}}>Manter atual</button></div></div>}

  {editor&&<div role="dialog" onClick={()=>!busy&&setEditor(null)} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(15,23,42,.35)",display:"flex",alignItems:"flex-end",padding:18}}><div className="card" onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,margin:"0 auto",padding:20,borderRadius:24}}>
   {editor==="progress"&&<><h2>Atualizar progresso</h2><input className="input" type="number" min="0" max="100" value={progressValue} onChange={e=>setProgressValue(e.target.value)}/><p className="muted" style={{fontSize:12}}>{terminal?"Abaixo de 100% reabre a ação.":"Em 100%, a ação vira Feita."}</p><button className="btn btn-primary btn-block" onClick={saveProgress}>Salvar</button></>}
   {editor==="status"&&<><h2>Atualizar status</h2>{status!=="done"&&<button className="btn btn-primary btn-block" onClick={()=>saveStatus("done")}>Marcar como feita</button>}{status!=="cancelled"&&<button className="btn btn-outline btn-block" onClick={()=>saveStatus("cancelled")} style={{marginTop:10}}>Cancelar ação</button>}{terminal&&<><div className="field" style={{marginTop:14}}><label>Progresso ao reabrir (%)</label><input className="input" type="number" min="0" max="99" value={reopenProgress} onChange={e=>setReopenProgress(e.target.value)}/></div><button className="btn btn-secondary btn-block" onClick={reopen}>Reabrir ação</button></>}</>}
   {editor==="hours"&&<><h2>Revisar horas forecast</h2><input className="input" type="number" min={Math.ceil(pastPlanned*2)/2} max={currentMax||undefined} step="0.5" value={hoursValue} onChange={e=>setHoursValue(e.target.value)}/><p className="muted" style={{fontSize:12}}>Histórico preservado: {fmtHours(pastPlanned)}. Máximo total com a curva atual: {fmtHours(currentMax)}.</p><button className="btn btn-primary btn-block" disabled={terminal} onClick={saveHours}>Salvar forecast</button></>}
   {editor==="forecast"&&<><h2>Previsão atual de conclusão</h2><p className="muted">O prazo original {dateBR(dueDate)} continua como baseline.</p><input className="input" type="date" min={revisionStart||undefined} value={forecastValue} onChange={e=>setForecastValue(e.target.value)}/><button className="btn btn-primary btn-block" disabled={terminal} onClick={saveForecast} style={{marginTop:12}}>Salvar previsão</button></>}
   {editor==="owner"&&<><h2>Alterar responsável</h2><p className="muted" style={{fontSize:12}}>A mudança vale a partir de hoje; o passado permanece atribuído ao responsável anterior.</p><select className="select" value={ownerValue} onChange={e=>setOwnerValue(e.target.value)}><option value="">Sem responsável</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.full_name||"Usuário"}</option>)}<option value="__external__">Outro / responsável externo</option></select>{ownerValue==="__external__"&&<input className="input" style={{marginTop:10}} value={externalOwner} onChange={e=>setExternalOwner(e.target.value)} placeholder="Nome do responsável externo"/>}<button className="btn btn-primary btn-block" disabled={terminal} onClick={saveOwner} style={{marginTop:12}}>Salvar responsável</button></>}
   {message&&<div className="error" style={{marginTop:10}}>{message}</div>}<button className="btn btn-outline btn-block" onClick={()=>setEditor(null)} style={{marginTop:10}}>Fechar</button>
  </div></div>}
 </>;
}