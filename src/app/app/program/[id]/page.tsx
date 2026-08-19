import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {ContextNav} from "@/components/context-nav";
import {EntityActions} from "@/components/entity-actions";
import {SummaryCards} from "@/components/summary-cards";
import {CreateProjectInProgramForm} from "@/components/create-forms";
import {ProgramMacroView} from "@/components/program-macro-view";
import {pct,healthLabel,dateBR,money} from "@/lib/format";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const {data:p}=await s.from("programs").select("*,groups(id,name)").eq("id",id).is("deleted_at",null).maybeSingle();
  if(!p)return <main className="page"><h1>Programa</h1><div className="card">Não encontrado ou sem permissão.</div></main>;
  const [{data:projects},{data:kpis},{data:risks},{data:budgets}]=await Promise.all([
    s.from("projects").select("id,name,progress,health,start_date,due_date").eq("program_id",id).is("deleted_at",null).is("archived_at",null).order("name"),
    s.from("kpis").select("*").eq("program_id",id).is("deleted_at",null),
    s.from("risks").select("*").eq("program_id",id).is("deleted_at",null),
    s.from("budgets").select("*").eq("program_id",id)
  ]);

  const projectIds=(projects||[]).map((x:any)=>String(x.id));
  let projectActivities:any[]=[];let projectRisks:any[]=[];let milestones:any[]=[];
  if(projectIds.length){
    const [{data:a},{data:r},{data:m}]=await Promise.all([
      s.from("activities").select("project_id,status,due_date,completed_at").in("project_id",projectIds).is("deleted_at",null),
      s.from("risks").select("project_id,status,score").in("project_id",projectIds).is("deleted_at",null),
      s.from("project_milestones").select("id,project_id,name,milestone_date").in("project_id",projectIds).is("deleted_at",null).order("milestone_date",{ascending:true})
    ]);
    projectActivities=a||[];projectRisks=r||[];milestones=m||[];
  }
  const today=new Date().toISOString().slice(0,10);
  const macroProjects=(projects||[]).map((pr:any)=>({
    id:String(pr.id),name:String(pr.name),start_date:pr.start_date||null,due_date:pr.due_date||null,progress:Number(pr.progress||0),health:pr.health||null,
    overdue:projectActivities.filter((a:any)=>String(a.project_id)===String(pr.id)&&String(a.status)!=="done"&&String(a.status)!=="cancelled"&&a.due_date&&a.due_date<today).length,
    criticalRisks:projectRisks.filter((r:any)=>String(r.project_id)===String(pr.id)&&["open","monitoring","materialized"].includes(String(r.status))&&Number(r.score||0)>=15).length
  }));

  return <main className="page" style={{maxWidth:"100%",overflowX:"hidden"}}>
    <ContextNav organizationName={w.name} group={(p as any).groups} program={{id:p.id,name:p.name}}/>
    <span className="eyebrow">Programa</span>
    <h1>{p.name}</h1>

    <SummaryCards items={[
      {label:"Progresso",value:pct(p.progress)},
      {label:"Status",value:healthLabel(p.health)},
      {label:"Início",value:dateBR(p.start_date)},
      {label:"Fim",value:dateBR(p.due_date)},
    ]}/>

    <section className="card" style={{marginTop:12}}><h2>Objetivo</h2><p className="muted">{p.objective||p.description||'Sem objetivo registrado.'}</p></section>

    <ProgramMacroView projects={macroProjects} milestones={(milestones||[]).map((m:any)=>({id:String(m.id),project_id:String(m.project_id),name:String(m.name),milestone_date:String(m.milestone_date)}))}/>

    <div className="section-title"><h2>Projetos</h2></div>
    <section className="card list">{!projects?.length?<div className="empty">Nenhum projeto. Use o + para adicionar o primeiro.</div>:projects.map(pr=><Link className="row" href={`/app/project/${pr.id}`} key={pr.id}><div className="row-main"><div className="row-title">{pr.name}</div><div className="row-sub">{dateBR(pr.start_date)} → {dateBR(pr.due_date)} · {pct(pr.progress)}</div></div><span className="row-arrow">›</span></Link>)}</section>

    <div className="section-title"><h2>Indicadores do programa</h2></div>
    <section className="card list">{!kpis?.length?<div className="empty">Nenhum KPI direto neste programa.</div>:kpis.map((k:any)=><div className="row" key={k.id}><div className="row-main"><div className="row-title">{k.name}</div><div className="row-sub">Atual {k.current_value??'—'} {k.unit||''} · Meta {k.target??'—'}</div></div></div>)}</section>

    <SummaryCards items={[
      {label:"Riscos diretos",value:risks?.length||0},
      {label:"Orçamento direto",value:money((budgets||[]).reduce((a,b)=>a+Number(b.budget||0),0),budgets?.[0]?.currency||'BRL')},
    ]}/>

    <EntityActions type="program" id={p.id} initialTitle={p.name} initialDescription={p.description||p.objective||''}/>
    <CreateProjectInProgramForm organizationId={w.id} programId={p.id} programName={p.name}/>
  </main>;
}
