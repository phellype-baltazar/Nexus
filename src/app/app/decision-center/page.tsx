import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";

export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const {data}=await s.rpc("rpc_executive_decisions",{p_organization_id:w.id,p_limit:50});
  return <main className="page"><span className="eyebrow">Gestão</span><h1>Decisões</h1><p className="muted">Somente exceções que exigem ação. A operação detalhada continua dentro dos projetos e atividades.</p><section className="card list">{!data?.length?<div className="empty">Nenhuma decisão crítica pendente.</div>:data.map((i:any,index:number)=><Link className="row" href={i.path||"#"} key={`${i.category}-${i.entity_id}-${index}`}><div className="row-main"><div className="row-title">{i.title}</div><div className="row-sub">{i.category} · {i.reason}</div><div className="row-sub"><strong>Recomendação:</strong> {i.recommended_action}</div></div><span className={`chip ${i.severity>=90?"danger":i.severity>=70?"warning":""}`}>{i.severity}</span></Link>)}</section></main>;
}
