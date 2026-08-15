import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {pct,healthLabel} from "@/lib/format";

export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const [{data:overview},{data:decisions}]=await Promise.all([
    s.rpc("rpc_executive_overview",{p_organization_id:w.id}),
    s.rpc("rpc_executive_decisions",{p_organization_id:w.id,p_limit:8})
  ]);
  const o=(overview||{}) as any;const top=Array.isArray(o.top_projects)?o.top_projects:[];
  return <main className="page">
    <span className="eyebrow">Liderança</span><h1>Visão Executiva</h1><p className="muted">Exceções, tendência e pontos que exigem decisão — sem entrar na operação.</p>
    <section className="grid grid-2">
      <div className="card" style={{marginTop:0,textAlign:"center"}}><div className="eyebrow">Progresso</div><strong style={{fontSize:28}}>{pct(o.progress||0)}</strong></div>
      <div className="card" style={{marginTop:0,textAlign:"center"}}><div className="eyebrow">Projetos</div><strong style={{fontSize:28}}>{o.projects||0}</strong></div>
      <div className="card" style={{marginTop:0,textAlign:"center"}}><div className="eyebrow">Fora do rumo</div><strong style={{fontSize:28}}>{o.off_track||0}</strong></div>
      <div className="card" style={{marginTop:0,textAlign:"center"}}><div className="eyebrow">Riscos de workload</div><strong style={{fontSize:28}}>{o.workload_risks||0}</strong></div>
    </section>

    <div className="section-title"><h2>Onde agir agora</h2><Link className="chip" href="/app/decision-center">Ver decisões</Link></div>
    <section className="card list">{!decisions?.length?<div className="empty">Nenhuma exceção relevante.</div>:decisions.map((d:any,i:number)=><Link className="row" href={d.path||"#"} key={`${d.category}-${d.entity_id}-${i}`}><div className="row-main"><div className="row-title">{d.title}</div><div className="row-sub">{d.category} · {d.reason}</div><div className="row-sub"><strong>Ação:</strong> {d.recommended_action}</div></div><span className={`chip ${d.severity>=90?"danger":d.severity>=70?"warning":""}`}>{d.severity}</span></Link>)}</section>

    <div className="section-title"><h2>Projetos com maior atenção</h2></div>
    <section className="card list">{!top.length?<div className="empty">Sem projetos ativos.</div>:top.map((p:any)=><Link className="row" href={`/app/project/${p.id}`} key={p.id}><div className="row-main"><div className="row-title">{p.name}</div><div className="row-sub">{healthLabel(p.health)} · {p.progress}% · {p.overdue} atrasos · {p.critical_risks} riscos críticos</div>{Math.abs(Number(p.budget_variance||0))>0&&<div className="row-sub">Variação forecast/orçamento: {Number(p.budget_variance).toLocaleString("pt-BR",{maximumFractionDigits:1})}%</div>}</div><span className={`chip ${p.severity>=90?"danger":p.severity>=60?"warning":""}`}>{p.severity}</span></Link>)}</section>
  </main>;
}
