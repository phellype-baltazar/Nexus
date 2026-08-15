"use client";

import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type ScheduleRow={
  activity_id:string;
  title:string;
  start_date:string|null;
  finish_date:string|null;
  early_start:string|null;
  early_finish:string|null;
  late_start:string|null;
  late_finish:string|null;
  total_float_days:number;
  is_critical:boolean;
  owner_name:string|null;
  progress:number;
  status:string;
};

type Optimization={
  project_start?:string;
  project_finish?:string;
  critical_count?:number;
  near_critical_count?:number;
  critical_path?:Array<any>;
  candidates?:Array<any>;
  note?:string;
};

type ZoomMode="month"|"quarter"|"year";

const br=(v?:string|null)=>v?new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR"):"—";
const iso=(d:Date)=>d.toISOString().slice(0,10);
const monthLabel=(d:Date)=>d.toLocaleDateString("pt-BR",{month:"short"}).replace(".","").toUpperCase();
const quarter=(d:Date)=>`T${Math.floor(d.getMonth()/3)+1}`;

function addMonths(d:Date,n:number){const x=new Date(d);x.setMonth(x.getMonth()+n);return x;}
function startOfMonth(d:Date){return new Date(d.getFullYear(),d.getMonth(),1);}
function endOfMonth(d:Date){return new Date(d.getFullYear(),d.getMonth()+1,0);}

