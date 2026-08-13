import {createClient} from "@/lib/supabase/server";import {getCurrentWorkspace} from "@/lib/workspace";import {money,dateBR} from "@/lib/format";
export default async function Page(){const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
 const [{data:risks},{data:kpis},{data:budgets},{data:benefits},{data:meetings},{data:decisions}] = await Promise.all([
  s.from("risks").select("id,title,score,status,review_date").eq("organization_id",w.id).is("deleted_at",null).order("score",{ascending:false}),
  s.from("kpis").select("id,name,current_value,target,unit,trend").eq("organization_id",w.id).is("deleted_at",null),
  s.from("budgets").select("currency,budget,actual,committed,forecast,saving,benefit").eq("organization_id",w.id),
  s.from("benefits").select("id,name,benefit_type,target,realized,status").eq("organization_id",w.id).is("deleted_at",null),
  s.from("meetings").select("id,title,starts_at,status").eq("organization_id",w.id).is("deleted_at",null).order("starts_at",{ascending:false}).limit(10),
  s.from("decisions").select("id,title,status,decided_at").eq("organization_id",w.id).order("decided_at",{ascending:false}).limit(10)
 ]);
 const b=budgets?.[0];
 return <main className="page"><span className="eyebrow">Gestão avançada</span><h1>Hub de gestão</h1>
 <div className="section-title"><h2>Riscos</h2></div><section className="card list">{!risks?.length?<div className="empty">Nenhum risco.</div>:risks.map(r=><div className="row" key={r.id}><div className="row-main"><div className="row-title">{r.title}</div><div className="row-sub">{r.status} · revisão {dateBR(r.review_date)}</div></div><span className="chip warning">{r.score??0}</span></div>)}</section>
 <div className="section-title"><h2>KPIs</h2></div><section className="card list">{!kpis?.length?<div className="empty">Nenhum KPI.</div>:kpis.map(k=><div className="row" key={k.id}><div className="row-main"><div className="row-title">{k.name}</div><div className="row-sub">{k.current_value??"—"} {k.unit||""} / meta {k.target??"—"}</div></div><span className="chip">{k.trend||"—"}</span></div>)}</section>
 <div className="section-title"><h2>Finanças</h2></div><section className="grid grid-2">{["budget","actual","forecast","saving"].map(k=><div className="card" key={k}><div className="eyebrow">{k}</div><div style={{fontWeight:900,fontSize:18,marginTop:6}}>{money((b as any)?.[k],b?.currency||"BRL")}</div></div>)}</section>
 <div className="section-title"><h2>Benefícios</h2></div><section className="card list">{!benefits?.length?<div className="empty">Nenhum benefício.</div>:benefits.map(x=><div className="row" key={x.id}><div className="row-main"><div className="row-title">{x.name}</div><div className="row-sub">{x.benefit_type} · {x.status}</div></div><span className="chip">{x.realized??0}/{x.target??0}</span></div>)}</section>
 <div className="section-title"><h2>Reuniões e decisões</h2></div><section className="card list">{meetings?.map(m=><div className="row" key={m.id}><div className="row-main"><div className="row-title">{m.title}</div><div className="row-sub">{dateBR(m.starts_at)} · {m.status}</div></div></div>)}{decisions?.map(d=><div className="row" key={d.id}><div className="row-main"><div className="row-title">Decisão: {d.title}</div><div className="row-sub">{d.status} · {dateBR(d.decided_at)}</div></div></div>)}{!meetings?.length&&!decisions?.length&&<div className="empty">Sem reuniões ou decisões.</div>}</section>
 </main>
}
