import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {CapacityManager} from "@/components/capacity-manager";

export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const[{data},{data:members},{data:projects}]=await Promise.all([
    s.from("resource_allocations").select("*,profiles(full_name),projects(name),activities(title)").eq("organization_id",w.id).order("start_date"),
    s.rpc("rpc_admin_members",{p_organization_id:w.id}),
    s.from("projects").select("id,name").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name")
  ]);
  const sums=new Map<string,number>();(data||[]).forEach((a:any)=>sums.set(a.user_id,(sums.get(a.user_id)||0)+Number(a.allocation_percent||0)));
  return <main className="page"><span className="eyebrow">Pessoas</span><h1>Capacidade</h1><p className="muted">Alocação de pessoas em projetos e atividades.</p><section className="card list">{!data?.length?<div className="empty">Nenhuma alocação registrada.</div>:data.map((a:any)=><div className="row" key={a.id}><div className="row-main"><div className="row-title">{a.profiles?.full_name||"Pessoa"}</div><div className="row-sub">{a.projects?.name||a.activities?.title||"Contexto"} · {a.allocation_percent}%</div></div><span className={`chip ${(sums.get(a.user_id)||0)>100?"danger":""}`}>{sums.get(a.user_id)||0}% total</span></div>)}</section><div className="section-title"><h2>Planejar</h2></div><CapacityManager organizationId={w.id} members={members||[]} projects={projects||[]}/></main>
}
