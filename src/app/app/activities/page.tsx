import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {dateBR} from "@/lib/format";
import {CreateActivityForm} from "@/components/create-forms";

export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;const sp=await searchParams;const page=Math.max(1,Number(sp.page||1));const size=50;const from=(page-1)*size,to=from+size-1;
  const[{data,count},{data:projects}]=await Promise.all([
    s.from("activities").select("id,title,status,priority,progress,due_date,projects(name)",{count:"exact"}).eq("organization_id",w.id).is("deleted_at",null).order("due_date",{ascending:true}).range(from,to),
    s.from("projects").select("id,name").eq("organization_id",w.id).is("deleted_at",null).order("name")
  ]);const pages=Math.max(1,Math.ceil((count||0)/size));
  return <main className="page"><span className="eyebrow">Execução</span><h1>Atividades</h1><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginBottom:10}}><span className="muted">{count||0} atividades</span><Link href="/app/search" className="chip">Buscar</Link></div><section className="card list">{!data?.length?<div className="empty">Nenhuma atividade criada.</div>:data.map((a:any)=><Link className="row" href={`/app/activity/${a.id}`} key={a.id}><div className="row-main"><div className="row-title">{a.title}</div><div className="row-sub">{a.projects?.name||"Projeto"} · {a.status} · {dateBR(a.due_date)}</div></div><span className="chip">{Math.round(Number(a.progress||0))}%</span></Link>)}</section><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"12px 0"}}>{page>1?<Link className="btn btn-outline" href={`/app/activities?page=${page-1}`}>Anterior</Link>:<span/>}<span className="muted">{page}/{pages}</span>{page<pages?<Link className="btn btn-outline" href={`/app/activities?page=${page+1}`}>Próxima</Link>:<span/>}</div><CreateActivityForm organizationId={w.id} projects={projects||[]}/></main>;
}
