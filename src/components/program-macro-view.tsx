"use client";

import Link from "next/link";

type Project={id:string;name:string;start_date:string|null;due_date:string|null;progress:number|null;health:string|null;overdue:number;criticalRisks:number};
type Milestone={id:string;project_id:string;name:string;milestone_date:string};
type Props={projects:Project[];milestones:Milestone[]};

function days(a:string,b:string){return Math.max(0,Math.round((new Date(`${b}T12:00:00Z`).getTime()-new Date(`${a}T12:00:00Z`).getTime())/86400000))}
function dateBR(v:string){return new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR")}
function shortDate(v:string){return new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}
function monthLabel(v:string){return new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR",{month:"short",year:"2-digit"}).replace(" de ","/").replace(".","")}
function isOff(v:string|null){const x=String(v||"").toLowerCase();return x.includes("off")||x.includes("red")||x.includes("atras")||x.includes("risk")||x.includes("critical")}
function dateAt(start:string,end:string,ratio:number){const a=new Date(`${start}T12:00:00Z`).getTime(),b=new Date(`${end}T12:00:00Z`).getTime();return new Date(a+(b-a)*ratio).toISOString().slice(0,10)}

export function ProgramMacroView({projects,milestones}:Props){
 const dated=projects.filter(p=>p.start_date&&p.due_date) as Array<Project&{start_date:string;due_date:string}>;
 const min=dated.length?dated.reduce((m,p)=>p.start_date<m?p.start_date:m,dated[0].start_date):null;
 const max=dated.length?dated.reduce((m,p)=>p.due_date>m?p.due_date:m,dated[0].due_date):null;
 const span=min&&max?Math.max(1,days(min,max)+1):1;
 const problems=projects.filter(p=>isOff(p.health)||p.overdue>0||p.criticalRisks>0);
 const overdueTotal=projects.reduce((n,p)=>n+p.overdue,0),riskTotal=projects.reduce((n,p)=>n+p.criticalRisks,0),offTotal=projects.filter(p=>isOff(p.health)).length;

 // The macro chart must show the entire program in one visual block, without horizontal or internal vertical scrolling.
 const chartBodyHeight=260;
 const rowHeight=projects.length?Math.max(11,Math.min(30,Math.floor(chartBodyHeight/projects.length))):30;
 const nameSize=rowHeight<=13?7.5:rowHeight<=17?8.5:rowHeight<=22?9.5:10.5;
 const barInset=rowHeight<=14?3:4;
 const tickCount=5;
 const ticks=min&&max?Array.from({length:tickCount},(_,i)=>{const r=i/(tickCount-1);const d=dateAt(min,max,r);return {r,date:d,label:span>90?monthLabel(d):shortDate(d)}}):[];
 const today=new Date().toISOString().slice(0,10);
 const todayInside=!!(min&&max&&today>=min&&today<=max);
 const todayLeft=todayInside?days(min!,today)/span*100:0;

 return <>
  <section className="card" style={{marginTop:12,overflow:"hidden",paddingBottom:14}}>
   <div className="eyebrow">Visão integrada do programa</div>
   <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:8}}>
    <h2 style={{margin:"2px 0 3px"}}>Gantt macro</h2>
    <span className="muted" style={{fontSize:10,whiteSpace:"nowrap"}}>{projects.length} projeto{projects.length===1?"":"s"}</span>
   </div>
   <p className="muted" style={{margin:"0 0 7px",fontSize:11}}>Visão completa do programa · ◆ milestone</p>

   {!projects.length?<div className="empty">Nenhum projeto neste programa.</div>:<div style={{width:"100%",overflow:"hidden"}}>
    <div style={{display:"grid",gridTemplateColumns:"34% 66%",gap:5,alignItems:"end",marginBottom:2}}>
     <div className="muted" style={{fontSize:8,fontWeight:900,letterSpacing:".06em"}}>PROJETOS</div>
     <div style={{position:"relative",height:34,borderBottom:"1px solid var(--line)"}}>
      <div className="muted" style={{position:"absolute",top:0,left:0,fontSize:7.5,fontWeight:800}}>TEMPO</div>
      {ticks.map(t=><div key={t.r} style={{position:"absolute",left:`${t.r*100}%`,transform:t.r===0?"none":t.r===1?"translateX(-100%)":"translateX(-50%)",bottom:4,fontSize:7.8,fontWeight:700,color:"var(--muted)",whiteSpace:"nowrap"}}>{t.label}</div>)}
     </div>
    </div>

    <div style={{height:chartBodyHeight,display:"grid",gridTemplateRows:`repeat(${Math.max(1,projects.length)}, minmax(0,1fr))`,overflow:"hidden"}}>
     {projects.map((p,index)=>{const hasDates=!!(p.start_date&&p.due_date&&min&&max);const left=hasDates?days(min!,p.start_date!)/span*100:0;const width=hasDates?Math.max(1.5,(days(p.start_date!,p.due_date!)+1)/span*100):0;const pm=hasDates?milestones.filter(m=>m.project_id===p.id&&m.milestone_date>=min!&&m.milestone_date<=max!):[];return <Link href={`/app/project/${p.id}`} key={p.id} style={{display:"grid",gridTemplateColumns:"34% 66%",gap:5,alignItems:"center",minHeight:0,borderTop:index===0?"1px solid var(--line)":"0",borderBottom:"1px solid var(--line)",textDecoration:"none",color:"inherit"}}>
      <div style={{minWidth:0,paddingRight:2}}>
       <div style={{fontWeight:800,fontSize:nameSize,lineHeight:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
      </div>
      <div style={{height:"72%",minHeight:8,maxHeight:22,position:"relative",background:"#eef2f7",borderRadius:4,overflow:"visible"}}>
       {ticks.map(t=><span key={t.r} style={{position:"absolute",left:`${t.r*100}%`,top:0,bottom:0,width:1,background:"rgba(100,116,139,.20)"}}/>)}
       {todayInside&&<span title="Hoje" style={{position:"absolute",left:`${todayLeft}%`,top:-2,bottom:-2,width:1.5,background:"#f97316",zIndex:4}}/>}
       {hasDates?<><div style={{position:"absolute",left:`${left}%`,width:`${width}%`,minWidth:4,top:barInset,bottom:barInset,borderRadius:3,background:isOff(p.health)?"#dc2626":"#2563eb"}}/>{pm.map(m=>{const ml=days(min!,m.milestone_date)/span*100;return <span key={m.id} title={`${m.name} · ${dateBR(m.milestone_date)}`} style={{position:"absolute",left:`calc(${ml}% - 3.5px)`,top:"50%",width:7,height:7,background:"#111827",transform:"translateY(-50%) rotate(45deg)",border:"1px solid white",boxSizing:"border-box",zIndex:5}}/>})}</>:<span className="muted" style={{position:"absolute",inset:0,display:"grid",placeItems:"center",fontSize:7}}>sem datas</span>}
      </div>
     </Link>})}
    </div>

    {min&&max&&<div style={{display:"grid",gridTemplateColumns:"34% 66%",gap:5,marginTop:5}}><div/><div className="muted" style={{fontSize:8,display:"flex",justifyContent:"space-between"}}><span>{dateBR(min)}</span>{todayInside&&<span style={{color:"#f97316",fontWeight:800}}>│ Hoje</span>}<span>{dateBR(max)}</span></div></div>}
   </div>}
  </section>

  <section className="card" style={{marginTop:12}}>
   <div className="eyebrow">Gestão por exceção</div><h2 style={{margin:"2px 0 8px"}}>Problemas do programa</h2>
   <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8,marginBottom:12}}><div className="card" style={{margin:0,padding:12,textAlign:"center",background:offTotal?"#fff1f2":"#f8fafc"}}><div className="eyebrow">Off tracking</div><strong style={{fontSize:24}}>{offTotal}</strong></div><div className="card" style={{margin:0,padding:12,textAlign:"center",background:overdueTotal?"#fff7ed":"#f8fafc"}}><div className="eyebrow">Ações atrasadas</div><strong style={{fontSize:24}}>{overdueTotal}</strong></div><div className="card" style={{margin:0,padding:12,textAlign:"center",background:riskTotal?"#fff1f2":"#f8fafc"}}><div className="eyebrow">Riscos críticos</div><strong style={{fontSize:24}}>{riskTotal}</strong></div></div>
   {!problems.length?<div className="empty">Nenhum problema relevante identificado no programa.</div>:problems.map(p=><Link className="row" href={`/app/project/${p.id}`} key={p.id}><div className="row-main"><div className="row-title">{p.name}</div><div className="row-sub">{isOff(p.health)?"Off tracking · ":""}{p.overdue} ações atrasadas · {p.criticalRisks} riscos críticos</div></div><span className="row-arrow">›</span></Link>)}
  </section>
 </>;
}
