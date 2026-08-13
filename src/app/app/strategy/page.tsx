import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {StrategyManager} from "@/components/strategy-manager";
import {pct,dateBR} from "@/lib/format";
export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const[{data:o},{data:g}]=await Promise.all([
    s.from("strategic_objectives").select("*,groups(name)").eq("organization_id",w.id).is("deleted_at",null).order("name"),
    s.from("groups").select("id,name").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null)
  ]);
  return <main className="page"><span className="eyebrow">Estratégia</span><h1>Objetivos estratégicos</h1><section className="card list">{!o?.length?<div className="empty">Nenhum objetivo estratégico.</div>:o.map((x:any)=><div className="row" key={x.id}><div className="row-main"><div className="row-title">{x.name}</div><div className="row-sub">{x.groups?.name||"Empresa"} · {dateBR(x.start_date)} → {dateBR(x.due_date)}</div></div><span className="chip">{pct(x.progress)}</span></div>)}</section><div className="section-title"><h2>Adicionar</h2></div><StrategyManager organizationId={w.id} groups={g||[]}/></main>
}
