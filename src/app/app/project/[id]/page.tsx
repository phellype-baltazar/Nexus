import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {ContextNav} from "@/components/context-nav";
import {ActivityCreatorV2} from "@/components/activity-creator-v2";
import {ProjectScheduleActionsV3} from "@/components/project-schedule-actions-v3";
import {RiskCreator,KpiCreator,StatusReportCreator} from "@/components/project-workspace";
import {FinanceCreatorV2} from "@/components/finance-creator-v2";
import {EntityActions} from "@/components/entity-actions";
import {SummaryCards} from "@/components/summary-cards";
import {dateBR,money,pct,healthLabel} from "@/lib/format";

function activityStatus(status:string,dueDate:string|null,completedAt:string|null){
  const today=new Date().toISOString().slice(0,10);
  const completed=completedAt?new Date(completedAt).toISOString().slice(0,10):null;
  if(status==="cancelled") return {label:"Cancelada",className:""};
  if(status==="done"){
    if(dueDate&&completed){
      if(completed<dueDate)return {label:"Feita antes do prazo",className:"success"};
      if(completed===dueDate)return {label:"Feita no prazo",className:"success"};
      return {label:"Feita fora do prazo",className:"danger"};
    }
    return {label:"Feita",className:"success"};
  }
  if(dueDate&&dueDate<today) return {label:"Atrasada",className:"danger"};
  return {label:"Em andamento",className:"warning"};
}

