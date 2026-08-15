import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {CapacityManager} from "@/components/capacity-manager";

function iso(d:Date){return d.toISOString().slice(0,10)}
function weekKey(date:string){const d=new Date(`${date}T12:00:00Z`);const day=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-day);return iso(d)}
function streak(dates:string[]){const sorted=[...new Set(dates)].sort();let best=0,current=0,prev="";for(const x of sorted){if(!prev)current=1;else{const diff=(new Date(`${x}T12:00:00Z`).getTime()-new Date(`${prev}T12:00:00Z`).getTime())/86400000;current=diff===1?current+1:1}best=Math.max(best,current);prev=x}return best}

export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const from=new Date();from.setUTCHours(0,0,0,0);const to=new Date(from);to.setUTCDate(to.getUTCDate()+30);
  const[{data:workload},{data},{data:members},{data:projects}]=await Promise.all([
    s.rpc("rpc_workload_by_owner",{p_organization_id:w.id,p_from:iso(from),p_to:iso(to)}),
    s.from("resource_allocations").select("*,profiles(full_name),projects(name),activities(title)").eq("organization_id",w.id).order("start_date"),
    s.rpc("rpc_admin_members",{p_organization_id:w.id}),
    s.from("projects").select("id,name").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name")
  ]);

  const owners=new Map<string,{name:string;total:number;peakDay:number;weeks:Map<string,number>;dates:string[]}>();
  for(const r of workload||[]){const key=String((r as any).owner_key),h=Number((r as any).planned_hours||0),date=String((r as any).work_date);const o=owners.get(key)||{name:String((r as any).owner_name||"Pessoa"),total:0,peakDay:0,weeks:new Map<string,number>(),dates:[]};o.total+=h;o.peakDay=Math.max(o.peakDay,h);o.weeks.set(weekKey(date),(o.weeks.get(weekKey(date))||0)+h);if(h>0)o.dates.push(date);owners.set(key,o)}
  const ownerRows=[...owners.entries()].map(([key,o])=>({key,...o,peakWeek:Math.max(0,...o.weeks.values()),streak:streak(o.dates)})).sort((a,b)=>b.peakWeek-a.peakWeek||b.total-a.total);
  const sums=new Map<string,number>();(data||[]).forEach((a:any)=>sums.set(a.user_id,(sums.get(a.user_id)||0)+Number(a.allocation_percent||0)));

  return <main className="page">
    <span className="eyebrow">Pessoas</span><h1>Workload & Capacidade</h1><p className="muted">Carga prevista por responsável nos próximos 30 dias, já considerando encerramentos, revisões e trocas de responsável.</p>
    <section className="card list">{!ownerRows.length?<div className="empty">Nenhuma carga planejada no período.</div>:ownerRows.map(o=>{const risk=o.peakDay>10||o.peakWeek>44||o.streak>=7;return <div className="row" key={o.key}><div className="row-main"><div className="row-title">{o.name}</div><div className="row-sub">30 dias: {o.total.toLocaleString("pt-BR",{maximumFractionDigits:1})} h · pico diário {o.peakDay.toLocaleString("pt-BR",{maximumFractionDigits:1})} h · pico semanal {o.peakWeek.toLocaleString("pt-BR",{maximumFractionDigits:1})} h · sequência {o.streak} dias</div></div><span className={`chip ${risk?"danger":"success"}`}>{risk?"Revisar":"OK"}</span></div>})}</section>

    <div className="section-title"><h2>Alocações administrativas</h2></div>
    <section className="card list">{!data?.length?<div className="empty">Nenhuma alocação percentual registrada.</div>:data.map((a:any)=><div className="row" key={a.id}><div className="row-main"><div className="row-title">{a.profiles?.full_name||"Pessoa"}</div><div className="row-sub">{a.projects?.name||a.activities?.title||"Contexto"} · {a.allocation_percent}%</div></div><span className={`chip ${(sums.get(a.user_id)||0)>100?"danger":""}`}>{sums.get(a.user_id)||0}% total</span></div>)}</section>
    <div className="section-title"><h2>Planejar alocação</h2></div><CapacityManager organizationId={w.id} members={members||[]} projects={projects||[]}/>
  </main>
}
