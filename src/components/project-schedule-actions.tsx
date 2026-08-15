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

const br=(v?:string|null)=>v?new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR"):"—";

export function ProjectScheduleActions({projectId}:{projectId:string}){
  const [modal,setModal]=useState<"gantt"|"critical"|null>(null);
  const [rows,setRows]=useState<ScheduleRow[]>([]);
  const [optimization,setOptimization]=useState<Optimization|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

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

  const range=useMemo(()=>{
    const dates=rows.flatMap(r=>[r.early_start||r.start_date,r.early_finish||r.finish_date]).filter(Boolean) as string[];
    if(!dates.length)return null;
    const min=[...dates].sort()[0],max=[...dates].sort().at(-1)!;
    const a=new Date(`${min}T12:00:00Z`).getTime(),b=new Date(`${max}T12:00:00Z`).getTime();
    return {min,max,a,b,days:Math.max(1,Math.round((b-a)/86400000)+1)};
  },[rows]);

  function pos(date?:string|null){if(!date||!range)return 0;return Math.max(0,Math.min(100,((new Date(`${date}T12:00:00Z`).getTime()-range.a)/86400000)/Math.max(1,range.days-1)*100));}

  const btn:React.CSSProperties={flex:1,minHeight:52,borderRadius:16,border:"1px solid var(--line)",background:"white",fontWeight:900,fontSize:14,padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"center",gap:7};

  return <>
    <section style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"0 0 14px"}}>
      <button type="button" onClick={openGantt} disabled={busy} style={btn}>📊 Gantt do projeto</button>
      <button type="button" onClick={openCritical} disabled={busy} style={{...btn,background:"#fff7e8",borderColor:"#f3d9a6"}}>⚡ Caminho crítico</button>
    </section>
    {error&&<div className="error" style={{marginBottom:12}}>{error}</div>}

    {modal&&<div onClick={()=>setModal(null)} style={{position:"fixed",inset:0,zIndex:120,background:"rgba(15,23,42,.46)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:760,maxHeight:"92dvh",overflowY:"auto",background:"#f6f8fb",borderRadius:"26px 26px 0 0",padding:"16px 14px calc(24px + env(safe-area-inset-bottom,0px))",boxSizing:"border-box"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:14}}><h2 style={{margin:0}}>{modal==="gantt"?"Gantt do projeto":"Caminho crítico e otimização"}</h2><button className="btn btn-outline" onClick={()=>setModal(null)}>Fechar</button></div>

        {modal==="gantt"&&<>
          {!rows.length?<div className="card">Nenhuma atividade disponível para o cronograma.</div>:<>
            <div className="notice" style={{marginBottom:10}}>Vermelho = caminho crítico. Azul = atividade com folga. O cálculo usa o forecast atual.</div>
            <div className="card" style={{overflowX:"auto",padding:12}}>
              <div style={{minWidth:560}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)",marginBottom:8}}><span>{br(range?.min)}</span><span>{br(range?.max)}</span></div>
                {rows.map(r=>{const start=r.early_start||r.start_date,end=r.early_finish||r.finish_date,left=pos(start),right=pos(end),width=Math.max(2,right-left+1);return <div key={r.activity_id} style={{display:"grid",gridTemplateColumns:"170px 1fr",gap:10,alignItems:"center",marginBottom:10}}><div><div style={{fontWeight:800,fontSize:12,lineHeight:1.15}}>{r.title}</div><div className="muted" style={{fontSize:10}}>{r.is_critical?"Crítica · 0 d folga":`${r.total_float_days} d folga`}</div></div><div style={{height:30,position:"relative",background:"#edf1f7",borderRadius:8,overflow:"hidden"}}><div style={{position:"absolute",left:`${left}%`,width:`${width}%`,top:5,bottom:5,borderRadius:6,background:r.is_critical?"#dc2626":"#2563eb"}}/><span style={{position:"absolute",right:5,top:7,fontSize:9,fontWeight:800,color:"#475569"}}>{Math.round(r.progress||0)}%</span></div></div>})}
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
