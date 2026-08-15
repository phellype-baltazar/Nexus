import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {CreateProgramForm} from "@/components/create-forms";

export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;const sp=await searchParams;const page=Math.max(1,Number(sp.page||1));const size=30;const from=(page-1)*size,to=from+size-1;
  const[{data,count},{data:groups}]=await Promise.all([
    s.from("programs").select("id,name,objective,progress,health,groups(name)",{count:"exact"}).eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name").range(from,to),
    s.from("groups").select("id,name").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name")
  ]);const pages=Math.max(1,Math.ceil((count||0)/size));
  return <main className="page"><span className="eyebrow">Portfólio</span><h1>Programas</h1><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginBottom:10}}><span className="muted">{count||0} programas</span><Link href="/app/search" className="chip">Buscar</Link></div><section className="card list">{!data?.length?<div className="empty">Nenhum programa criado.</div>:data.map((p:any)=><Link className="row" href={`/app/program/${p.id}`} key={p.id}><div className="row-main"><div className="row-title">{p.name}</div><div className="row-sub">{p.groups?.name||"Sem direção"} · {Math.round(Number(p.progress||0))}%</div></div><span className="row-arrow">›</span></Link>)}</section><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"12px 0"}}>{page>1?<Link className="btn btn-outline" href={`/app/programs?page=${page-1}`}>Anterior</Link>:<span/>}<span className="muted">{page}/{pages}</span>{page<pages?<Link className="btn btn-outline" href={`/app/programs?page=${page+1}`}>Próxima</Link>:<span/>}</div><CreateProgramForm organizationId={w.id} groups={groups||[]}/></main>;
}
