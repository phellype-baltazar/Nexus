import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace,getMyRole} from "@/lib/workspace";
import {AccessDecisionButtons} from "@/components/access-decision-buttons";
import {MemberRoleEditor} from "@/components/member-role-editor";

const ROLE_LABELS:Record<string,string>={organization_owner:"Owner",organization_admin:"Owner",group_admin:"Diretor",program_manager:"Program Manager",project_manager:"Project Manager",member:"Time",viewer:"Visualizador",guest:"Convidado"};
function roleLabel(role?:string|null){return ROLE_LABELS[String(role||"")]||String(role||"Membro")}

export default async function Page(){
  const s=await createClient();
  const w=await getCurrentWorkspace();
  if(!w)return null;
  const myRole=await getMyRole(w.id);
  const myRoleName=String(myRole?.role||"");
  const isOwner=["organization_owner","organization_admin"].includes(myRoleName);
  const canApprove=["organization_owner","organization_admin","group_admin","program_manager","project_manager"].includes(myRoleName);

  const[{data:members},{data:req}]=await Promise.all([
    s.rpc("rpc_admin_members",{p_organization_id:w.id}),
    s.rpc("rpc_admin_access_requests",{p_organization_id:w.id})
  ]);
  const memberList=members||[];
  const requests=req||[];

  return <main className="page">
    <span className="eyebrow">Workspace</span>
    <h1>Pessoas</h1>
    <p className="muted">Membros, papéis e aprovações de acesso.</p>

    <section className="card" style={{padding:16,display:"grid",gap:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
        <div><div className="eyebrow">Seu nível</div><div style={{fontWeight:900,fontSize:20,marginTop:4}}>{roleLabel(myRoleName)}</div></div>
        <span className="chip">{memberList.length} membros</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>
        <div className="notice" style={{padding:10}}><strong>Diretor</strong><div className="row-sub">Owner aprova</div></div>
        <div className="notice" style={{padding:10}}><strong>Managers</strong><div className="row-sub">Diretor ou Owner</div></div>
        <div className="notice" style={{padding:10,gridColumn:"1 / -1"}}><strong>Time</strong><div className="row-sub">Manager, Diretor ou Owner</div></div>
      </div>
    </section>

    {canApprove&&<>
      <div className="section-title" style={{alignItems:"center"}}><h2>Solicitações</h2>{requests.length>0&&<span className="chip">{requests.length} pendente{requests.length===1?"":"s"}</span>}</div>
      <section style={{display:"grid",gap:10}}>
        {!requests.length?<div className="card empty" style={{padding:22}}>Nenhuma solicitação que dependa da sua aprovação.</div>:requests.map((r:any)=><article className="card" key={r.request_id} style={{padding:16,display:"grid",gap:12}}>
          <div>
            <div className="row-title" style={{fontSize:17}}>{r.requester_name||r.requester_email||"Usuário"}</div>
            <div className="row-sub" style={{marginTop:3}}>{r.message||"Solicitou entrada por convite"}</div>
            <div style={{marginTop:8}}><span className="chip">Solicitado: {roleLabel(r.requested_role||"member")}</span></div>
          </div>
          <AccessDecisionButtons requestId={r.request_id} requestedRole={r.requested_role||"member"} approverRole={myRoleName}/>
        </article>)}
      </section>
    </>}

    <div className="section-title"><h2>Membros</h2></div>
    <section style={{display:"grid",gap:10}}>
      {!memberList.length?<div className="card empty">Nenhum membro.</div>:memberList.map((m:any)=><article className="card" key={m.user_id} style={{padding:16,display:"grid",gap:10,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,minWidth:0}}>
          <div style={{minWidth:0,flex:1}}>
            <div className="row-title" style={{fontSize:17,overflowWrap:"anywhere"}}>{m.full_name||m.email||"Usuário"}</div>
            {m.full_name&&m.email&&<div className="row-sub" style={{overflowWrap:"anywhere",marginTop:2}}>{m.email}</div>}
          </div>
          <span className="chip" style={{flexShrink:0}}>{roleLabel(m.role)}</span>
        </div>
        {Array.isArray(m.groups)&&m.groups.length>0&&<div className="row-sub">{m.groups.map((g:any)=>g.name).join(" · ")}</div>}
        {isOwner&&m.role!=="organization_owner"&&<div style={{borderTop:"1px solid var(--border,#e5e7eb)",paddingTop:10}}><div className="row-sub" style={{marginBottom:6}}>Alterar papel</div><MemberRoleEditor organizationId={w.id} userId={m.user_id} role={m.role} isOwner={false}/></div>}
      </article>)}
    </section>
  </main>;
}
