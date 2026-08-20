import Link from "next/link";
import {notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const s=await createClient();
  const w=await getCurrentWorkspace();
  if(!w)return null;
  const [{data:framework},{data:items},{data:links}]=await Promise.all([
    s.from("strategic_frameworks").select("*").eq("organization_id",w.id).eq("id",id).maybeSingle(),
    s.from("strategic_framework_items").select("*").eq("organization_id",w.id).eq("framework_id",id).order("sort_order"),
    s.from("strategic_links").select("source_id,target_id,target_type").eq("organization_id",w.id).eq("source_type","framework_item")
  ]);
  if(!framework)notFound();
  const rows=items||[];
  const categories=[...new Set(rows.map((x:any)=>x.category||"Itens"))] as string[];
  const linked=new Set((links||[]).filter((x:any)=>x.target_type==="project").map((x:any)=>x.source_id));
  return <main className="page">
    <Link href="/app/strategy" className="muted">‹ Estratégia</Link>
    <span className="eyebrow" style={{display:"block",marginTop:12}}>Referencial</span>
    <h1>{framework.name}</h1>
    <section className="card"><p className="muted" style={{margin:0}}>{framework.description||"Referencial estratégico do workspace."}</p></section>
    {categories.map(category=><div key={category}>
      <div className="section-title"><h2>{category}</h2></div>
      <section className="card list">{rows.filter((x:any)=>(x.category||"Itens")===category).map((x:any)=><div className="row" key={x.id} style={{alignItems:"flex-start"}}>
        <div className="row-main">
          <div className="row-title">{x.name}</div>
          <div className="row-sub">{[x.classification,x.target_text].filter(Boolean).join(" · ")}</div>
          {x.baseline_text&&<div style={{marginTop:8}}><strong>Baseline</strong><div className="row-sub">{x.baseline_text}</div></div>}
          {x.planned_delivery&&<div style={{marginTop:8}}><strong>Plano</strong><div className="row-sub">{x.planned_delivery}</div></div>}
        </div>
        {linked.has(x.id)&&<span className="chip">Coberto</span>}
      </div>)}</section>
    </div>)}
  </main>;
}
