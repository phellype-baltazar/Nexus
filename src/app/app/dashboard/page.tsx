import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { pct, healthLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function numberValue(value: unknown) { const n = Number(value ?? 0); return Number.isFinite(n) ? n : 0; }
function average(values: number[]) { if (!values.length) return 0; return values.reduce((sum, value) => sum + value, 0) / values.length; }
function isOpenStatus(status: unknown) { const value = String(status || "").toLowerCase().trim(); return !["done", "completed", "closed", "cancelled", "canceled", "resolved"].includes(value); }
function portfolioStatus(projects: any[], overdue: number) { const statuses = projects.map((project) => String(project.health || "")); if (statuses.includes("off_track")) return "off_track"; if (statuses.includes("attention") || overdue > 0) return "attention"; if (statuses.includes("on_track")) return "on_track"; return overdue > 0 ? "attention" : "on_track"; }
function directionStatus(health: unknown, progress: number, overdue: number, criticalRisks: number) { const current = String(health || ""); if (current === "off_track" || current === "attention" || current === "on_track") return current; if (criticalRisks > 0 || overdue >= 3 || progress < 45) return "off_track"; if (overdue > 0 || progress < 70) return "attention"; return "on_track"; }
function statusTone(status:string){ if(status==="off_track")return {background:"#fff1f2",borderColor:"#fecdd3",color:"#b91c1c"}; if(status==="attention")return {background:"#fff7ed",borderColor:"#fed7aa",color:"#c2410c"}; return {background:"#ecfdf5",borderColor:"#a7f3d0",color:"#047857"}; }

export default async function Page() {
  const s = await createClient();
  const w = await getCurrentWorkspace();
  if (!w) return <main className="page"><span className="eyebrow">Nexus</span><h1>Seu workspace</h1><section className="card"><p className="muted">Crie um workspace ou entre usando um código.</p><Link href="/onboarding" className="btn btn-primary btn-block">Começar</Link></section></main>;
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: groupsData },{ data: programsData },{ data: projectsData },{ data: activitiesData },{ data: risksData }] = await Promise.all([
    s.from("groups").select("id,name,description,progress,health").eq("organization_id", w.id).is("deleted_at", null).is("archived_at", null).order("name"),
    s.from("programs").select("id,name,group_id,progress,health").eq("organization_id", w.id).is("deleted_at", null).is("archived_at", null),
    s.from("projects").select("id,name,program_id,progress,health").eq("organization_id", w.id).is("deleted_at", null).is("archived_at", null),
    s.from("activities").select("id,project_id,due_date,status,progress").eq("organization_id", w.id).is("deleted_at", null),
    s.from("risks").select("id,group_id,program_id,project_id,score,status").eq("organization_id", w.id).is("deleted_at", null),
  ]);
  const groups = Array.isArray(groupsData) ? groupsData : [], programs = Array.isArray(programsData) ? programsData : [], projects = Array.isArray(projectsData) ? projectsData : [], activities = Array.isArray(activitiesData) ? activitiesData : [], risks = Array.isArray(risksData) ? risksData : [];
  const overdueActivities = activities.filter((activity: any) => { const due = String(activity.due_date || "").slice(0, 10); return Boolean(due) && due < today && isOpenStatus(activity.status); });
  const overdue = overdueActivities.length;
  const progressSource = projects.length ? projects.map((project: any) => numberValue(project.progress)) : programs.length ? programs.map((program: any) => numberValue(program.progress)) : groups.map((group: any) => numberValue(group.progress));
  const progress = Math.round(average(progressSource));
  const overallStatus = portfolioStatus(projects, overdue), overallTone=statusTone(overallStatus);
  const programsByGroup = new Map<string, any[]>(); programs.forEach((program: any) => { if (!program.group_id) return; programsByGroup.set(program.group_id, [...(programsByGroup.get(program.group_id) || []), program]); });
  const programToGroup = new Map<string, string>(); programs.forEach((program: any) => { if (program.id && program.group_id) programToGroup.set(program.id, program.group_id); });
  const projectsByGroup = new Map<string, any[]>(), projectToGroup = new Map<string, string>(); projects.forEach((project: any) => { const groupId = programToGroup.get(project.program_id); if (!groupId) return; projectToGroup.set(project.id, groupId); projectsByGroup.set(groupId, [...(projectsByGroup.get(groupId) || []), project]); });
  const overdueByGroup = new Map<string, number>(); overdueActivities.forEach((activity: any) => { const groupId = projectToGroup.get(activity.project_id); if (!groupId) return; overdueByGroup.set(groupId, (overdueByGroup.get(groupId) || 0) + 1); });
  const criticalRisksByGroup = new Map<string, number>(); risks.forEach((risk: any) => { if (!isOpenStatus(risk.status) || numberValue(risk.score) < 80) return; const groupId = risk.group_id || programToGroup.get(risk.program_id) || projectToGroup.get(risk.project_id); if (!groupId) return; criticalRisksByGroup.set(groupId, (criticalRisksByGroup.get(groupId) || 0) + 1); });
  const summaryGridStyle={width:"100%",maxWidth:"100%",minWidth:0,display:"grid",gridTemplateColumns:"repeat(2, minmax(0, 1fr))",gap:12,marginTop:14,overflow:"hidden"};
  const summaryCardStyle={width:"100%",maxWidth:"100%",minWidth:0,minHeight:156,marginTop:0,padding:"18px 14px",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",textAlign:"center" as const,boxSizing:"border-box" as const,overflow:"hidden"};
  const summaryLabelStyle={minWidth:0,maxWidth:"100%",margin:0,lineHeight:1.14,textAlign:"center" as const,overflowWrap:"anywhere" as const,wordBreak:"break-word" as const};
  const summaryValueStyle={minWidth:0,maxWidth:"100%",marginTop:14,textAlign:"center" as const,fontSize:"clamp(28px, 8vw, 42px)",lineHeight:1.02,fontWeight:900,whiteSpace:"normal" as const,overflowWrap:"anywhere" as const,wordBreak:"break-word" as const};
  const statusValueStyle={...summaryValueStyle,fontSize:"clamp(22px, 6.2vw, 34px)",lineHeight:1.05,color:overallTone.color};
  return <main className="page" style={{width:"100%",maxWidth:"100%",minWidth:0,overflowX:"hidden"}}>
    <h1 style={{marginBottom:0}}>Visão Geral</h1>
    <section style={summaryGridStyle}>
      <div className="card" style={summaryCardStyle}><div className="eyebrow" style={summaryLabelStyle}>Progresso consolidado</div><div style={summaryValueStyle}>{pct(progress)}</div></div>
      <div className="card" style={{...summaryCardStyle,...overallTone}}><div className="eyebrow" style={{...summaryLabelStyle,color:overallTone.color}}>Status geral</div><div style={statusValueStyle}>{healthLabel(overallStatus)}</div></div>
      <div className="card" style={summaryCardStyle}><div className="eyebrow" style={summaryLabelStyle}>Projetos ativos</div><div style={summaryValueStyle}>{projects.length}</div></div>
      <div className="card" style={summaryCardStyle}><div className="eyebrow" style={summaryLabelStyle}>Atividades atrasadas</div><div style={summaryValueStyle}>{overdue}</div></div>
    </section>
    <div className="section-title" style={{minWidth:0,width:"100%"}}><h2>Resumo das Direções</h2><Link href="/app/groups" className="chip" style={{flexShrink:0}}>Ver todas</Link></div>
    <section className="form" style={{width:"100%",maxWidth:"100%",minWidth:0,overflow:"hidden"}}>
      {groups.length===0 ? <div className="card empty" style={{marginTop:0,minWidth:0,maxWidth:"100%"}}>Nenhuma direção criada.</div> : groups.map((group:any) => {
        const directionPrograms = programsByGroup.get(group.id) || [], directionProjects = projectsByGroup.get(group.id) || [];
        const directionProgress = directionProjects.length ? Math.round(average(directionProjects.map((project:any) => numberValue(project.progress)))) : directionPrograms.length ? Math.round(average(directionPrograms.map((program:any) => numberValue(program.progress)))) : Math.round(numberValue(group.progress));
        const directionOverdue = overdueByGroup.get(group.id) || 0, criticalRisks = criticalRisksByGroup.get(group.id) || 0, status = directionStatus(group.health, directionProgress, directionOverdue, criticalRisks), tone=statusTone(status);
        return <div className="card" key={group.id} style={{display:"block",width:"100%",maxWidth:"100%",minWidth:0,overflow:"hidden",background:tone.background,borderColor:tone.borderColor}}>
          <Link href={`/app/group/${group.id}`} style={{display:"block",color:"inherit",textDecoration:"none"}} aria-label={`Abrir ${group.name}`}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,minWidth:0}}>
              <div style={{minWidth:0,flex:1,overflow:"hidden"}}>
                <div style={{fontWeight:900,fontSize:18,lineHeight:1.2,overflowWrap:"anywhere"}}>{group.name}</div>
                <div className="row-sub" style={{marginTop:6,overflowWrap:"anywhere"}}>{directionPrograms.length} programas · {directionProjects.length} projetos</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <span className={`chip ${status==="off_track"?"danger":status==="attention"?"warning":"success"}`} style={{flexShrink:0}}>{healthLabel(status)}</span>
                <span aria-hidden="true" style={{fontSize:30,lineHeight:1,color:"var(--primary, #5b21b6)",fontWeight:500,marginTop:-2}}>›</span>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginTop:16,minWidth:0}}><span className="eyebrow">Progresso</span><strong style={{flexShrink:0}}>{pct(directionProgress)}</strong></div>
            <div style={{width:"100%",maxWidth:"100%",height:10,borderRadius:999,background:"rgba(255,255,255,.65)",overflow:"hidden",marginTop:7}}><div style={{height:"100%",width:`${Math.max(0,Math.min(100,directionProgress))}%`,maxWidth:"100%",background:tone.color,borderRadius:999}} /></div>
            <div className="row-sub" style={{marginTop:12,overflowWrap:"anywhere"}}>{directionOverdue} atividades atrasadas · {criticalRisks} riscos críticos</div>
          </Link>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginTop:14,paddingTop:13,borderTop:"1px dashed rgba(100,116,139,.28)",minWidth:0}}>
            <Link href={`/app/group/${group.id}`} aria-label={`Ver programas de ${group.name}`} style={{display:"inline-flex",alignItems:"center",gap:7,minWidth:0,color:"var(--primary, #5b21b6)",textDecoration:"none",fontSize:12,fontWeight:700}}>
              <span aria-hidden="true" style={{fontSize:18,lineHeight:1}}>☝️</span>
              <span style={{color:"#64748b",overflowWrap:"anywhere"}}>Toque para ver os programas</span>
            </Link>
            <a href={`/app/group/${group.id}/status-pdf`} aria-label={`Gerar relatório de status de ${group.name}`} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,minHeight:38,padding:"8px 12px",borderRadius:12,border:"1px solid var(--primary, #5b21b6)",color:"var(--primary, #5b21b6)",background:"rgba(255,255,255,.72)",textDecoration:"none",fontSize:13,fontWeight:800,whiteSpace:"nowrap",flexShrink:0}}>
              <span aria-hidden="true" style={{fontSize:15,lineHeight:1}}>▤</span>
              <span>Relatório de status</span>
            </a>
          </div>
        </div>;
      })}
    </section>
  </main>;
}
