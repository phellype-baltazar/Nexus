import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {CreateGroupForm} from "@/components/create-forms";

export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;const{data:c}=await s.auth.getClaims();const uid=String(c?.claims?.sub||"");const sp=await searchParams;const page=Math.max(1,Number(sp.page||1));const size=30;const from=(page-1)*size,to=from+size-1;
  const{data,count}=await s.from("groups").select("id,name,description,progress,health",{count:"exact"}).eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name").range(from,to);const pages=Math.max(1,Math.ceil((count||0)/size));
  return <main className="page"><span className="eyebrow">Portfólio</span><h1>Direções</h1><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginBottom:10}}><span className="muted">{count||0} direções</span><Link href="/app/search" className="chip">Buscar</Link></div><section className="card list">{!data?.length?<div className="empty">Nenhuma direção criada.</div>:data.map(g=><Link className="row" href={`/app/group/${g.id}`} key={g.id}><div className="row-main"><div className="row-title">{g.name}</div><div className="row-sub">{g.description||"Sem descrição"} · {Math.round(Number(g.progress||0))}%</div></div><span className="row-arrow">›</span></Link>)}</section><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"12px 0"}}>{page>1?<Link className="btn btn-outline" href={`/app/groups?page=${page-1}`}>Anterior</Link>:<span/>}<span className="muted">{page}/{pages}</span>{page<pages?<Link className="btn btn-outline" href={`/app/groups?page=${page+1}`}>Próxima</Link>:<span/>}</div><CreateGroupForm organizationId={w.id} userId={uid}/></main>;
}
