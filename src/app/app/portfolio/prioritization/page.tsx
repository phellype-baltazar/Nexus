import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {PrioritizationManager} from "@/components/prioritization-manager";
import {PrioritizationTable} from "@/components/prioritization-table";

export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const[{data},{data:projects}]=await Promise.all([
    s.from("portfolio_scores").select("*,projects(name,priority,health)").eq("organization_id",w.id).order("total_score",{ascending:false}),
    s.from("projects").select("id,name").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name")
  ]);
  return <main className="page">
    <span className="eyebrow">Portfólio</span>
    <h1>Priorização</h1>
    <p className="muted">Compare iniciativas por alinhamento estratégico, valor, urgência, compliance, capacidade, risco e esforço. As cores facilitam a leitura e o score consolida a prioridade.</p>
    <PrioritizationTable rows={(data||[]) as any[]}/>
    <div className="section-title"><h2>Avaliar ou revisar</h2></div>
    <PrioritizationManager organizationId={w.id} projects={projects||[]}/>
  </main>
}
