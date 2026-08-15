"use client";

import {useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type ScheduleRow={activity_id:string;title:string;start_date:string|null;finish_date:string|null;early_start:string|null;early_finish:string|null;late_start:string|null;late_finish:string|null;total_float_days:number;is_critical:boolean;owner_name:string|null;progress:number;status:string};
type Optimization={project_finish?:string;critical_count?:number;candidates?:Array<any>;note?:string};
type Zoom="month"|"quarter"|"year";

const DAY=86400000;
const LEFT=200;
const br=(v?:string|null)=>v?new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR"):"—";
const date=(v:string)=>new Date(`${v}T12:00:00`);
const iso=(d:Date)=>d.toISOString().slice(0,10);
const addDays=(d:Date,n:number)=>new Date(d.getTime()+n*DAY);
const monthLabel=(d:Date)=>d.toLocaleDateString("pt-BR",{month:"short"}).replace(".","").toUpperCase();
const q=(d:Date)=>`T${Math.floor(d.getMonth()/3)+1}`;
const startMonth=(d:Date)=>new Date(d.getFullYear(),d.getMonth(),1);
const endMonth=(d:Date)=>new Date(d.getFullYear(),d.getMonth()+1,0);

export function ProjectScheduleActionsV3({projectId}:{projectId:string}){
 const[modal,setModal]=useState<"gantt"|"critical"|null>(null);
 const[rows,setRows]=useState<ScheduleRow[]>([]);
 const[optimization,setOptimization]=useState<Optimization|null>(null);
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState("");
 const[zoom,setZoom]=useState<Zoom>("quarter");
 const scroller=useRef<HTMLDivElement|null>(null);

 async function openGantt(){setBusy(true);setError("");const s=createClient();const{data,error}=await s.rpc("rpc_project_cpm_schedule",{p_project_id:projectId});if(error){setError(error.message);setBusy(false);return}setRows((data||[]).map((r:any)=>({...r,total_float_days:Number(r.total_float_days||0),progress:Number(r.progress||0)})));setModal("gantt");setBusy(false)}
 async function openCritical(){setBusy(true);setError("");const s=createClient();const{data,error}=await s.rpc("rpc_project_schedule_optimization",{p_project_id:projectId});if(error){setError(error.message);setBusy(false);return}const first=Array.isArray(data)?data[0]:data;setOptimization((first?.optimization||first||{}) as Optimization);setModal("critical");setBusy(false)}
 function selectZoom(z:Zoom){setZoom(z);requestAnimationFrame(()=>{if(scroller.current)scroller.current.scrollLeft=0})}

 const gantt=useMemo(()=>{
  const values=rows.flatMap(r=>[r.start_date,r.finish_date,r.early_start,r.early_finish]).filter(Boolean) as string[];
  if(!values.length)return null;
  const min=startMonth(date([...values].sort()[0]));
  const max=endMonth(date([...values].sort().at(-1)!));
  const days=Math.max(1,Math.round((max.getTime()-min.getTime())/DAY)+1);
  const dayPx=zoom==="month"?12:zoom==="quarter"?4:1.6;
  const width=Math.max(zoom==="month"?1000:zoom==="quarter"?700:360,days*dayPx);
  const px=width/days;
  const x=(v?:string|null)=>v?Math.max(0,Math.min(width,(date(v).getTime()-min.getTime())/DAY*px)):0;
  const barWidth=(a?:string|null,b?:string|null)=>!a||!b?6:Math.max(6,x(b)-x(a)+px);

  const ticks:Array<{at:Date;label:string;major?:string;width:number}>=[];
  if(zoom==="month"){
   for(let d=new Date(min);d<=max;d=addDays(d,7)){const next=addDays(d,7);ticks.push({at:new Date(d),label:d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),major:`${monthLabel(d)} ${d.getFullYear()}`,width:Math.max(1,(Math.min(next.getTime(),max.getTime()+DAY)-d.getTime())/DAY*px)})}
  }else{
   for(let d=startMonth(min);d<=max;d=new Date(d.getFullYear(),d.getMonth()+1,1)){const next=new Date(d.getFullYear(),d.getMonth()+1,1);ticks.push({at:new Date(d),label:zoom==="quarter"?monthLabel(d):q(d),major:zoom==="quarter"?`${q(d)} · ${d.getFullYear()}`:`${d.getFullYear()}`,width:Math.max(1,(Math.min(next.getTime(),max.getTime()+DAY)-d.getTime())/DAY*px)})}
  }
  const majors:Array<{label:string;width:number}>=[];
  for(const t of ticks){const last=majors.at(-1);if(last&&last.label===t.major)last.width+=t.width;else majors.push({label:t.major||"",width:t.width})}
  return{min,max,width,px,x,barWidth,ticks,majors};
 },[rows,zoom]);

 function color(r:ScheduleRow){const s=String(r.status||"").toLowerCase();if(s.includes("cancel"))return"#94a3b8";if(s==="done")return"#16a34a";if(r.is_critical)return"#dc2626";if(r.total_float_days<=5)return"#f59e0b";return"#2563eb"}
 const mainBtn:React.CSSProperties={minHeight:52,borderRadius:16,border:"1px solid var(--line)",background:"#fff",fontWeight:900,fontSize:14,padding:10,display:"flex",alignItems:"center",justifyContent:"center",gap:7};
 const zoomBtn=(z:Zoom):React.CSSProperties=>({borderRadius:999,border:zoom===z?"2px solid #2563eb":"1px solid #cbd5e1",background:zoom===z?"#2563eb":"#fff",color:zoom===z?"#fff":"#475569",padding:"10px 16px",fontWeight:900,boxShadow:zoom===z?"0 5px 14px rgba(37,99,235,.22)":"none"});

 return <>
  <section style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}><button onClick={openGantt} disabled={busy} style={mainBtn}>📊 Gantt do projeto</button><button onClick={openCritical} disabled={busy} style={{...mainBtn,background:"#fff7e8",borderColor:"#f3d9a6"}}>⚡ Caminho crítico</button></section>
  {error&&<div className="error" style={{marginBottom:12}}>{error}</div>}
  {modal&&<div onClick={()=>setModal(null)} style={{position:"fixed",inset:0,zIndex:120,background:"rgba(15,23,42,.46)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:1100,maxHeight:"94dvh",overflowY:"auto",background:"#f6f8fb",borderRadius:"26px 26px 0 0",padding:"14px 12px calc(22px + env(safe-area-inset-bottom,0px))",boxSizing:"border-box"}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:12}}><div><h2 style={{margin:0,fontSize:22}}>{modal==="gantt"?"Gantt do projeto":"Caminho crítico e otimização"}</h2>{modal==="gantt"&&<div className="muted" style={{fontSize:12}}>Baseline e forecast posicionados diretamente pelas datas.</div>}</div><button className="btn btn-outline" onClick={()=>setModal(null)}>Fechar</button></div>

   {modal==="gantt"&&gantt&&rows.length>0&&<>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}><span className="chip" style={{background:"#e2e8f0",color:"#475569"}}>━ Baseline</span><span className="chip" style={{background:"#dbeafe",color:"#1d4ed8"}}>▬ Forecast / progresso</span><span className="chip" style={{background:"#fee2e2",color:"#991b1b"}}>● Crítica</span><span className="chip" style={{background:"#fef3c7",color:"#92400e"}}>● Quase crítica</span></div>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}><strong style={{fontSize:12,color:"#475569"}}>Escala:</strong>{(["month","quarter","year"] as Zoom[]).map(z=><button key={z} type="button" onClick={()=>selectZoom(z)} aria-pressed={zoom===z} style={zoomBtn(z)}>{z==="month"?"Mês":z==="quarter"?"Trimestre":"Ano"}{zoom===z?" ✓":""}</button>)}<span className="muted" style={{fontSize:11}}>{zoom==="month"?"semanas":zoom==="quarter"?"meses":"trimestres"}</span></div>

    <div className="card" style={{padding:0,overflow:"hidden",marginTop:0}}><div ref={scroller} style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}><div style={{width:LEFT+gantt.width,minWidth:LEFT+gantt.width}}>
     <div style={{display:"grid",gridTemplateColumns:`${LEFT}px ${gantt.width}px`,position:"sticky",top:0,zIndex:20,background:"white",borderBottom:"1px solid var(--line)"}}><div style={{position:"sticky",left:0,zIndex:30,background:"white",padding:"14px 12px",fontWeight:900,borderRight:"1px solid var(--line)",boxShadow:"4px 0 8px rgba(15,23,42,.05)"}}>ATIVIDADE</div><div><div style={{display:"flex",height:34,borderBottom:"1px solid var(--line)"}}>{gantt.majors.map((m,i)=><div key={i} style={{width:m.width,minWidth:m.width,borderRight:"1px solid var(--line)",display:"grid",placeItems:"center",fontSize:11,fontWeight:900}}>{m.label}</div>)}</div><div style={{display:"flex",height:34}}>{gantt.ticks.map((t,i)=><div key={i} style={{width:t.width,minWidth:t.width,borderRight:"1px solid var(--line)",display:"grid",placeItems:"center",fontSize:10,fontWeight:800,color:"#64748b"}}>{t.label}</div>)}</div></div></div>
     {rows.map((r,index)=>{const bs=r.start_date,be=r.finish_date,fs=r.early_start||bs,fe=r.early_finish||be,bl=gantt.x(bs),bw=gantt.barWidth(bs,be),fl=gantt.x(fs),fw=gantt.barWidth(fs,fe),pct=Math.max(0,Math.min(100,r.progress||0)),c=color(r),changed=bs!==fs||be!==fe;return <div key={r.activity_id} style={{display:"grid",gridTemplateColumns:`${LEFT}px ${gantt.width}px`,minHeight:88,borderBottom:"1px solid var(--line)",background:index%2?"#fbfdff":"white"}}><div style={{position:"sticky",left:0,zIndex:10,background:index%2?"#fbfdff":"white",padding:"10px 12px",borderRight:"1px solid var(--line)",boxShadow:"4px 0 8px rgba(15,23,42,.04)"}}><div style={{fontWeight:900,fontSize:13,lineHeight:1.15}}>{r.title}</div><div className="muted" style={{fontSize:10,marginTop:4}}>Base {br(bs)} → {br(be)}</div><div className="muted" style={{fontSize:10,color:changed?"#1d4ed8":undefined}}>Forecast {br(fs)} → {br(fe)}</div><div className="muted" style={{fontSize:10}}>{r.is_critical?"Crítica · 0 d folga":`${r.total_float_days} d de folga`}</div></div><div style={{position:"relative",height:88,backgroundImage:`repeating-linear-gradient(to right,transparent 0,transparent ${Math.max(1,(zoom==="month"?84:zoom==="quarter"?gantt.px*30:gantt.px*91)-1)}px,rgba(148,163,184,.18) ${Math.max(1,zoom==="month"?84:zoom==="quarter"?gantt.px*30:gantt.px*91)}px)`}}>{(()=>{const t=iso(new Date());if(t>=iso(gantt.min)&&t<=iso(gantt.max))return <div style={{position:"absolute",left:gantt.x(t),top:0,bottom:0,width:2,background:"#111827",opacity:.25,zIndex:1}}/>;return null})()}<div style={{position:"absolute",left:bl,top:18,width:bw,height:8,borderRadius:999,background:"#cbd5e1",zIndex:2}}/><div style={{position:"absolute",left:fl,top:38,width:fw,height:32,borderRadius:999,background:"#e2e8f0",overflow:"hidden",zIndex:3,boxShadow:"inset 0 0 0 1px rgba(15,23,42,.08)"}}><div style={{height:"100%",width:`${pct}%`,background:c}}/><span style={{position:"absolute",inset:0,display:"grid",placeItems:"center",fontSize:11,fontWeight:900,color:pct>=45?"white":"#0f172a"}}>{Math.round(pct)}%</span></div></div></div>})}
    </div></div></div>
   </>}
   {modal==="gantt"&&(!gantt||!rows.length)&&<div className="card">Nenhuma atividade disponível para o cronograma.</div>}
   {modal==="critical"&&<>{!optimization?<div className="card">Não foi possível gerar o diagnóstico.</div>:<><section style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div className="card" style={{marginTop:0,textAlign:"center"}}><div className="eyebrow">Fim atual</div><strong style={{fontSize:22}}>{br(optimization.project_finish)}</strong></div><div className="card" style={{marginTop:0,textAlign:"center"}}><div className="eyebrow">Atividades críticas</div><strong style={{fontSize:28}}>{optimization.critical_count||0}</strong></div></section><section className="card"><h3 style={{marginTop:0}}>Prioridades para reduzir prazo</h3>{!(optimization.candidates||[]).length?<div className="muted">Cadastre dependências para obter um caminho crítico estrutural.</div>:(optimization.candidates||[]).map((c:any,i:number)=><div className="row" key={c.activity_id||i}><div className="row-main"><div className="row-title">{i+1}. {c.title}</div><div className="row-sub">{c.recommended_action||"Priorizar execução"} · folga {Number(c.float_days||0)} d · redução teórica até {Number(c.theoretical_reduction_days||0)} d</div></div></div>)}</section>{optimization.note&&<div className="notice">{optimization.note}</div>}</>}</>}
  </div></div>}
 </>;
}
