import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace,getMyRole} from "@/lib/workspace";
import {AccessDecisionButtons} from "@/components/access-decision-buttons";
import {MemberRoleEditor,roleLabel} from "@/components/member-role-editor";

export default async function Page(){
  const s=await createClient();
  const w=await getCurrentWorkspace();
  if(!w)return null;
  const myRole=await getMyRole(w.id);
  const canManage=myRole?.role==="organization_owner"||myRole?.role==="organization_admin";
  const[{data:members},{data:req}]=await Promise.all([
    s.rpc("rpc_admin_members",{p_organization_id:w.id}),
    s.rpc("rpc_admin_access_requests",{p_organization_id:w.id})
  ]);

  return <main className="page">
    <span className="eyebrow">Administração</span>
    <h1>Pessoas</h1>
    <p className="muted">Defina o nível de acesso de cada pessoa no workspace.</p>

    <section className="card" style={{display:"grid",gap:10}}>
      <div><strong>Owner</strong><div className="row-sub">Configura o app e cria Direções. Tem acesso total.</div></div>
      <div><strong>Program Manager</strong><div className="row-sub">Cria e gerencia Programas.</div></div>
      <div><strong>Project Manager</strong><div className="row-sub">Cria e gerencia Projetos e Ações.</div></div>
      <div><strong>Time</strong><div className="row-sub">Atualiza as Ações sob sua responsabilidade.</div></div>
    </section>

    <div className="section-title"><h2>Membros</h2></div>
    <section className="card list">
      {!members?.length?<div className="empty">Sem acesso administrativo ou nenhum membro.</div>:members.map((m:any)=><div className="row" key={m.user_id} style={{alignItems:"center"}}>
        <div className="row-main">
          <div className="row-title">{m.full_name||m.email||"Usuário"}</div>
          <div className="row-sub">{roleLabel(m.role)} · {m.status}</div>
        </div>
        {canManage&&<MemberRoleEditor organizationId={w.id} userId={m.user_id} role={m.role} isOwner={m.role==="organization_owner"}/>} 
      </div>)}
    </section>

    <div className="section-title"><h2>Solicitações</h2></div>
    <section className="card list">
      {!req?.length?<div className="empty">Nenhuma solicitação pendente.</div>:req.map((r:any)=><div className="row" key={r.request_id}>
        <div className="row-main"><div className="row-title">{r.requester_name||"Usuário"}</div><div className="row-sub">{r.message||"Solicitou acesso"}</div></div>
        <AccessDecisionButtons requestId={r.request_id}/>
      </div>)}
    </section>
  </main>;
}
