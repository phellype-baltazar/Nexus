import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {dateBR,pct} from "@/lib/format";

export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const{data}=await s.from("projects").select("id,name,start_date,due_date,health,progress,priority,programs(name,groups(name))").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("start_date");
  return <main className="page"><span className="eyebrow">Portfólio</span><h1>Roadmap</h1><p className="muted">Visão temporal dos projetos ativos.</p><section className="card list">{!data?.length?<div className="empty">Nenhum projeto no roadmap.</div>:data.map((p:any)=><Link href={`/app/project/${p.id}`} className="row" key={p.id}><div className="row-main"><div className="row-title">{p.name}</div><div className="row-sub">{p.programs?.groups?.name||"Grupo"} › {p.programs?.name||"Programa"} · {dateBR(p.start_date)} → {dateBR(p.due_date)}</div></div><span className="chip">{pct(p.progress)}</span></Link>)}</section></main>
}
