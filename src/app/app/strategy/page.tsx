import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {StrategyManager} from "@/components/strategy-manager";
import {getWorkspaceTemplate} from "@/lib/workspace-templates";
import {pct,dateBR} from "@/lib/format";

export default async function Page(){
  const s=await createClient();
  const w=await getCurrentWorkspace();
  if(!w)return null;
  const [{data:settings},{data:plans},{data:objectives},{data:frameworks},{data:items},{data:kpis},{data:projects},{data:groups},{data:links}]=await Promise.all([
    s.from("organization_settings").select("module_config,labels").eq("organization_id",w.id).maybeSingle(),
    s.from("strategic_plans").select("*").eq("organization_id",w.id).order("version",{ascending:false}).limit(1),
    s.from("strategic_objectives").select("*,groups(name)").eq("organization_id",w.id).is("deleted_at",null).order("name"),
    s.from("strategic_frameworks").select("*").eq("organization_id",w.id).eq("is_active",true).order("sort_order"),
    s.from("strategic_framework_items").select("id,framework_id,name,category,classification,status,target_text").eq("organization_id",w.id).order("sort_order"),
    s.from("kpis").select("id,name,unit,target,current_value,trend,frequency").eq("organization_id",w.id).is("deleted_at",null).order("name"),
    s.from("projects").select("id").eq("organization_id",w.id).is("deleted_at",null),
    s.from("groups").select("id,name").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null),
    s.from("strategic_links").select("source_id,target_id,target_type").eq("organization_id",w.id)
  ]);
  const templateKey=(settings?.module_config as any)?.workspace_template||"company";
  const template=getWorkspaceTemplate(templateKey);
  const plan=plans?.[0];
  const core=(frameworks||[]).find((f:any)=>f.slug==="pmi-core-services-2026");
  const coreItems=(items||[]).filter((i:any)=>i.framework_id===core?.id);
  const categories=[...new Set(coreItems.map((i:any)=>i.category).filter(Boolean))] as string[];
  const required=coreItems.filter((i:any)=>i.classification==="Obrigatório");
  const linkedIds=new Set((links||[]).filter((l:any)=>l.target_type==="project").map((l:any)=>l.source_id));
  const requiredCovered=required.filter((i:any)=>linkedIds.has(i.id)).length;
  const score=required.length?Math.round(requiredCovered/required.length*100):null;

  return <main className="page">
    <span className="eyebrow">Estratégia · {template.name}</span>
    <h1>{plan?.name||template.strategyLabel}</h1>
    {plan&&<section className="card" style={{marginBottom:12}}>
      <div className="row-main"><div className="row-title">{plan.status==="active"?"Plano em execução":"Plano estratégico"}</div><div className="row-sub">{dateBR(plan.period_start)} → {dateBR(plan.period_end)} · versão {plan.version}</div></div>
      {plan.strategic_intent&&<p className="muted" style={{marginBottom:0}}>{plan.strategic_intent}</p>}
    </section>}

    <section className="grid grid-2" style={{marginBottom:12}}>
      <div className="card"><div className="muted">Objetivos</div><div style={{fontSize:28,fontWeight:900}}>{objectives?.length||0}</div></div>
      <div className="card"><div className="muted">Referenciais</div><div style={{fontSize:28,fontWeight:900}}>{frameworks?.length||0}</div></div>
      <div className="card"><div className="muted">KPIs</div><div style={{fontSize:28,fontWeight:900}}>{kpis?.length||0}</div></div>
      <div className="card"><div className="muted">{score!==null?"Cobertura obrigatória":"Projetos"}</div><div style={{fontSize:28,fontWeight:900}}>{score!==null?`${score}%`:(projects?.length||0)}</div></div>
    </section>

    {categories.length>0&&<><div className="section-title"><h2>Frentes do planejamento</h2></div><section className="card list">
      {categories.map(category=>{const rows=coreItems.filter((i:any)=>i.category===category);const mandatory=rows.filter((i:any)=>i.classification==="Obrigatório").length;return <div className="row" key={category}><div className="row-main"><div className="row-title">{category}</div><div className="row-sub">{rows.length} itens{mandatory?` · ${mandatory} obrigatórios`:""}</div></div><span className="chip">{rows.length}</span></div>})}
    </section></>}

    <div className="section-title"><h2>{template.frameworkLabel}</h2></div>
    <section className="card list">
      {!frameworks?.length?<div className="empty">Nenhum referencial configurado.</div>:frameworks.map((f:any)=>{
        const total=(items||[]).filter((i:any)=>i.framework_id===f.id).length;
        return <Link className="row" href={`/app/strategy/framework/${f.id}`} key={f.id}><div className="row-main"><div className="row-title">{f.name}</div><div className="row-sub">{f.description||"Referencial estratégico"} · {total} itens</div></div><span className="row-arrow">›</span></Link>;
      })}
    </section>

    <div className="section-title"><h2>Objetivos estratégicos</h2></div>
    <section className="card list">{!objectives?.length?<div className="empty">Nenhum objetivo estratégico.</div>:objectives.map((x:any)=><div className="row" key={x.id}><div className="row-main"><div className="row-title">{x.name}</div><div className="row-sub">{x.groups?.name||w.name} · {dateBR(x.start_date)} → {dateBR(x.due_date)}</div></div><span className="chip">{pct(x.progress)}</span></div>)}</section>

    {!!kpis?.length&&<><div className="section-title"><h2>Scorecard</h2></div><section className="card list">{kpis.slice(0,12).map((k:any)=><div className="row" key={k.id}><div className="row-main"><div className="row-title">{k.name}</div><div className="row-sub">Meta {k.target??"—"} {k.unit||""} · {k.frequency}</div></div><span className="chip">{k.current_value??"—"}</span></div>)}</section></>}

    <div className="section-title"><h2>Adicionar</h2></div>
    <StrategyManager organizationId={w.id} groups={groups||[]}/>
  </main>;
}
