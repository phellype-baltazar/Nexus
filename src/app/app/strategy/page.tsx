import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {StrategyManager} from "@/components/strategy-manager";
import {StrategyObjectiveEditor} from "@/components/strategy-objective-editor";
import {StrategyPlanEditor} from "@/components/strategy-plan-editor";
import {getWorkspaceTemplate} from "@/lib/workspace-templates";
import {pct,dateBR} from "@/lib/format";

function statusLabel(status?:string){return ({active:"Em andamento",on_track:"On track",off_track:"Off tracking",completed:"Concluído",paused:"Pausado",draft:"Rascunho",archived:"Arquivado"} as Record<string,string>)[status||""]||status||"Em andamento"}
function statusTone(status?:string){if(status==="off_track")return {background:"#fee2e2",color:"#991b1b"};if(status==="completed"||status==="on_track")return {background:"#dcfce7",color:"#166534"};if(status==="paused")return {background:"#fef3c7",color:"#92400e"};return {background:"#eef2ff",color:"#3730a3"}}

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
  const allObjectives=objectives||[];
  const core=(frameworks||[]).find((f:any)=>f.slug==="pmi-core-services-2026");
  const coreItems=(items||[]).filter((i:any)=>i.framework_id===core?.id);
  const categories=[...new Set(coreItems.map((i:any)=>i.category).filter(Boolean))] as string[];
  const required=coreItems.filter((i:any)=>i.classification==="Obrigatório");
  const linkedIds=new Set((links||[]).filter((l:any)=>l.target_type==="project").map((l:any)=>l.source_id));
  const requiredCovered=required.filter((i:any)=>linkedIds.has(i.id)).length;
  const score=required.length?Math.round(requiredCovered/required.length*100):null;
  const avgProgress=allObjectives.length?Math.round(allObjectives.reduce((sum:number,x:any)=>sum+Number(x.progress||0),0)/allObjectives.length):0;
  const offTrack=allObjectives.filter((x:any)=>x.status==="off_track").length;
  const completed=allObjectives.filter((x:any)=>x.status==="completed").length;

  return <main className="page">
    <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",marginBottom:8}}>
      <div><span className="eyebrow">Estratégia · {template.name}</span><h1 style={{marginBottom:4}}>{plan?.name||template.strategyLabel}</h1></div>
      {plan&&<StrategyPlanEditor plan={plan}/>} 
    </div>

    {plan&&<section className="card" style={{marginBottom:12,padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:8}}>
        <span className="chip" style={statusTone(plan.status)}>{statusLabel(plan.status)}</span>
        <span className="muted" style={{fontSize:13}}>v{plan.version} · {dateBR(plan.period_start)} → {dateBR(plan.period_end)}</span>
      </div>
      {plan.strategic_intent&&<p className="muted" style={{margin:0,fontSize:15,lineHeight:1.45}}>{plan.strategic_intent}</p>}
    </section>}

    <section className="grid grid-2" style={{marginBottom:12,gap:10}}>
      <div className="card" style={{padding:14}}><div className="muted" style={{fontSize:13}}>Progresso médio</div><div style={{fontSize:25,fontWeight:900}}>{avgProgress}%</div></div>
      <div className="card" style={{padding:14}}><div className="muted" style={{fontSize:13}}>Off tracking</div><div style={{fontSize:25,fontWeight:900}}>{offTrack}</div></div>
      <div className="card" style={{padding:14}}><div className="muted" style={{fontSize:13}}>Concluídos</div><div style={{fontSize:25,fontWeight:900}}>{completed}/{allObjectives.length}</div></div>
      <div className="card" style={{padding:14}}><div className="muted" style={{fontSize:13}}>{score!==null?"Cobertura obrigatória":"Projetos"}</div><div style={{fontSize:25,fontWeight:900}}>{score!==null?`${score}%`:(projects?.length||0)}</div></div>
    </section>

    <div className="section-title" style={{marginTop:8}}><h2>Acompanhamento dos objetivos</h2></div>
    <section className="card" style={{padding:0,overflow:"hidden"}}>
      {!allObjectives.length?<div className="empty" style={{padding:16}}>Nenhum objetivo estratégico.</div>:allObjectives.map((x:any,idx:number)=><div key={x.id} style={{padding:"14px 16px",borderBottom:idx===allObjectives.length-1?"none":"1px solid var(--border, #e5e7eb)"}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><div className="row-title" style={{fontSize:16}}>{x.name}</div><span className="chip" style={{...statusTone(x.status),fontSize:11,padding:"4px 7px"}}>{statusLabel(x.status)}</span></div>
            <div className="row-sub" style={{fontSize:13,marginTop:3}}>{x.groups?.name||w.name} · {dateBR(x.due_date)}</div>
          </div>
          <StrategyObjectiveEditor objective={x} groups={groups||[]}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
          <div style={{height:8,background:"#eef2f7",borderRadius:999,overflow:"hidden",flex:1}}><div style={{height:"100%",width:`${Math.max(0,Math.min(100,Number(x.progress||0)))}%`,background:x.status==="off_track"?"#dc2626":"#6d28d9",borderRadius:999}}/></div>
          <strong style={{fontSize:13,minWidth:34,textAlign:"right"}}>{pct(x.progress)}</strong>
        </div>
      </div>)}
    </section>

    <details style={{marginTop:14}}>
      <summary className="card" style={{cursor:"pointer",fontWeight:800,display:"flex",justifyContent:"space-between",alignItems:"center",listStyle:"none"}}><span>Frentes do planejamento</span><span className="chip">{categories.length}</span></summary>
      {categories.length>0&&<section className="card list" style={{marginTop:8}}>{categories.map(category=>{const rows=coreItems.filter((i:any)=>i.category===category);const mandatory=rows.filter((i:any)=>i.classification==="Obrigatório").length;return <div className="row" key={category}><div className="row-main"><div className="row-title">{category}</div><div className="row-sub">{rows.length} itens{mandatory?` · ${mandatory} obrigatórios`:""}</div></div><span className="chip">{rows.length}</span></div>})}</section>}
    </details>

    <details style={{marginTop:10}}>
      <summary className="card" style={{cursor:"pointer",fontWeight:800,display:"flex",justifyContent:"space-between",alignItems:"center",listStyle:"none"}}><span>{template.frameworkLabel}</span><span className="chip">{frameworks?.length||0}</span></summary>
      <section className="card list" style={{marginTop:8}}>{!frameworks?.length?<div className="empty">Nenhum referencial configurado.</div>:frameworks.map((f:any)=>{const total=(items||[]).filter((i:any)=>i.framework_id===f.id).length;return <Link className="row" href={`/app/strategy/framework/${f.id}`} key={f.id}><div className="row-main"><div className="row-title">{f.name}</div><div className="row-sub">{total} itens · {f.description||"Referencial estratégico"}</div></div><span className="row-arrow">›</span></Link>})}</section>
    </details>

    <details style={{marginTop:10}}>
      <summary className="card" style={{cursor:"pointer",fontWeight:800,display:"flex",justifyContent:"space-between",alignItems:"center",listStyle:"none"}}><span>KPIs</span><span className="chip">{kpis?.length||0}</span></summary>
      {!!kpis?.length&&<section className="card list" style={{marginTop:8}}>{kpis.slice(0,12).map((k:any)=><div className="row" key={k.id}><div className="row-main"><div className="row-title">{k.name}</div><div className="row-sub">Meta {k.target??"—"} {k.unit||""} · {k.frequency}</div></div><span className="chip">{k.current_value??"—"}</span></div>)}</section>}
    </details>

    <details style={{marginTop:10,marginBottom:12}}>
      <summary className="card" style={{cursor:"pointer",fontWeight:800,listStyle:"none"}}>+ Novo objetivo estratégico</summary>
      <div style={{marginTop:8}}><StrategyManager organizationId={w.id} groups={groups||[]}/></div>
    </details>
  </main>;
}
