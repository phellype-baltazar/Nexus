"use client";

import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

export type ActivityMember={user_id:string;full_name:string|null};
export type ActivityComment={id:string;body:string;created_at:string;author_name:string};
export type WorkloadPoint={work_date:string;planned_hours:number;relative_weight:number};

type Editor="progress"|"status"|"owner"|"start"|"hours"|null;
type EffortProfile="flat"|"front_loaded"|"back_loaded"|"bell"|"double_peak"|"shifted_peak";

const PROFILES:{key:EffortProfile;label:string;short:string;path:string;hint:string}[]=[
  {key:"flat",label:"Flat",short:"Constante",path:"M3 13 L29 13",hint:"Esforço uniforme durante todo o período."},
  {key:"front_loaded",label:"Front-Loaded",short:"Início",path:"M3 4 C10 5 17 10 29 17",hint:"Maior esforço no início, reduzindo até o fim."},
  {key:"back_loaded",label:"Back-Loaded",short:"Final",path:"M3 17 C15 16 22 8 29 4",hint:"Começa leve e concentra esforço no final."},
  {key:"bell",label:"Bell-Shaped",short:"Sino",path:"M3 17 C9 17 10 5 16 4 C22 5 23 17 29 17",hint:"Esforço cresce até o meio e depois diminui."},
  {key:"double_peak",label:"Double Peak",short:"Duplo pico",path:"M3 16 C7 4 11 4 14 15 C17 18 20 4 24 4 C27 6 28 12 29 16",hint:"Picos no início e no final, com vale no meio."},
  {key:"shifted_peak",label:"Early / Late",short:"Pico deslocado",path:"M3 17 C7 16 8 6 12 4 C18 7 22 14 29 17",hint:"Pico deslocado para o início ou para o final."},
];

function dateOnly(value:string|null){
  if(!value)return null;
  if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return null;
  return d.toISOString().slice(0,10);
}

