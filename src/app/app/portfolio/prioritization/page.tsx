import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {PrioritizationTable} from "@/components/prioritization-table";

export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const {data}=await s.from("portfolio_scores").select("*,projects(name,priority,health)").eq("organization_id",w.id).order("total_score",{ascending:false});
  return <main className="page">
    <span className="eyebrow">Portfólio</span>
    <h1>Priorização</h1>
    <p className="muted">Compare iniciativas por alinhamento estratégico, valor, urgência, compliance, capacidade, risco e esforço. Toque em uma iniciativa para revisar seus critérios.</p>
    <PrioritizationTable rows={(data||[]) as any[]} organizationId={w.id}/>
  </main>
}
