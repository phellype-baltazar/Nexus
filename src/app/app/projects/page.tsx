import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {CreateProjectForm} from "@/components/create-forms";

function dateYear(value:unknown){const match=String(value||"").match(/^(\d{4})/);return match?Number(match[1]):null;}
function inYear(item:any,year:number,currentYear:number){
  const start=dateYear(item.start_date), end=dateYear(item.due_date);
  if(start===null&&end===null)return year===currentYear;
  const first=start??end??year, last=end??start??year;
  return first<=year&&last>=year;
}
function isCompleted(status:unknown){return ["done","completed","closed"].includes(String(status||"").toLowerCase());}

export default async function Page({searchParams}:{searchParams:Promise<{page?:string;year?:string}>}){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const sp=await searchParams;const currentYear=new Date().getFullYear();const selectedYear=Number(sp.year||currentYear)||currentYear;const page=Math.max(1,Number(sp.page||1));const size=30;

  const[{data:allProjects},{data:programs}]=await Promise.all([
    s.from("projects").select("id,name,description,progress,health,priority,status,start_date,due_date,programs(name)").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name"),
    s.from("programs").select("id,name").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name")
  ]);

  const projects=allProjects||[];
  const years=Array.from(new Set([currentYear,...projects.flatMap((p:any)=>[dateYear(p.start_date),dateYear(p.due_date)]).filter((y):y is number=>Boolean(y))])).sort((a,b)=>b-a);
  const filtered=projects.filter((p:any)=>inYear(p,selectedYear,currentYear));
  const pages=Math.max(1,Math.ceil(filtered.length/size));const safePage=Math.min(page,pages);const from=(safePage-1)*size;const data=filtered.slice(from,from+size);
  const completedCount=filtered.filter((p:any)=>isCompleted(p.status)||Number(p.progress||0)>=100).length;
  const activeCount=Math.max(0,filtered.length-completedCount);

  return <main className="page">
    <span className="eyebrow">Execução</span><h1>Projetos</h1>
    <p className="muted">Ativos e concluídos do ano atual. Histórico somente quando você selecionar outro ano.</p>
    <div className="tabs" style={{margin:"12px 0 16px"}}>{years.map(y=><Link key={y} className={`tab ${selectedYear===y?"active":""}`} href={`/app/projects?year=${y}`}>{y===currentYear?`${y} · Atual`:y}</Link>)}</div>
    <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginBottom:10}}><span className="muted">{activeCount} ativos · {completedCount} concluídos</span><Link href="/app/search" className="chip">Buscar</Link></div>
    <section className="card list">{!data.length?<div className="empty">Nenhum projeto neste ano.</div>:data.map((p:any)=><Link className="row" href={`/app/project/${p.id}`} key={p.id}><div className="row-main"><div className="row-title">{p.name}</div><div className="row-sub">{p.programs?.name||"Sem programa"} · {Math.round(Number(p.progress||0))}% · {isCompleted(p.status)||Number(p.progress||0)>=100?"Concluído":"Ativo"}</div></div><span className="row-arrow">›</span></Link>)}</section>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"12px 0"}}>{safePage>1?<Link className="btn btn-outline" href={`/app/projects?year=${selectedYear}&page=${safePage-1}`}>Anterior</Link>:<span/>}<span className="muted">{safePage}/{pages}</span>{safePage<pages?<Link className="btn btn-outline" href={`/app/projects?year=${selectedYear}&page=${safePage+1}`}>Próxima</Link>:<span/>}</div>
    <CreateProjectForm organizationId={w.id} programs={programs||[]}/>
  </main>;
}