function dateBR(value:string|null){
  if(!value)return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

function visualStatus(status:string,dueDate:string|null,completedAt:string|null){
  const due=dateOnly(dueDate);
  const completed=dateOnly(completedAt);
  const today=new Date().toISOString().slice(0,10);
  if(status==="cancelled")return {label:"Cancelada",bg:"#eef1f5",color:"#5d6675",border:"#d9dee7"};
  if(status==="done"){
    if(!due||!completed)return {label:"Feita",bg:"#e8f7ef",color:"#0b7a46",border:"#bfe8d1"};
    if(completed<due)return {label:"Feita antes do prazo",bg:"#e8f7ef",color:"#0b7a46",border:"#bfe8d1"};
    if(completed===due)return {label:"Feita no prazo",bg:"#e8f7ef",color:"#0b7a46",border:"#bfe8d1"};
    return {label:"Feita fora do prazo",bg:"#fdecef",color:"#b42318",border:"#f3c6ce"};
  }
  if(due&&due<today)return {label:"Atrasada",bg:"#fdecef",color:"#b42318",border:"#f3c6ce"};
  return {label:"Em andamento",bg:"#fff4dd",color:"#9a5b00",border:"#f1ddb0"};
}

function cardBase(){
  return {minHeight:122,height:122,minWidth:0,marginTop:0,padding:"16px 12px",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",gap:9,boxSizing:"border-box" as const,overflow:"hidden",textAlign:"center" as const,width:"100%"};
}

function valueSize(text:string){
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(text))return 19;
  if(text.length>25)return 15;
  if(text.length>18)return 17;
  if(text.length>12)return 19;
  return 29;
}

function CurveIcon({path}:{path:string}){
  return <svg viewBox="0 0 32 22" width="46" height="31" aria-hidden="true"><path d="M2 19 H30" fill="none" stroke="currentColor" strokeWidth="1" opacity=".28"/><path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>;
}

export function ActivityInteractiveDashboard({
  id,organizationId,userId,progress,status,startDate,dueDate,completedAt,estimatedHours,effortProfile,shiftedPeakTiming,ownerId,externalOwnerName,ownerName,members,comments,legacyDescription,workloadCurve,
}:{
  id:string;organizationId:string;userId:string;progress:number;status:string;startDate:string|null;dueDate:string|null;completedAt:string|null;
  estimatedHours:number|null;effortProfile:EffortProfile;shiftedPeakTiming:"early"|"late"|null;
  ownerId:string|null;externalOwnerName:string|null;ownerName:string;members:ActivityMember[];comments:ActivityComment[];legacyDescription:string|null;workloadCurve:WorkloadPoint[];
}){
  const terminal=status==="done"||status==="cancelled";
  const [editor,setEditor]=useState<Editor>(null);
  const [progressValue,setProgressValue]=useState(String(Math.round(Number(progress||0))));
  const [reopenProgress,setReopenProgress]=useState("99");
  const [ownerValue,setOwnerValue]=useState(externalOwnerName?"__external__":ownerId||"");
  const [externalOwner,setExternalOwner]=useState(externalOwnerName||"");
  const [startValue,setStartValue]=useState(startDate||"");
  const [hoursValue,setHoursValue]=useState(estimatedHours==null?"":String(estimatedHours));
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [comment,setComment]=useState("");
  const visual=useMemo(()=>visualStatus(status,dueDate,completedAt),[status,dueDate,completedAt]);

  async function updateActivity(payload:Record<string,unknown>){
    setBusy(true);setMessage("");
    const s=createClient();
    const {error}=await s.from("activities").update(payload).eq("id",id);
    if(error){setMessage(error.message);setBusy(false);return false;}
    location.reload();return true;
  }

  async function saveProgress(){
    const value=Math.max(0,Math.min(100,Number(progressValue||0)));
    const payload:any={progress:value};
    if(value>=100){payload.progress=100;payload.status="done";}else if(terminal){payload.status="in_progress";}
    await updateActivity(payload);
  }
  async function saveStatus(next:"done"|"cancelled"){await updateActivity({status:next,progress:100});}
  async function reopen(){const value=Math.max(0,Math.min(99,Number(reopenProgress||0)));await updateActivity({status:"in_progress",progress:value});}
  async function saveStart(){
    if(!startValue){setMessage("Informe a data de início.");return;}
    if(dueDate&&startValue>dueDate){setMessage("A data de início não pode ser posterior à data prevista.");return;}
    await updateActivity({start_date:startValue});
  }
  async function saveHours(){
    const value=Number(hoursValue);
    if(!Number.isFinite(value)||value<0){setMessage("Informe uma quantidade válida de horas.");return;}
    await updateActivity({estimated_hours:value});
  }
  async function saveProfile(profile:EffortProfile,timing?:"early"|"late"){
    await updateActivity({effort_profile:profile,shifted_peak_timing:profile==="shifted_peak"?(timing||shiftedPeakTiming||"early"):null});
  }
  async function saveOwner(){
    let payload:any;
    if(ownerValue==="__external__"){
      const name=externalOwner.trim();
      if(!name){setMessage("Informe o nome do responsável externo.");return;}
      payload={primary_owner_id:null,external_owner_name:name};
    }else payload={primary_owner_id:ownerValue||null,external_owner_name:null};
    await updateActivity(payload);
  }
  async function addComment(e:React.FormEvent){
    e.preventDefault();const body=comment.trim();if(!body)return;
    setBusy(true);setMessage("");const s=createClient();
    const {error}=await s.from("comments").insert({organization_id:organizationId,author_user_id:userId,entity_type:"activity",entity_id:id,body});
    if(error){setMessage(error.message);setBusy(false);return;}setComment("");location.reload();
  }

  const pText=`${Math.round(Number(progress||0))}%`;
  const hoursText=estimatedHours==null?"—":`${Number(estimatedHours).toLocaleString("pt-BR",{maximumFractionDigits:1})} h`;
  const maxHours=Math.max(0,...workloadCurve.map(p=>Number(p.planned_hours||0)));
  const totalCurve=workloadCurve.reduce((sum,p)=>sum+Number(p.planned_hours||0),0);
  const profileInfo=PROFILES.find(p=>p.key===effortProfile)||PROFILES[3];

  return <>
    <section style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginTop:14,width:"100%",maxWidth:"100%",overflow:"hidden"}}>
      <button type="button" className="card" onClick={()=>{setProgressValue(String(Math.round(Number(progress||0))));setMessage("");setEditor("progress")}} style={{...cardBase(),cursor:"pointer",border:"1px solid var(--line)",background:"white"}}><div className="eyebrow" style={{margin:0}}>Progresso</div><div style={{fontSize:valueSize(pText),lineHeight:1,fontWeight:900}}>{pText}</div></button>
      <button type="button" className="card" onClick={()=>{setMessage("");setEditor("status")}} style={{...cardBase(),cursor:"pointer",border:`1px solid ${visual.border}`,background:visual.bg,color:visual.color}}><div className="eyebrow" style={{margin:0,color:visual.color}}>Status</div><div style={{fontSize:valueSize(visual.label),lineHeight:1.08,fontWeight:900,maxWidth:"100%"}}>{visual.label}</div></button>
      <button type="button" className="card" onClick={()=>{setStartValue(startDate||"");setMessage("");setEditor("start")}} style={{...cardBase(),cursor:"pointer",border:"1px solid var(--line)",background:"white"}}><div className="eyebrow" style={{margin:0}}>Data de início</div><div style={{fontSize:19,lineHeight:1,fontWeight:900,whiteSpace:"nowrap"}}>{dateBR(startDate)}</div></button>
      <div className="card" style={{...cardBase(),border:"1px solid var(--line)",background:"white"}}><div className="eyebrow" style={{margin:0}}>Data prevista</div><div style={{fontSize:19,lineHeight:1,fontWeight:900,whiteSpace:"nowrap"}}>{dateBR(dueDate)}</div></div>
      <button type="button" className="card" onClick={()=>{setMessage("");setEditor("owner")}} style={{...cardBase(),cursor:"pointer",border:"1px solid var(--line)",background:"white"}}><div className="eyebrow" style={{margin:0}}>Responsável</div><div style={{fontSize:valueSize(ownerName),lineHeight:1.08,fontWeight:900,maxWidth:"100%",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{ownerName}</div></button>
      <button type="button" className="card" onClick={()=>{setHoursValue(estimatedHours==null?"":String(estimatedHours));setMessage("");setEditor("hours")}} style={{...cardBase(),cursor:"pointer",border:"1px solid var(--line)",background:"white"}}><div className="eyebrow" style={{margin:0}}>Horas previstas</div><div style={{fontSize:valueSize(hoursText),lineHeight:1,fontWeight:900}}>{hoursText}</div></button>
    </section>

    <section className="card" style={{marginTop:12}}>
      <h2 style={{marginBottom:4}}>Distribuição do esforço</h2>
      <p className="muted" style={{marginTop:0,fontSize:13}}>Escolha como as horas previstas se distribuem entre a data de início e a data prevista.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8,marginTop:12}}>
        {PROFILES.map(p=>{const active=effortProfile===p.key;return <button key={p.key} type="button" disabled={busy} title={p.hint} onClick={()=>saveProfile(p.key)} style={{minWidth:0,minHeight:88,borderRadius:16,border:`1px solid ${active?"var(--primary)":"var(--line)"}`,background:active?"#edf4ff":"white",color:active?"var(--primary)":"var(--text)",padding:"9px 5px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,fontWeight:800,cursor:"pointer"}}><CurveIcon path={p.path}/><span style={{fontSize:11,lineHeight:1.1,textAlign:"center"}}>{p.short}</span></button>})}
      </div>
      {effortProfile==="shifted_peak"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}><button className={`btn ${shiftedPeakTiming!=="late"?"btn-primary":"btn-outline"}`} disabled={busy} onClick={()=>saveProfile("shifted_peak","early")}>Pico Early</button><button className={`btn ${shiftedPeakTiming==="late"?"btn-primary":"btn-outline"}`} disabled={busy} onClick={()=>saveProfile("shifted_peak","late")}>Pico Late</button></div>}
      <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid var(--line)"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"baseline"}}><div><strong>{profileInfo.label}</strong><div className="muted" style={{fontSize:11}}>{profileInfo.hint}</div></div><strong style={{whiteSpace:"nowrap"}}>{totalCurve.toLocaleString("pt-BR",{maximumFractionDigits:1})} h</strong></div>
        {!workloadCurve.length?<div className="notice" style={{marginTop:10}}>Informe data de início, data prevista e horas previstas para gerar a curva de workload.</div>:<div style={{height:92,display:"flex",alignItems:"flex-end",gap:2,marginTop:12,overflow:"hidden",padding:"0 2px 4px",borderBottom:"1px solid var(--line)"}}>{workloadCurve.map((p,i)=><div key={`${p.work_date}-${i}`} title={`${dateBR(p.work_date)} · ${Number(p.planned_hours).toLocaleString("pt-BR",{maximumFractionDigits:2})} h`} style={{flex:1,minWidth:2,maxWidth:18,height:`${Math.max(5,maxHours?Math.round(Number(p.planned_hours)/maxHours*82):5)}px`,background:"var(--primary)",borderRadius:"3px 3px 0 0",opacity:.82}}/>)}</div>}
      </div>
    </section>

    <section className="card" style={{marginTop:12}}><h2>Comentários</h2>{legacyDescription&&<div style={{padding:"10px 0",borderBottom:comments.length?"1px solid var(--line)":"none"}}><div className="muted" style={{fontSize:12,fontWeight:800}}>Descrição original</div><div>{legacyDescription}</div></div>}{!comments.length&&!legacyDescription&&<p className="muted">Nenhum comentário ainda.</p>}{comments.map(c=><div key={c.id} style={{padding:"12px 0",borderTop:"1px solid var(--line)"}}><div style={{fontWeight:800,fontSize:13}}>{c.author_name}</div><div className="muted" style={{fontSize:11,marginTop:2}}>{new Date(c.created_at).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}</div><div style={{marginTop:6,whiteSpace:"pre-wrap"}}>{c.body}</div></div>)}<form onSubmit={addComment} style={{marginTop:12}}><textarea className="textarea" value={comment} onChange={e=>setComment(e.target.value)} placeholder="Adicionar comentário..." rows={3}/><button className="btn btn-primary btn-block" disabled={busy||!comment.trim()} style={{marginTop:8}}>Comentar</button></form>{message&&<div className="error" style={{marginTop:8}}>{message}</div>}</section>

    {editor&&<div role="dialog" aria-modal="true" onClick={()=>!busy&&setEditor(null)} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(15,23,42,.35)",display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"18px"}}><div className="card" onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,margin:0,padding:20,borderRadius:24}}>
      {editor==="progress"&&<><h2>Atualizar progresso</h2><div className="field"><label>Progresso (%)</label><input className="input" type="number" min="0" max="100" value={progressValue} onChange={e=>setProgressValue(e.target.value)}/></div><div className="muted" style={{fontSize:12}}>{terminal?"Abaixo de 100% reabre a ação. Em 100%, fica como Feita.":"Em 100%, a ação será marcada automaticamente como Feita."}</div><button className="btn btn-primary btn-block" disabled={busy} onClick={saveProgress} style={{marginTop:12}}>Salvar</button></>}
      {editor==="status"&&<><h2>Atualizar status</h2>{status!=="done"&&<button className="btn btn-primary btn-block" disabled={busy} onClick={()=>saveStatus("done")}>Marcar como feita</button>}{status!=="cancelled"&&<button className="btn btn-outline btn-block" disabled={busy} onClick={()=>saveStatus("cancelled")} style={{marginTop:status!=="done"?10:0}}>Cancelar ação</button>}{terminal&&<div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--line)"}}><div className="field"><label>Progresso ao reabrir (%)</label><input className="input" type="number" min="0" max="99" value={reopenProgress} onChange={e=>setReopenProgress(e.target.value)}/></div><button className="btn btn-secondary btn-block" disabled={busy} onClick={reopen}>Reabrir ação</button></div>}</>}
      {editor==="start"&&<><h2>Data de início</h2><div className="field"><label>Início</label><input className="input" type="date" value={startValue} max={dueDate||undefined} onChange={e=>setStartValue(e.target.value)}/></div><button className="btn btn-primary btn-block" disabled={busy} onClick={saveStart}>Salvar início</button></>}
      {editor==="hours"&&<><h2>Horas previstas</h2><div className="field"><label>Horas</label><input className="input" type="number" min="0" step="0.5" value={hoursValue} onChange={e=>setHoursValue(e.target.value)}/></div><button className="btn btn-primary btn-block" disabled={busy} onClick={saveHours}>Salvar horas</button></>}
      {editor==="owner"&&<><h2>Alterar responsável</h2><div className="field"><label>Responsável</label><select className="select" value={ownerValue} onChange={e=>setOwnerValue(e.target.value)}><option value="">Sem responsável</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.full_name||"Usuário"}</option>)}<option value="__external__">Outro / responsável externo</option></select></div>{ownerValue==="__external__"&&<div className="field"><label>Nome do responsável externo</label><input className="input" value={externalOwner} onChange={e=>setExternalOwner(e.target.value)} placeholder="Digite o nome" maxLength={160}/></div>}<button className="btn btn-primary btn-block" disabled={busy} onClick={saveOwner}>Salvar responsável</button></>}
      {message&&<div className="error" style={{marginTop:10}}>{message}</div>}<button className="btn btn-outline btn-block" disabled={busy} onClick={()=>setEditor(null)} style={{marginTop:10}}>Fechar</button>
    </div></div>}
  </>;
}
