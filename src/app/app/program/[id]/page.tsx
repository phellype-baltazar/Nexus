import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {ContextNav} from "@/components/context-nav";
import {EntityActions} from "@/components/entity-actions";
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
  return <main className="page"><ContextNav organizationName={w.name} group={(p as any).groups} program={{id:p.id,name:p.name}}/><span className="eyebrow">Programa</span><h1>{p.name}</h1><section className="grid grid-2"><div className="card"><div className="eyebrow">Progresso</div><div className="metric">{pct(p.progress)}</div></div><div className="card"><div className="eyebrow">Saúde</div><div style={{fontWeight:900,marginTop:8}}>{healthLabel(p.health)}</div></div><div className="card"><div className="eyebrow">Início</div><div style={{fontWeight:900,marginTop:8}}>{dateBR(p.start_date)}</div></div><div className="card"><div className="eyebrow">Fim</div><div style={{fontWeight:900,marginTop:8}}>{dateBR(p.due_date)}</div></div></section><section className="card"><h2>Objetivo</h2><p className="muted">{p.objective||p.description||'Sem objetivo registrado.'}</p></section><div className="section-title"><h2>Projetos</h2></div><section className="card list">{!projects?.length?<div className="empty">Nenhum projeto.</div>:projects.map(pr=><Link className="row" href={`/app/project/${pr.id}`} key={pr.id}><div className="row-main"><div className="row-title">{pr.name}</div><div className="row-sub">{dateBR(pr.start_date)} → {dateBR(pr.due_date)} · {pct(pr.progress)}</div></div><span className="row-arrow">›</span></Link>)}</section><div className="section-title"><h2>Indicadores do programa</h2></div><section className="card list">{!kpis?.length?<div className="empty">Nenhum KPI direto neste programa.</div>:kpis.map((k:any)=><div className="row" key={k.id}><div className="row-main"><div className="row-title">{k.name}</div><div className="row-sub">Atual {k.current_value??'—'} {k.unit||''} · Meta {k.target??'—'}</div></div></div>)}</section><section className="grid grid-2"><div className="card"><div className="eyebrow">Riscos diretos</div><div className="metric">{risks?.length||0}</div></div><div className="card"><div className="eyebrow">Orçamento direto</div><div style={{fontWeight:900,marginTop:8}}>{money((budgets||[]).reduce((a,b)=>a+Number(b.budget||0),0),budgets?.[0]?.currency||'BRL')}</div></div></section><EntityActions type="program" id={p.id} initialTitle={p.name} initialDescription={p.description||p.objective||''}/></main>
}
