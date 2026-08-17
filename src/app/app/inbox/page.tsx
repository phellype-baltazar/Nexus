import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace,getMyRole} from "@/lib/workspace";

export default async function Page(){
  const s=await createClient();
  const w=await getCurrentWorkspace();
  if(!w)return null;

  const myRole=await getMyRole(w.id);
  const role=String(myRole?.role||"");
  const canApprove=["organization_owner","organization_admin","group_admin","program_manager","project_manager"].includes(role);
  const inboxPromise=s.rpc("rpc_inbox",{p_organization_id:w.id,p_only_unread:false,p_limit:50});
  const requestsPromise=canApprove?s.rpc("rpc_admin_access_requests",{p_organization_id:w.id}):Promise.resolve({data:[] as any[]});
  const[{data},{data:requests}]=await Promise.all([inboxPromise,requestsPromise]);

  const items=Array.isArray(data)?data:(data as any)?.items||[];
  const pending=Array.isArray(requests)?requests:[];

  return <main className="page">
    <span className="eyebrow">Colaboração</span>
    <h1>Inbox</h1>
    <p className="muted">Menções, atribuições, aprovações e alertas.</p>

    {pending.length>0&&<section className="card" style={{borderColor:"#f59e0b",background:"#fffbeb"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
        <div><div className="row-title">{pending.length===1?"1 aprovação de acesso pendente":`${pending.length} aprovações de acesso pendentes`}</div><div className="row-sub" style={{marginTop:4}}>Há solicitações que podem ser aprovadas pelo seu nível de acesso.</div></div>
        <span className="chip" style={{background:"#fef3c7",color:"#92400e"}}>{pending.length}</span>
      </div>
      <Link className="btn btn-primary btn-block" href="/app/people" style={{marginTop:12}}>Revisar solicitações</Link>
    </section>}

    <section className="card list">
      {!items.length&&!pending.length?<div className="empty">Nenhuma pendência no momento.</div>:items.map((i:any,n:number)=><div className="row" key={i.id||n}><div className="row-main"><div className="row-title">{i.title||i.type||"Notificação"}</div><div className="row-sub">{i.body||i.reason||""}</div></div>{i.priority&&<span className="chip">{i.priority}</span>}</div>)}
    </section>
  </main>
}
