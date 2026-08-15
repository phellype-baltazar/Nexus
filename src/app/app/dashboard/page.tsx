import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { pct, healthLabel } from "@/lib/format";

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

function portfolioStatus(projects: any[], overdue: number) {
  const statuses = projects.map((project) => String(project.health || ""));
  if (statuses.includes("off_track")) return "off_track";
  if (statuses.includes("attention") || overdue > 0) return "attention";
  if (statuses.includes("on_track")) return "on_track";
  return overdue > 0 ? "attention" : "on_track";
}

function directionStatus(health: unknown, progress: number, overdue: number, criticalRisks: number) {
  const current = String(health || "");
  if (current === "off_track" || current === "attention" || current === "on_track") return current;
  if (criticalRisks > 0 || overdue >= 3 || progress < 45) return "off_track";
  if (overdue > 0 || progress < 70) return "attention";
  return "on_track";
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
    { data: risksData },
  ] = await Promise.all([
    s.from("groups").select("id,name,description,progress,health").eq("organization_id", w.id).is("deleted_at", null).is("archived_at", null).order("name"),
    s.from("programs").select("id,name,group_id,progress,health").eq("organization_id", w.id).is("deleted_at", null).is("archived_at", null),
    s.from("projects").select("id,name,program_id,progress,health").eq("organization_id", w.id).is("deleted_at", null).is("archived_at", null),
    s.from("activities").select("id,project_id,due_date,status,progress").eq("organization_id", w.id).is("deleted_at", null),
    s.from("risks").select("id,group_id,program_id,project_id,score,status").eq("organization_id", w.id).is("deleted_at", null),
  ]);

  const groups = Array.isArray(groupsData) ? groupsData : [];
  const programs = Array.isArray(programsData) ? programsData : [];
  const projects = Array.isArray(projectsData) ? projectsData : [];
  const activities = Array.isArray(activitiesData) ? activitiesData : [];
  const risks = Array.isArray(risksData) ? risksData : [];

  const overdueActivities = activities.filter((activity: any) => {
    const due = String(activity.due_date || "").slice(0, 10);
    return Boolean(due) && due < today && isOpenStatus(activity.status);
  });
  const overdue = overdueActivities.length;

  const progressSource = projects.length
    ? projects.map((project: any) => numberValue(project.progress))
    : programs.length
      ? programs.map((program: any) => numberValue(program.progress))
      : groups.map((group: any) => numberValue(group.progress));

  const progress = Math.round(average(progressSource));
  const overallStatus = portfolioStatus(projects, overdue);

  const programsByGroup = new Map<string, any[]>();
  programs.forEach((program: any) => {
    if (!program.group_id) return;
    programsByGroup.set(program.group_id, [...(programsByGroup.get(program.group_id) || []), program]);
  });

  const programToGroup = new Map<string, string>();
  programs.forEach((program: any) => {
    if (program.id && program.group_id) programToGroup.set(program.id, program.group_id);
  });

  const projectsByGroup = new Map<string, any[]>();
  const projectToGroup = new Map<string, string>();
  projects.forEach((project: any) => {
    const groupId = programToGroup.get(project.program_id);
    if (!groupId) return;
    projectToGroup.set(project.id, groupId);
    projectsByGroup.set(groupId, [...(projectsByGroup.get(groupId) || []), project]);
  });

  const overdueByGroup = new Map<string, number>();
  overdueActivities.forEach((activity: any) => {
    const groupId = projectToGroup.get(activity.project_id);
    if (!groupId) return;
    overdueByGroup.set(groupId, (overdueByGroup.get(groupId) || 0) + 1);
  });

  const criticalRisksByGroup = new Map<string, number>();
  risks.forEach((risk: any) => {
    if (!isOpenStatus(risk.status) || numberValue(risk.score) < 80) return;
    const groupId = risk.group_id || programToGroup.get(risk.program_id) || projectToGroup.get(risk.project_id);
    if (!groupId) return;
    criticalRisksByGroup.set(groupId, (criticalRisksByGroup.get(groupId) || 0) + 1);
  });

  const summaryGridStyle = {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 14,
    overflow: "hidden",
  };

  const summaryCardStyle = {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    height: 122,
    marginTop: 0,
    padding: 18,
    display: "grid",
    gridTemplateRows: "38px 1fr",
    alignContent: "start",
    boxSizing: "border-box" as const,
    overflow: "hidden",
  };

  const summaryLabelStyle = {
    minWidth: 0,
    margin: 0,
    lineHeight: 1.18,
    alignSelf: "start",
    overflowWrap: "anywhere" as const,
  };

  const summaryValueStyle = {
    minWidth: 0,
    margin: 0,
    alignSelf: "start",
    fontSize: 31,
    lineHeight: 1,
    fontWeight: 900,
    whiteSpace: "nowrap" as const,
  };

  return <main className="page" style={{width:"100%",maxWidth:"100%",minWidth:0,overflowX:"hidden"}}>
    <h1 style={{marginBottom:0}}>Visão Geral</h1>

    <section style={summaryGridStyle}>
      <div className="card" style={summaryCardStyle}>
        <div className="eyebrow" style={summaryLabelStyle}>Progresso consolidado</div>
        <div style={summaryValueStyle}>{pct(progress)}</div>
      </div>
      <div className="card" style={summaryCardStyle}>
        <div className="eyebrow" style={summaryLabelStyle}>Status geral</div>
        <div style={{...summaryValueStyle,fontSize:27}}>{healthLabel(overallStatus)}</div>
      </div>
      <div className="card" style={summaryCardStyle}>
        <div className="eyebrow" style={summaryLabelStyle}>Projetos ativos</div>
        <div style={summaryValueStyle}>{projects.length}</div>
      </div>
      <div className="card" style={summaryCardStyle}>
        <div className="eyebrow" style={summaryLabelStyle}>Atividades atrasadas</div>
        <div style={summaryValueStyle}>{overdue}</div>
      </div>
    </section>

    <div className="section-title" style={{minWidth:0,width:"100%"}}><h2>Resumo das Direções</h2><Link href="/app/groups" className="chip" style={{flexShrink:0}}>Ver todas</Link></div>

    <section className="form" style={{width:"100%",maxWidth:"100%",minWidth:0,overflow:"hidden"}}>
      {groups.length===0 ? <div className="card empty" style={{marginTop:0,minWidth:0,maxWidth:"100%"}}>Nenhuma direção criada.</div> : groups.map((group:any) => {
        const directionPrograms = programsByGroup.get(group.id) || [];
        const directionProjects = projectsByGroup.get(group.id) || [];
        const directionProgress = directionProjects.length
          ? Math.round(average(directionProjects.map((project:any) => numberValue(project.progress))))
          : directionPrograms.length
            ? Math.round(average(directionPrograms.map((program:any) => numberValue(program.progress))))
            : Math.round(numberValue(group.progress));
        const directionOverdue = overdueByGroup.get(group.id) || 0;
        const criticalRisks = criticalRisksByGroup.get(group.id) || 0;
        const status = directionStatus(group.health, directionProgress, directionOverdue, criticalRisks);

        return <Link href={`/app/group/${group.id}`} className="card" key={group.id} style={{display:"block",width:"100%",maxWidth:"100%",minWidth:0,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,minWidth:0}}>
            <div style={{minWidth:0,flex:1,overflow:"hidden"}}>
              <div style={{fontWeight:900,fontSize:18,lineHeight:1.2,overflowWrap:"anywhere"}}>{group.name}</div>
              <div className="row-sub" style={{marginTop:6,overflowWrap:"anywhere"}}>{directionPrograms.length} programas · {directionProjects.length} projetos</div>
            </div>
            <span className={`chip ${status==="off_track"?"danger":status==="attention"?"warning":"success"}`} style={{flexShrink:0}}>{healthLabel(status)}</span>
          </div>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginTop:16,minWidth:0}}>
            <span className="eyebrow">Progresso</span>
            <strong style={{flexShrink:0}}>{pct(directionProgress)}</strong>
          </div>
          <div style={{width:"100%",maxWidth:"100%",height:10,borderRadius:999,background:"var(--soft)",overflow:"hidden",marginTop:7}}>
            <div style={{height:"100%",width:`${Math.max(0,Math.min(100,directionProgress))}%`,maxWidth:"100%",background:"var(--primary)",borderRadius:999}} />
          </div>

          <div className="row-sub" style={{marginTop:12,overflowWrap:"anywhere"}}>
            {directionOverdue} atividades atrasadas · {criticalRisks} riscos críticos
          </div>
        </Link>;
      })}
    </section>
  </main>;
}
