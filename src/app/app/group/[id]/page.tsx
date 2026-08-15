import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {ContextNav} from "@/components/context-nav";
import {EntityActions} from "@/components/entity-actions";
import {SummaryCards} from "@/components/summary-cards";
import {pct,healthLabel,money} from "@/lib/format";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const {data:g}=await s.from("groups").select("*").eq("id",id).is("deleted_at",null).maybeSingle();
  if(!g)return <main className="page"><h1>Direção</h1><div className="card">Não encontrada ou sem permissão.</div></main>;
  const {data:programs}=await s.from("programs").select("id,name,progress,health").eq("group_id",id).is("deleted_at",null).is("archived_at",null).order("name");
  const pids=(programs||[]).map(p=>p.id);
  const projectsResult=pids.length?await s.from("projects").select("id,name,program_id,progress,health").in("program_id",pids).is("deleted_at",null).is("archived_at",null):{data:[] as any[]};
  const projects=projectsResult.data||[];
  const [{data:kpis},{data:risks},{data:budgets}]=await Promise.all([
    s.from("kpis").select("*").eq("group_id",id).is("deleted_at",null),
    s.from("risks").select("*").eq("group_id",id).is("deleted_at",null),
    s.from("budgets").select("*").eq("group_id",id)
  ]);

  return <main className="page" style={{maxWidth:"100%",overflowX:"hidden"}}>
    <ContextNav organizationName={w.name} group={{id:g.id,name:g.name}}/>
    <span className="eyebrow">Direção</span>
    <h1>{g.name}</h1>

    <SummaryCards items={[
      {label:"Progresso",value:pct(g.progress)},
      {label:"Status",value:healthLabel(g.health)},
      {label:"Programas",value:programs?.length||0},
      {label:"Projetos",value:projects.length},
    ]}/>

    <div className="section-title"><h2>Programas</h2></div>
    <section className="card list">{!programs?.length?<div className="empty">Nenhum programa.</div>:programs.map(p=><Link className="row" href={`/app/program/${p.id}`} key={p.id}><div className="row-main"><div className="row-title">{p.name}</div><div className="row-sub">{pct(p.progress)} · {healthLabel(p.health)}</div></div><span className="row-arrow">›</span></Link>)}</section>

    <div className="section-title"><h2>Indicadores da direção</h2></div>
    <section className="card list">{!kpis?.length?<div className="empty">Nenhum KPI direto nesta direção.</div>:kpis.map((k:any)=><div className="row" key={k.id}><div className="row-main"><div className="row-title">{k.name}</div><div className="row-sub">Atual {k.current_value??'—'} {k.unit||''} · Meta {k.target??'—'}</div></div></div>)}</section>

    <SummaryCards items={[
      {label:"Riscos diretos",value:risks?.length||0},
      {label:"Orçamento direto",value:money((budgets||[]).reduce((a:any,b:any)=>a+Number(b.budget||0),0),budgets?.[0]?.currency||'BRL')},
    ]}/>

    <EntityActions type="group" id={g.id} initialTitle={g.name} initialDescription={g.description||''}/>
  </main>;
}
