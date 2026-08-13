import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { pct, healthLabel } from "@/lib/format";
import { Layers3, FolderKanban, ListChecks, Users, ShieldAlert, Target, WalletCards, BrainCircuit } from "lucide-react";
export default async function Page(){
  const s=await createClient(); const w=await getCurrentWorkspace();
  if(!w)return <main className="page"><span className="eyebrow">Nexus</span><h1>Seu workspace</h1><section className="card"><p className="muted">Crie um workspace ou entre usando um código.</p><Link href="/onboarding" className="btn btn-primary btn-block">Começar</Link></section></main>;
  const {data:d}=await s.rpc("rpc_dashboard_context",{p_organization_id:w.id,p_group_id:null,p_program_id:null,p_project_id:null});
  const m=(d as any)?.metrics||(d as any)?.summary||d||{};
  const {data:decision}=await s.rpc("rpc_decision_center",{p_organization_id:w.id,p_group_id:null,p_program_id:null,p_project_id:null,p_limit:5});
  return <main className="page">
    <span className="eyebrow">{w.name}</span><h1>Visão geral</h1><p className="muted">Portfólio, execução e pontos de atenção.</p>
    <section className="grid grid-2"><div className="card"><div className="eyebrow">Progresso</div><div className="metric">{pct((m as any).progress||(m as any).overall_progress)}</div></div><div className="card"><div className="eyebrow">Saúde</div><div style={{fontWeight:900,fontSize:19,marginTop:7}}>{healthLabel((m as any).health)}</div></div><div className="card"><div className="eyebrow">Projetos</div><div className="metric">{Number((m as any).projects||(m as any).project_count||0)}</div></div><div className="card"><div className="eyebrow">Atrasadas</div><div className="metric">{Number((m as any).overdue_activities||(m as any).activities_overdue||(m as any).overdue||0)}</div></div></section>
    <div className="section-title"><h2>Acesso rápido</h2></div>
    <section className="quick-grid"><Link className="quick" href="/app/groups"><Layers3/><span>Grupos</span></Link><Link className="quick" href="/app/programs"><FolderKanban/><span>Programas</span></Link><Link className="quick" href="/app/projects"><ListChecks/><span>Projetos</span></Link><Link className="quick" href="/app/people"><Users/><span>Pessoas</span></Link><Link className="quick" href="/app/management?tab=risks"><ShieldAlert/><span>Riscos</span></Link><Link className="quick" href="/app/management?tab=kpis"><Target/><span>KPIs</span></Link><Link className="quick" href="/app/management?tab=budget"><WalletCards/><span>Finanças</span></Link><Link className="quick" href="/app/ai"><BrainCircuit/><span>IA</span></Link></section>
    <div className="section-title"><h2>Centro de decisão</h2><Link href="/app/decision-center" className="chip">Ver tudo</Link></div>
    <section className="card list">{!Array.isArray(decision)||decision.length===0?<div className="empty">Sem alertas críticos.</div>:decision.map((i:any)=><div className="row" key={`${i.item_type}-${i.entity_id}`}><div className="row-main"><div className="row-title">{i.title}</div><div className="row-sub">{i.reason}</div></div><span className={`chip ${i.severity>=90?"danger":i.severity>=70?"warning":""}`}>{i.severity}</span></div>)}</section>
  </main>;
}
