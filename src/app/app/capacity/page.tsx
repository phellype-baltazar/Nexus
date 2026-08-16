import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {CapacityManager} from "@/components/capacity-manager";
import {CapacitySettings} from "@/components/capacity-settings";

function iso(d:Date){return d.toISOString().slice(0,10)}
function monthKey(date:string){return date.slice(0,7)}
function monthLabel(key:string){const [y,m]=key.split("-").map(Number);return new Intl.DateTimeFormat("pt-BR",{month:"short",year:"2-digit",timeZone:"UTC"}).format(new Date(Date.UTC(y,m-1,1))).replace(". de ","/").replace(".","")}
function fmt(n:number){return n.toLocaleString("pt-BR",{maximumFractionDigits:1})}

export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const from=new Date();from.setUTCHours(0,0,0,0);from.setUTCDate(1);
  const to=new Date(Date.UTC(from.getUTCFullYear(),from.getUTCMonth()+12,0));

  const[{data:daily},{data},{data:members},{data:projects}]=await Promise.all([
    s.rpc("rpc_capacity_daily",{p_organization_id:w.id,p_from:iso(from),p_to:iso(to)}),
    s.from("resource_allocations").select("*,profiles(full_name),projects(name),activities(title)").eq("organization_id",w.id).order("start_date"),
    s.rpc("rpc_admin_members",{p_organization_id:w.id}),
    s.from("projects").select("id,name").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name")
  ]);

  const months:string[]=[];
  for(let i=0;i<12;i++){const d=new Date(Date.UTC(from.getUTCFullYear(),from.getUTCMonth()+i,1));months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}`)}

  type Cell={planned:number;capacity:number;overDays:number;legalDays:number};
  const owners=new Map<string,{name:string;cells:Map<string,Cell>;totalPlanned:number;totalCapacity:number}>();
  for(const r of daily||[]){
    const key=String((r as any).owner_key),date=String((r as any).work_date),mk=monthKey(date);
    if(!months.includes(mk))continue;
    const o=owners.get(key)||{name:String((r as any).owner_name||"Pessoa"),cells:new Map<string,Cell>(),totalPlanned:0,totalCapacity:0};
    const c=o.cells.get(mk)||{planned:0,capacity:0,overDays:0,legalDays:0};
    const h=Number((r as any).planned_hours||0),cap=Number((r as any).capacity_hours||0);
    c.planned+=h;c.capacity+=cap;if((r as any).over_capacity)c.overDays++;if((r as any).legal_risk)c.legalDays++;
    o.totalPlanned+=h;o.totalCapacity+=cap;o.cells.set(mk,c);owners.set(key,o);
  }

  const ownerRows=[...owners.entries()].map(([key,o])=>({key,...o,util:o.totalCapacity>0?o.totalPlanned/o.totalCapacity*100:(o.totalPlanned>0?999:0)})).sort((a,b)=>{
    if(a.key==="unassigned")return -1;if(b.key==="unassigned")return 1;return a.name.localeCompare(b.name,"pt-BR");
  });
  const sums=new Map<string,number>();(data||[]).forEach((a:any)=>sums.set(a.user_id,(sums.get(a.user_id)||0)+Number(a.allocation_percent||0)));

  return <main className="page">
    <span className="eyebrow">Pessoas</span><h1>Workload & Capacidade</h1><p className="muted">Visão mensal da carga planejada por pessoa. Cada célula mostra horas previstas e utilização da capacidade disponível.</p>

    <section className="card" style={{padding:0,overflow:"hidden"}}>
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <table style={{borderCollapse:"separate",borderSpacing:0,minWidth:Math.max(720,180+ownerRows.length*150),width:"100%"}}>
          <thead>
            <tr>
              <th style={{position:"sticky",left:0,zIndex:3,background:"var(--surface,#fff)",minWidth:110,padding:"14px 12px",textAlign:"left",borderBottom:"1px solid var(--border,#e2e8f0)"}}>Mês</th>
              {ownerRows.map(o=><th key={o.key} style={{minWidth:150,padding:"14px 10px",textAlign:"center",borderBottom:"1px solid var(--border,#e2e8f0)",fontSize:14,lineHeight:1.2}}>{o.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {months.map(m=><tr key={m}>
              <th style={{position:"sticky",left:0,zIndex:2,background:"var(--surface,#fff)",padding:"15px 12px",textAlign:"left",borderBottom:"1px solid var(--border,#e2e8f0)",whiteSpace:"nowrap"}}>{monthLabel(m)}</th>
              {ownerRows.map(o=>{const c=o.cells.get(m)||{planned:0,capacity:0,overDays:0,legalDays:0};const util=c.capacity>0?c.planned/c.capacity*100:(c.planned>0?999:0);const tone=c.legalDays>0||util>110?{bg:"#fff1f2",fg:"#b42318"}:util>90?{bg:"#fff7e6",fg:"#9a5b00"}:c.planned>0?{bg:"#ecfdf3",fg:"#067647"}:{bg:"transparent",fg:"#667085"};return <td key={o.key} style={{padding:"8px",borderBottom:"1px solid var(--border,#e2e8f0)",textAlign:"center"}}><div style={{background:tone.bg,color:tone.fg,borderRadius:12,padding:"10px 8px",minHeight:62,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><strong style={{fontSize:16}}>{fmt(c.planned)} h</strong><span style={{fontSize:12,marginTop:2}}>{c.capacity>0?`${Math.round(util)}% da capacidade`:c.planned>0?"sem capacidade":"—"}</span></div></td>})}
            </tr>)}
          </tbody>
        </table>
      </div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",padding:"12px 14px",fontSize:12,color:"var(--muted,#667085)"}}><span>🟢 até 90%</span><span>🟡 91–110%</span><span>🔴 acima de 110% / risco</span></div>
    </section>

    <section className="card list" style={{marginTop:14}}>{!ownerRows.length?<div className="empty">Nenhuma carga planejada no período.</div>:ownerRows.map(o=>{const overloaded=o.util>100;return <div className="row" key={o.key}><div className="row-main"><div className="row-title">{o.name}</div><div className="row-sub">12 meses: {fmt(o.totalPlanned)} h planejadas / {fmt(o.totalCapacity)} h disponíveis · utilização {Math.min(o.util,999).toLocaleString("pt-BR",{maximumFractionDigits:0})}%</div></div><span className={`chip ${overloaded?"danger":"success"}`}>{overloaded?"Sobrecarga":"OK"}</span></div>})}</section>

    <div className="section-title"><h2>Capacidade e ausências</h2></div><CapacitySettings organizationId={w.id} members={(members||[]) as any[]}/>

    <div className="section-title"><h2>Alocações administrativas</h2></div>
    <section className="card list">{!data?.length?<div className="empty">Nenhuma alocação percentual registrada.</div>:data.map((a:any)=><div className="row" key={a.id}><div className="row-main"><div className="row-title">{a.profiles?.full_name||"Pessoa"}</div><div className="row-sub">{a.projects?.name||a.activities?.title||"Contexto"} · {a.allocation_percent}%</div></div><span className={`chip ${(sums.get(a.user_id)||0)>100?"danger":""}`}>{sums.get(a.user_id)||0}% total</span></div>)}</section>
    <div className="section-title"><h2>Planejar alocação</h2></div><CapacityManager organizationId={w.id} members={members||[]} projects={projects||[]}/>
  </main>;
}