export function ProjectScheduleActions({projectId}:{projectId:string}){
  const [modal,setModal]=useState<"gantt"|"critical"|null>(null);
  const [rows,setRows]=useState<ScheduleRow[]>([]);
  const [optimization,setOptimization]=useState<Optimization|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [zoom,setZoom]=useState<ZoomMode>("month");

  async function openGantt(){
    setBusy(true);setError("");
    const s=createClient();
    const {data,error}=await s.rpc("rpc_project_cpm_schedule",{p_project_id:projectId});
    if(error){setError(error.message);setBusy(false);return;}
    setRows((data||[]).map((r:any)=>({...r,total_float_days:Number(r.total_float_days||0),progress:Number(r.progress||0)})));
    setModal("gantt");setBusy(false);
  }

  async function openCritical(){
    setBusy(true);setError("");
    const s=createClient();
    const {data,error}=await s.rpc("rpc_project_schedule_optimization",{p_project_id:projectId});
    if(error){setError(error.message);setBusy(false);return;}
    const first=Array.isArray(data)?data[0]:data;
    setOptimization((first?.optimization||first||{}) as Optimization);
    setModal("critical");setBusy(false);
  }

  const gantt=useMemo(()=>{
    const values=rows.flatMap(r=>[r.early_start||r.start_date,r.early_finish||r.finish_date]).filter(Boolean) as string[];
    if(!values.length)return null;
    let min=new Date(`${[...values].sort()[0]}T12:00:00`);
    let max=new Date(`${[...values].sort().at(-1)!}T12:00:00`);
    min=startOfMonth(min);max=endOfMonth(max);

    const months:Date[]=[];
    let cursor=startOfMonth(min);
    while(cursor<=max){months.push(new Date(cursor));cursor=addMonths(cursor,1);}

    const totalDays=Math.max(1,Math.round((max.getTime()-min.getTime())/86400000)+1);
    const monthWidth=zoom==="month"?92:zoom==="quarter"?58:38;
    const timelineWidth=Math.max(months.length*monthWidth,520);
    const dayPx=timelineWidth/totalDays;

    const groups:Array<{year:number;q:string;start:number;span:number}>=[];
    months.forEach((m,i)=>{
      const key=`${m.getFullYear()}-${quarter(m)}`;
      const prev=groups[groups.length-1];
      if(prev&&`${prev.year}-${prev.q}`===key)prev.span+=1;
      else groups.push({year:m.getFullYear(),q:quarter(m),start:i,span:1});
    });

    function x(date?:string|null){
      if(!date)return 0;
      const d=new Date(`${date}T12:00:00`);
      return Math.max(0,Math.min(timelineWidth,(d.getTime()-min.getTime())/86400000*dayPx));
    }

    function width(start?:string|null,end?:string|null){
      if(!start||!end)return 8;
      return Math.max(8,x(end)-x(start)+dayPx);
    }

    return {min,max,months,groups,timelineWidth,monthWidth,totalDays,dayPx,x,width};
  },[rows,zoom]);

  function barColor(r:ScheduleRow){
    const s=String(r.status||"").toLowerCase();
    if(s.includes("cancel"))return "#94a3b8";
    if(s==="done"||s.includes("feito"))return "#16a34a";
    if(r.is_critical)return "#dc2626";
    if(Number(r.total_float_days||0)<=5)return "#f59e0b";
    return "#2563eb";
  }

  const btn:React.CSSProperties={flex:1,minHeight:52,borderRadius:16,border:"1px solid var(--line)",background:"white",fontWeight:900,fontSize:14,padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:7};

  return <>
    <section style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"0 0 14px"}}>
      <button type="button" onClick={openGantt} disabled={busy} style={btn}>📊 Gantt do projeto</button>
      <button type="button" onClick={openCritical} disabled={busy} style={{...btn,background:"#fff7e8",borderColor:"#f3d9a6"}}>⚡ Caminho crítico</button>
    </section>
    {error&&<div className="error" style={{marginBottom:12}}>{error}</div>}

    {modal&&<div onClick={()=>setModal(null)} style={{position:"fixed",inset:0,zIndex:120,background:"rgba(15,23,42,.46)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:980,maxHeight:"94dvh",overflowY:"auto",background:"#f6f8fb",borderRadius:"26px 26px 0 0",padding:"14px 12px calc(22px + env(safe-area-inset-bottom,0px))",boxSizing:"border-box"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12}}>
          <div><h2 style={{margin:0,fontSize:22}}>{modal==="gantt"?"Gantt do projeto":"Caminho crítico e otimização"}</h2>{modal==="gantt"&&<div className="muted" style={{fontSize:12,marginTop:2}}>Cronograma visual por datas, progresso e criticidade</div>}</div>
          <button className="btn btn-outline" onClick={()=>setModal(null)}>Fechar</button>
        </div>

        {modal==="gantt"&&<>
          {!rows.length||!gantt?<div className="card">Nenhuma atividade disponível para o cronograma.</div>:<>
            <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap"}}>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                <span className="chip" style={{background:"#fee2e2",color:"#991b1b"}}>● Crítica</span>
                <span className="chip" style={{background:"#fef3c7",color:"#92400e"}}>● Quase crítica</span>
                <span className="chip" style={{background:"#dcfce7",color:"#166534"}}>● Concluída</span>
              </div>
              <div style={{display:"flex",gap:6}}>
                {(["month","quarter","year"] as ZoomMode[]).map(z=><button key={z} type="button" onClick={()=>setZoom(z)} className={`chip ${zoom===z?"active":""}`} style={{fontWeight:800}}>{z==="month"?"Mês":z==="quarter"?"Trimestre":"Ano"}</button>)}
              </div>
            </div>

            <div className="card" style={{padding:0,overflow:"hidden",marginTop:0}}>
              <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                <div style={{minWidth:210+gantt.timelineWidth}}>
                  <div style={{display:"grid",gridTemplateColumns:`210px ${gantt.timelineWidth}px`,position:"sticky",top:0,zIndex:8,background:"white",borderBottom:"1px solid var(--line)"}}>
                    <div style={{padding:"14px 12px",fontWeight:900,borderRight:"1px solid var(--line)",display:"flex",alignItems:"center"}}>ATIVIDADE</div>
                    <div>
                      <div style={{display:"flex",height:34,borderBottom:"1px solid var(--line)"}}>
                        {gantt.groups.map((g,i)=><div key={`${g.year}-${g.q}-${i}`} style={{width:g.span*gantt.monthWidth,borderRight:"1px solid var(--line)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#475569"}}>{g.q} · {g.year}</div>)}
                      </div>
                      <div style={{display:"flex",height:34}}>
                        {gantt.months.map((m,i)=><div key={i} style={{width:gantt.monthWidth,borderRight:"1px solid var(--line)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#64748b"}}>{monthLabel(m)}</div>)}
                      </div>
                    </div>
                  </div>

                  {rows.map((r,index)=>{
                    const start=r.early_start||r.start_date;
                    const end=r.early_finish||r.finish_date;
                    const left=gantt.x(start),w=gantt.width(start,end),color=barColor(r),progress=Math.max(0,Math.min(100,Number(r.progress||0)));
                    return <div key={r.activity_id} style={{display:"grid",gridTemplateColumns:`210px ${gantt.timelineWidth}px`,minHeight:72,borderBottom:index===rows.length-1?"none":"1px solid var(--line)",background:index%2?"#fbfdff":"white"}}>
                      <div style={{position:"sticky",left:0,zIndex:5,background:index%2?"#fbfdff":"white",padding:"10px 12px",borderRight:"1px solid var(--line)",display:"flex",flexDirection:"column",justifyContent:"center",boxShadow:"4px 0 10px rgba(15,23,42,.03)"}}>
                        <div style={{fontWeight:900,fontSize:13,lineHeight:1.15}}>{r.title}</div>
                        <div className="muted" style={{fontSize:10,marginTop:3}}>{br(start)} → {br(end)}</div>
                        <div className="muted" style={{fontSize:10}}>{r.is_critical?"Crítica · 0 d folga":`${r.total_float_days} d de folga`}</div>
                      </div>
                      <div style={{position:"relative",height:72,backgroundImage:`repeating-linear-gradient(to right, transparent 0, transparent ${Math.max(1,gantt.monthWidth-1)}px, rgba(148,163,184,.18) ${gantt.monthWidth}px)`}}>
                        {(()=>{const today=new Date();const t=iso(today);if(t>=iso(gantt.min)&&t<=iso(gantt.max)){const tx=gantt.x(t);return <div style={{position:"absolute",left:tx,top:0,bottom:0,width:2,background:"#0f172a",opacity:.25,zIndex:1}}/>}return null;})()}
                        <div style={{position:"absolute",left,top:20,width:w,height:32,borderRadius:999,background:"#e2e8f0",overflow:"hidden",boxShadow:"inset 0 0 0 1px rgba(15,23,42,.06)"}}>
                          <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${progress}%`,background:color,opacity:.95}}/>
                          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:progress>45?"white":"#0f172a",textShadow:progress>45?"0 1px 2px rgba(0,0,0,.25)":"none"}}>{Math.round(progress)}%</div>
                        </div>
                      </div>
                    </div>
                  })}
                </div>
              </div>
            </div>
          </>}
        </>}

        {modal==="critical"&&<>
          {!optimization?<div className="card">Não foi possível gerar o diagnóstico.</div>:<>
            <section style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div className="card" style={{marginTop:0,textAlign:"center"}}><div className="eyebrow">Fim atual</div><strong style={{fontSize:22}}>{br(optimization.project_finish)}</strong></div>
              <div className="card" style={{marginTop:0,textAlign:"center"}}><div className="eyebrow">Atividades críticas</div><strong style={{fontSize:28}}>{optimization.critical_count||0}</strong></div>
            </section>
            <section className="card"><h3 style={{marginTop:0}}>Prioridades para reduzir prazo</h3>{!(optimization.candidates||[]).length?<div className="muted">Cadastre dependências entre as atividades para obter um caminho crítico estrutural mais representativo.</div>:(optimization.candidates||[]).map((c:any,i:number)=><div className="row" key={c.activity_id||i}><div className="row-main"><div className="row-title">{i+1}. {c.title}</div><div className="row-sub">{c.recommended_action||"Priorizar execução"} · folga {Number(c.float_days||0)} d · redução teórica até {Number(c.theoretical_reduction_days||0)} d</div><div className="row-sub">Responsável: {c.owner||"Sem responsável"}{c.workload_risk?" · ⚠ risco de workload":""}</div></div></div>)}</section>
            {!!optimization.note&&<div className="notice">{optimization.note}</div>}
          </>}
        </>}
      </div>
    </div>}
  </>;
}
