"use client";

import Link from "next/link";

type Project={id:string;name:string;start_date:string|null;due_date:string|null;progress:number|null;health:string|null;overdue:number;criticalRisks:number};
type Milestone={id:string;project_id:string;name:string;milestone_date:string};

type Props={projects:Project[];milestones:Milestone[]};

function days(a:string,b:string){return Math.max(0,Math.round((new Date(`${b}T12:00:00Z`).getTime()-new Date(`${a}T12:00:00Z`).getTime())/86400000))}
function dateBR(v:string){return new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR")}
function shortDate(v:string){return new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}
function isOff(v:string|null){const x=String(v||"").toLowerCase();return x.includes("off")||x.includes("red")||x.includes("atras")||x.includes("risk")||x.includes("critical")}
function dateAt(start:string,end:string,ratio:number){const a=new Date(`${start}T12:00:00Z`).getTime(),b=new Date(`${end}T12:00:00Z`).getTime();return new Date(a+(b-a)*ratio).toISOString().slice(0,10)}

export function ProgramMacroView({projects,milestones}:Props){
 const dated=projects.filter(p=>p.start_date&&p.due_date) as Array<Project&{start_date:string;due_date:string}>;
 const min=dated.length?dated.reduce((m,p)=>p.start_date<m?p.start_date:m,dated[0].start_date):null;
 const max=dated.length?dated.reduce((m,p)=>p.due_date>m?p.due_date:m,dated[0].due_date):null;
 const span=min&&max?Math.max(1,days(min,max)+1):1;
 const problems=projects.filter(p=>isOff(p.health)||p.overdue>0||p.criticalRisks>0);
 const overdueTotal=projects.reduce((n,p)=>n+p.overdue,0),riskTotal=projects.reduce((n,p)=>n+p.criticalRisks,0),offTotal=projects.filter(p=>isOff(p.health)).length;
 const ticks=min&&max?[0,.25,.5,.75,1].map(r=>({r,label:shortDate(dateAt(min,max,r))})):[];
 return <>
  <section className="card" style={{marginTop:12,overflow:"hidden"}}>
   <div className="eyebrow">Visão integrada do programa</div><h2 style={{margin:"2px 0 4px"}}>Gantt macro</h2><p className="muted" style={{marginTop:0}}>Todos os projetos no mesmo quadro. Losangos = milestones.</p>
   {!dated.length?<div className="empty">Os projetos ainda não possuem datas suficientes para o Gantt macro.</div>:<div style={{width:"100%",overflow:"hidden"}}>
    <div style={{display:"grid",gridTemplateColumns:"36% 64%",gap:8,alignItems:"end",marginBottom:6}}><div className="muted" style={{fontSize:10,fontWeight:800}}>PROJETO</div><div style={{position:"relative",height:28,borderBottom:"1px solid var(--line)"}}>{ticks.map(t=><div key={t.r} style={{position:"absolute",left:`${t.r*100}%`,transform:t.r===0?"none":t.r===1?"translateX(-100%)":"translateX(-50%)",bottom:4,fontSize:9,color:"var(--muted)",whiteSpace:"nowrap"}}>{t.label}</div>)}</div></div>
    {dated.map(p=>{const left=days(min!,p.start_date)/span*100;const width=Math.max(2,(days(p.start_date,p.due_date)+1)/span*100);const pm=milestones.filter(m=>m.project_id===p.id&&m.milestone_date>=min!&&m.milestone_date<=max!);return <Link href={`/app/project/${p.id}`} key={p.id} style={{display:"grid",gridTemplateColumns:"36% 64%",gap:8,alignItems:"center",padding:"7px 0",borderTop:"1px solid var(--line)",textDecoration:"none",color:"inherit"}}><div style={{minWidth:0}}><div style={{fontWeight:800,fontSize:11,lineHeight:1.15,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{p.name}</div><div className="muted" style={{fontSize:9,marginTop:2}}>{Math.round(Number(p.progress||0))}% · {shortDate(p.start_date)}–{shortDate(p.due_date)}</div></div><div style={{height:30,position:"relative",background:"#eef2f7",borderRadius:7,overflow:"visible"}}>{ticks.map(t=><span key={t.r} style={{position:"absolute",left:`${t.r*100}%`,top:0,bottom:0,width:1,background:"rgba(100,116,139,.14)"}}/>)}<div style={{position:"absolute",left:`${left}%`,width:`${width}%`,minWidth:6,top:7,bottom:7,borderRadius:5,background:isOff(p.health)?"#dc2626":"#2563eb"}}/>{pm.map(m=>{const ml=days(min!,m.milestone_date)/span*100;return <span key={m.id} title={`${m.name} · ${dateBR(m.milestone_date)}`} style={{position:"absolute",left:`calc(${ml}% - 5px)`,top:10,width:10,height:10,background:"#111827",transform:"rotate(45deg)",border:"2px solid white",boxSizing:"border-box"}}/>})}</div></Link>})}
    <div className="muted" style={{fontSize:10,marginTop:8,display:"flex",justifyContent:"space-between"}}><span>Início: {dateBR(min!)}</span><span>Fim: {dateBR(max!)}</span></div>
   </div>}
  </section>

  <section className="card" style={{marginTop:12}}>
   <div className="eyebrow">Gestão por exceção</div><h2 style={{margin:"2px 0 8px"}}>Problemas do programa</h2>
   <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8,marginBottom:12}}><div className="card" style={{margin:0,padding:12,textAlign:"center",background:offTotal?"#fff1f2":"#f8fafc"}}><div className="eyebrow">Off tracking</div><strong style={{fontSize:24}}>{offTotal}</strong></div><div className="card" style={{margin:0,padding:12,textAlign:"center",background:overdueTotal?"#fff7ed":"#f8fafc"}}><div className="eyebrow">Ações atrasadas</div><strong style={{fontSize:24}}>{overdueTotal}</strong></div><div className="card" style={{margin:0,padding:12,textAlign:"center",background:riskTotal?"#fff1f2":"#f8fafc"}}><div className="eyebrow">Riscos críticos</div><strong style={{fontSize:24}}>{riskTotal}</strong></div></div>
   {!problems.length?<div className="empty">Nenhum problema relevante identificado no programa.</div>:problems.map(p=><Link className="row" href={`/app/project/${p.id}`} key={p.id}><div className="row-main"><div className="row-title">{p.name}</div><div className="row-sub">{isOff(p.health)?"Off tracking · ":""}{p.overdue} ações atrasadas · {p.criticalRisks} riscos críticos</div></div><span className="row-arrow">›</span></Link>)}
  </section>
 </>;
}
