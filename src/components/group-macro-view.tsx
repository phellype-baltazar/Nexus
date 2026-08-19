"use client";

import Link from "next/link";

type Program={id:string;name:string;start_date:string|null;due_date:string|null;progress:number|null;health:string|null;projectCount:number;offProjects:number};
type Props={programs:Program[]};

function days(a:string,b:string){return Math.max(0,Math.round((new Date(`${b}T12:00:00Z`).getTime()-new Date(`${a}T12:00:00Z`).getTime())/86400000))}
function dateBR(v:string){return new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR")}
function shortDate(v:string){return new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}
function monthLabel(v:string){return new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR",{month:"short",year:"2-digit"}).replace(" de ","/")}
function isOff(v:string|null){const x=String(v||"").toLowerCase();return x.includes("off")||x.includes("red")||x.includes("atras")||x.includes("risk")||x.includes("critical")}
function dateAt(start:string,end:string,ratio:number){const a=new Date(`${start}T12:00:00Z`).getTime(),b=new Date(`${end}T12:00:00Z`).getTime();return new Date(a+(b-a)*ratio).toISOString().slice(0,10)}

export function GroupMacroView({programs}:Props){
  const dated=programs.filter(p=>p.start_date&&p.due_date) as Array<Program&{start_date:string;due_date:string}>;
  const min=dated.length?dated.reduce((m,p)=>p.start_date<m?p.start_date:m,dated[0].start_date):null;
  const max=dated.length?dated.reduce((m,p)=>p.due_date>m?p.due_date:m,dated[0].due_date):null;
  const span=min&&max?Math.max(1,days(min,max)+1):1;
  const tickCount=programs.length>12?4:5;
  const ticks=min&&max?Array.from({length:tickCount},(_,i)=>{const r=i/(tickCount-1);const d=dateAt(min,max,r);return {r,label:span>120?monthLabel(d):shortDate(d)}}):[];
  const rowHeight=programs.length>18?22:programs.length>12?26:32;
  const nameSize=programs.length>18?9:programs.length>12?10:11;
  const today=new Date().toISOString().slice(0,10);
  const todayRatio=min&&max&&today>=min&&today<=max?days(min,today)/span*100:null;

  return <section className="card" style={{marginTop:12,overflow:"hidden"}}>
    <div className="eyebrow">Visão integrada da direção</div>
    <h2 style={{margin:"2px 0 4px"}}>Gantt dos programas</h2>
    <p className="muted" style={{marginTop:0}}>Todos os programas da direção no mesmo quadro e na mesma escala de tempo.</p>
    {!programs.length?<div className="empty">Nenhum programa nesta direção.</div>:<div style={{width:"100%",overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"35% 65%",gap:6,alignItems:"end",marginBottom:4}}>
        <div className="muted" style={{fontSize:9,fontWeight:800}}>PROGRAMA</div>
        <div style={{position:"relative",height:30,borderBottom:"1px solid var(--line)"}}>
          {ticks.map(t=><div key={t.r} style={{position:"absolute",left:`${t.r*100}%`,transform:t.r===0?"none":t.r===1?"translateX(-100%)":"translateX(-50%)",bottom:4,fontSize:8.5,color:"var(--muted)",whiteSpace:"nowrap"}}>{t.label}</div>)}
        </div>
      </div>
      <div style={{position:"relative"}}>
        {todayRatio!==null&&<div title={`Hoje · ${dateBR(today)}`} style={{position:"absolute",left:`calc(35% + ${(todayRatio/100)*65}% )`,top:0,bottom:0,width:2,background:"#f97316",zIndex:5,opacity:.85}}/>}
        {programs.map(p=>{const hasDates=!!(p.start_date&&p.due_date&&min&&max);const left=hasDates?days(min!,p.start_date!)/span*100:0;const width=hasDates?Math.max(2,(days(p.start_date!,p.due_date!)+1)/span*100):0;return <Link href={`/app/program/${p.id}`} key={p.id} style={{display:"grid",gridTemplateColumns:"35% 65%",gap:6,alignItems:"center",height:rowHeight,borderTop:"1px solid var(--line)",textDecoration:"none",color:"inherit"}}>
          <div style={{minWidth:0,paddingRight:2}}>
            <div style={{fontWeight:800,fontSize:nameSize,lineHeight:1.05,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
            <div className="muted" style={{fontSize:8.5,marginTop:1}}>{Math.round(Number(p.progress||0))}% · {p.projectCount} proj.{p.offProjects>0?` · ${p.offProjects} off`:""}</div>
          </div>
          <div style={{height:Math.max(16,rowHeight-8),position:"relative",background:"#eef2f7",borderRadius:6,overflow:"visible"}}>
            {ticks.map(t=><span key={t.r} style={{position:"absolute",left:`${t.r*100}%`,top:0,bottom:0,width:1,background:"rgba(100,116,139,.16)"}}/>)}
            {hasDates?<div style={{position:"absolute",left:`${left}%`,width:`${width}%`,minWidth:5,top:5,bottom:5,borderRadius:4,background:isOff(p.health)||p.offProjects>0?"#dc2626":"#2563eb"}}/>:<span className="muted" style={{position:"absolute",inset:0,display:"grid",placeItems:"center",fontSize:8}}>sem datas</span>}
          </div>
        </Link>})}
      </div>
      {min&&max&&<div className="muted" style={{fontSize:9,marginTop:6,display:"flex",justifyContent:"space-between"}}><span>Início {dateBR(min)}</span><span>Fim {dateBR(max)}</span></div>}
    </div>}
  </section>;
}