export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{tab?:string}>}) {
  const {id}=await params;
  const {tab="overview"}=await searchParams;
  const s=await createClient();
  const w=await getCurrentWorkspace();
  if(!w)return null;
  const {data:claims}=await s.auth.getClaims();
  const userId=String(claims?.claims?.sub||"");

  const {data:p}=await s.from("projects").select("*,programs(id,name,groups(id,name))").eq("id",id).is("deleted_at",null).maybeSingle();
  if(!p)return <main className="page"><h1>Projeto</h1><div className="card">Não encontrado ou sem permissão.</div></main>;

  const [{data:activities},{data:risks},{data:kpis},{data:budgets},{data:financialItems},{data:benefits},{data:meetings},{data:memberRows},{data:reports},{data:deps}] = await Promise.all([
    s.from("activities").select("*,profiles!activities_primary_owner_id_fkey(id,full_name)").eq("project_id",id).is("deleted_at",null).order("due_date",{ascending:true}),
    s.from("risks").select("*").eq("project_id",id).is("deleted_at",null).order("score",{ascending:false}),
    s.from("kpis").select("*").eq("project_id",id).is("deleted_at",null).order("name"),
    s.from("budgets").select("*").eq("project_id",id).order("updated_at",{ascending:false}),
    s.from("project_financial_items").select("id,label,amount,currency,notes,created_at").eq("project_id",id).order("created_at",{ascending:false}),
    s.from("benefits").select("*").eq("project_id",id).is("deleted_at",null).order("name"),
    s.from("meetings").select("*").eq("project_id",id).is("deleted_at",null).order("starts_at",{ascending:false}),
    s.from("organization_members").select("user_id,role,status,profiles!organization_members_user_id_fkey(full_name)").eq("organization_id",w.id).eq("status","active"),
    s.from("status_reports").select("*").eq("project_id",id).order("period_end",{ascending:false}),
    s.from("project_dependencies").select("*,projects!project_dependencies_depends_on_project_id_fkey(name)").eq("project_id",id)
  ]);

  const members=(memberRows||[]).map((m:any)=>({user_id:m.user_id,role:m.role,status:m.status,full_name:m.profiles?.full_name||null}));
  const tabs=[["overview","Visão geral"],["activities","Atividades"],["risks","Riscos"],["kpis","KPIs"],["finance","Financeiro"],["people","Pessoas"],["meetings","Reuniões"],["status","Status"]];

  return <main className="page" style={{maxWidth:"100%",overflowX:"hidden"}}>
    <ContextNav organizationName={w.name} group={(p as any).programs?.groups} program={(p as any).programs} project={{id:p.id,name:p.name}}/>
    <span className="eyebrow">Projeto</span><h1>{p.name}</h1>
    <div className="tabs" style={{margin:"12px 0 18px"}}>{tabs.map(([k,l])=><Link className={`tab ${tab===k?"active":""}`} href={`/app/project/${id}?tab=${k}`} key={k}>{l}</Link>)}</div>

    {tab==="overview"&&<>
      <SummaryCards items={[
        {label:"Progresso",value:pct(p.progress)},
        {label:"Status",value:healthLabel(p.health)},
        {label:"Início",value:dateBR(p.start_date)},
        {label:"Fim",value:dateBR(p.due_date)},
      ]}/>
      <section className="card" style={{marginTop:12}}><h2>Descrição</h2><p className="muted">{p.description||"Sem descrição."}</p><div className="chip">{p.status}</div> <div className="chip">{p.priority}</div></section>
      <section className="card"><h2>Resumo do projeto</h2><div className="row"><div className="row-main"><div className="row-title">{activities?.length||0} atividades</div><div className="row-sub">{activities?.filter((a:any)=>a.status==="done").length||0} feitas · {activities?.filter((a:any)=>activityStatus(a.status,a.due_date,a.completed_at).label==="Atrasada").length||0} atrasadas</div></div></div><div className="row"><div className="row-main"><div className="row-title">{risks?.length||0} riscos</div><div className="row-sub">{risks?.filter((r:any)=>r.status==="open").length||0} abertos</div></div></div><div className="row"><div className="row-main"><div className="row-title">{kpis?.length||0} KPIs</div><div className="row-sub">{benefits?.length||0} benefícios</div></div></div></section>
      {!!deps?.length&&<section className="card"><h2>Dependências</h2>{deps.map((d:any)=><div className="row" key={d.id}><div className="row-main"><div className="row-title">{d.projects?.name||"Projeto"}</div><div className="row-sub">{d.dependency_type}</div></div></div>)}</section>}
      <EntityActions type="project" id={p.id} initialTitle={p.name} initialDescription={p.description||""}/>
    </>}

    {tab==="activities"&&<>
      <ProjectScheduleActionsV3 projectId={id}/>
      <section className="card list">{!activities?.length?<div className="empty">Nenhuma atividade.</div>:activities.map((a:any)=>{const st=activityStatus(String(a.status),a.due_date||null,a.completed_at||null);const owner=a.external_owner_name||a.profiles?.full_name||"Sem responsável";return <Link className="row" href={`/app/activity/${a.id}`} key={a.id}><div className="row-main"><div className="row-title">{a.title}</div><div className="row-sub">Prevista {dateBR(a.due_date)} · {owner}</div></div><span className={`chip ${st.className}`}>{st.label}</span></Link>})}</section>
      <ActivityCreatorV2 organizationId={w.id} projectId={id} members={members}/>
    </>}

    {tab==="risks"&&<><section className="card list">{!risks?.length?<div className="empty">Nenhum risco.</div>:risks.map((r:any)=><div className="row" key={r.id}><div className="row-main"><div className="row-title">{r.title}</div><div className="row-sub">{r.category||"Sem categoria"} · {r.probability}/{r.impact} · revisão {dateBR(r.review_date)}</div></div><span className="chip warning">{r.score??"—"}</span></div>)}</section><RiskCreator organizationId={w.id} projectId={id}/></>}

    {tab==="kpis"&&<><section className="card list">{!kpis?.length?<div className="empty">Nenhum KPI.</div>:kpis.map((k:any)=><div className="row" key={k.id}><div className="row-main"><div className="row-title">{k.name}</div><div className="row-sub">Atual {k.current_value??"—"} {k.unit||""} · Meta {k.target??"—"} · {k.frequency}</div></div><span className="chip">{k.trend||"—"}</span></div>)}</section><KpiCreator organizationId={w.id} projectId={id}/></>}

    {tab==="finance"&&<>
      <section className="grid grid-2">
        {[
          ["CAPEX Budget","capex_budget"],
          ["OPEX Budget","opex_budget"],
          ["Saving (Full Year)","saving_full_year"],
          ["Saving (Dentro do ano)","saving_in_year"],
        ].map(([label,key])=><div className="card" key={key} style={{marginTop:0,minWidth:0,display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center",overflow:"hidden"}}><div className="eyebrow" style={{overflowWrap:"anywhere"}}>{label}</div><div style={{fontWeight:900,fontSize:"clamp(16px,4.6vw,22px)",lineHeight:1.05,marginTop:8,overflowWrap:"anywhere"}}>{money((budgets?.[0] as any)?.[key],budgets?.[0]?.currency||"BRL")}</div></div>)}
        {(financialItems||[]).map((item:any)=><div className="card" key={item.id} style={{marginTop:0,minWidth:0,display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center",overflow:"hidden"}}><div className="eyebrow" style={{overflowWrap:"anywhere"}}>{item.label}</div><div style={{fontWeight:900,fontSize:"clamp(16px,4.6vw,22px)",lineHeight:1.05,marginTop:8,overflowWrap:"anywhere"}}>{money(item.amount,item.currency||"BRL")}</div>{item.notes&&<div className="muted" style={{fontSize:11,marginTop:7,overflowWrap:"anywhere"}}>{item.notes}</div>}</div>)}
      </section>
      <FinanceCreatorV2 organizationId={w.id} projectId={id}/>
    </>}

    {tab==="people"&&<section className="card list">{!members?.length?<div className="empty">Nenhum membro disponível.</div>:members.map((m:any)=><div className="row" key={m.user_id}><div className="row-main"><div className="row-title">{m.full_name||"Usuário"}</div><div className="row-sub">{m.role} · {m.status}</div></div></div>)}</section>}

    {tab==="meetings"&&<section className="card list">{!meetings?.length?<div className="empty">Nenhuma reunião vinculada.</div>:meetings.map((m:any)=><div className="row" key={m.id}><div className="row-main"><div className="row-title">{m.title}</div><div className="row-sub">{dateBR(m.starts_at)} · {m.status}</div></div></div>)}</section>}

    {tab==="status"&&<><section className="card list">{!reports?.length?<div className="empty">Nenhum status report.</div>:reports.map((r:any)=><div className="row" key={r.id}><div className="row-main"><div className="row-title">{dateBR(r.period_start)} – {dateBR(r.period_end)}</div><div className="row-sub">{r.accomplishments||"Sem resumo"} · próximos passos: {r.next_steps||"—"}</div></div><span className={`chip ${r.overall_status==="off_track"?"danger":r.overall_status==="attention"?"warning":"success"}`}>{r.overall_status}</span></div>)}</section><StatusReportCreator organizationId={w.id} projectId={id} userId={userId}/></>}
  </main>;
}
