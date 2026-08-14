import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { pct, healthLabel } from "@/lib/format";
import { Layers3, FolderKanban, ListChecks, Users, ShieldAlert, Target, WalletCards, BrainCircuit } from "lucide-react";

function numberValue(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isOpenStatus(status: unknown) {
  const value = String(status || "").toLowerCase().trim();
  return !["done", "completed", "closed", "cancelled", "canceled", "resolved"].includes(value);
}

function portfolioHealth(projects: any[], overdue: number) {
  const health = projects.map((project) => String(project.health || ""));
  if (health.includes("off_track")) return "off_track";
  if (health.includes("attention") || overdue > 0) return "attention";
  if (health.includes("on_track")) return "on_track";
  return overdue > 0 ? "attention" : "on_track";
}

export default async function Page() {
  const s = await createClient();
  const w = await getCurrentWorkspace();

  if (!w) {
    return <main className="page"><span className="eyebrow">Nexus</span><h1>Seu workspace</h1><section className="card"><p className="muted">Crie um workspace ou entre usando um código.</p><Link href="/onboarding" className="btn btn-primary btn-block">Começar</Link></section></main>;
  }

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: groupsData },
    { data: programsData },
    { data: projectsData },
    { data: activitiesData },
    { data: decisionData },
  ] = await Promise.all([
    s.from("groups").select("id,name,description,progress,health").eq("organization_id", w.id).is("deleted_at", null).is("archived_at", null).order("name"),
    s.from("programs").select("id,name,group_id,progress,health").eq("organization_id", w.id).is("deleted_at", null).is("archived_at", null),
    s.from("projects").select("id,name,program_id,progress,health").eq("organization_id", w.id).is("deleted_at", null).is("archived_at", null),
    s.from("activities").select("id,due_date,status,progress").eq("organization_id", w.id).is("deleted_at", null),
    s.rpc("rpc_decision_center", { p_organization_id: w.id, p_group_id: null, p_program_id: null, p_project_id: null, p_limit: 5 }),
  ]);

  const groups = Array.isArray(groupsData) ? groupsData : [];
  const programs = Array.isArray(programsData) ? programsData : [];
  const projects = Array.isArray(projectsData) ? projectsData : [];
  const activities = Array.isArray(activitiesData) ? activitiesData : [];
  const decision = Array.isArray(decisionData) ? decisionData : [];

  const overdue = activities.filter((activity: any) => {
    const due = String(activity.due_date || "").slice(0, 10);
    return Boolean(due) && due < today && isOpenStatus(activity.status);
  }).length;

  const progressSource = projects.length
    ? projects.map((project: any) => numberValue(project.progress))
    : programs.length
      ? programs.map((program: any) => numberValue(program.progress))
      : groups.map((group: any) => numberValue(group.progress));

  const progress = Math.round(average(progressSource));
  const health = portfolioHealth(projects, overdue);

  const programsByGroup = new Map<string, number>();
  programs.forEach((program: any) => {
    if (!program.group_id) return;
    programsByGroup.set(program.group_id, (programsByGroup.get(program.group_id) || 0) + 1);
  });

  const programToGroup = new Map<string, string>();
  programs.forEach((program: any) => {
    if (program.id && program.group_id) programToGroup.set(program.id, program.group_id);
  });

  const projectsByGroup = new Map<string, number>();
  projects.forEach((project: any) => {
    const groupId = programToGroup.get(project.program_id);
    if (!groupId) return;
    projectsByGroup.set(groupId, (projectsByGroup.get(groupId) || 0) + 1);
  });

  return <main className="page">
    <span className="eyebrow">{w.name}</span><h1>Visão geral</h1><p className="muted">Portfólio, execução e pontos de atenção.</p>

    <section className="grid grid-2">
      <div className="card"><div className="eyebrow">Progresso</div><div className="metric">{pct(progress)}</div></div>
      <div className="card"><div className="eyebrow">Saúde</div><div style={{fontWeight:900,fontSize:19,marginTop:7}}>{healthLabel(health)}</div></div>
      <div className="card"><div className="eyebrow">Projetos</div><div className="metric">{projects.length}</div></div>
      <div className="card"><div className="eyebrow">Atrasadas</div><div className="metric">{overdue}</div></div>
    </section>

    <div className="section-title"><h2>Acesso rápido</h2></div>
    <section className="quick-grid"><Link className="quick" href="/app/groups"><Layers3/><span>Direções</span></Link><Link className="quick" href="/app/programs"><FolderKanban/><span>Programas</span></Link><Link className="quick" href="/app/projects"><ListChecks/><span>Projetos</span></Link><Link className="quick" href="/app/people"><Users/><span>Pessoas</span></Link><Link className="quick" href="/app/management?tab=risks"><ShieldAlert/><span>Riscos</span></Link><Link className="quick" href="/app/management?tab=kpis"><Target/><span>KPIs</span></Link><Link className="quick" href="/app/management?tab=budget"><WalletCards/><span>Finanças</span></Link><Link className="quick" href="/app/ai"><BrainCircuit/><span>IA</span></Link></section>

    <div className="section-title"><h2>Direções</h2><Link href="/app/groups" className="chip">Ver tudo</Link></div>
    <section className="card list">{groups.length===0?<div className="empty">Nenhuma direção criada.</div>:groups.map((group:any)=><Link className="row" href={`/app/group/${group.id}`} key={group.id}><div className="row-main"><div className="row-title">{group.name}</div><div className="row-sub">{programsByGroup.get(group.id)||0} programas · {projectsByGroup.get(group.id)||0} projetos · {pct(group.progress)}</div></div><span className={`chip ${group.health==="off_track"?"danger":group.health==="attention"?"warning":"success"}`}>{healthLabel(group.health)}</span></Link>)}</section>

    <div className="section-title"><h2>Centro de decisão</h2><Link href="/app/decision-center" className="chip">Ver tudo</Link></div>
    <section className="card list">{decision.length===0?<div className="empty">Sem alertas críticos.</div>:decision.map((i:any)=><div className="row" key={`${i.item_type}-${i.entity_id}`}><div className="row-main"><div className="row-title">{i.title}</div><div className="row-sub">{i.reason}</div></div><span className={`chip ${i.severity>=90?"danger":i.severity>=70?"warning":""}`}>{i.severity}</span></div>)}</section>
  </main>;
}
