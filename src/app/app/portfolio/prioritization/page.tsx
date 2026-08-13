import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {PrioritizationManager} from "@/components/prioritization-manager";

export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const[{data},{data:projects}]=await Promise.all([
    s.from("portfolio_scores").select("*,projects(name,priority,health)").eq("organization_id",w.id).order("total_score",{ascending:false}),
    s.from("projects").select("id,name").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name")
  ]);
  return <main className="page"><span className="eyebrow">Portfólio</span><h1>Priorização</h1><p className="muted">Score considera alinhamento estratégico, valor, urgência, compliance, capacidade, risco e esforço.</p><section className="card list">{!data?.length?<div className="empty">Nenhum projeto pontuado ainda.</div>:data.map((x:any)=><Link href={`/app/project/${x.project_id}`} className="row" key={x.id}><div className="row-main"><div className="row-title">{x.projects?.name||"Projeto"}</div><div className="row-sub">Alinhamento {x.strategic_alignment} · Valor {x.expected_value} · Urgência {x.urgency}</div></div><span className="chip">{Number(x.total_score).toFixed(1)}</span></Link>)}</section><div className="section-title"><h2>Avaliar</h2></div><PrioritizationManager organizationId={w.id} projects={projects||[]}/></main>
}
