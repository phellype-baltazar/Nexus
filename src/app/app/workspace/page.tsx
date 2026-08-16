import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace, getMyRole } from "@/lib/workspace";
import { WorkspaceActions } from "@/components/workspace-actions";
import { WorkspaceOwnerSettings } from "@/components/workspace-owner-settings";
import { WorkspaceDeleteButton } from "@/components/workspace-delete-button";

const ROLE_LABELS: Record<string, string> = {
  organization_owner: "Owner",
  organization_admin: "Owner",
  group_admin: "Direção Manager",
  program_manager: "Program Manager",
  project_manager: "Project Manager",
  member: "Time",
  viewer: "Visualizador",
  guest: "Convidado",
};

function roleLabel(role?: string | null) {
  if (!role) return "Membro";
  return ROLE_LABELS[role] || role;
}

async function switchWorkspace(formData: FormData) {
  "use server";
  const organizationId = String(formData.get("organization_id") || "");
  if (!organizationId) redirect("/app/workspace");
  const s = await createClient();
  const { data: claims } = await s.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  if (!userId) redirect("/login");
  const { data, error } = await s.rpc("rpc_set_current_workspace", {p_organization_id: organizationId,p_group_id: null});
  if (error || data !== true) redirect("/app/workspace?switch=error");
  redirect("/app/dashboard");
}

export default async function Page({searchParams}:{searchParams: Promise<{ switch?: string }>}) {
  const { switch: switchStatus } = await searchParams;
  const s = await createClient();
  const w = await getCurrentWorkspace();
  if (!w) return <main className="page"><Link className="btn btn-primary" href="/onboarding">Configurar workspace</Link></main>;

  const { data: claims } = await s.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  const role = await getMyRole(w.id);
  const isOwner=role?.role === "organization_owner";
  const canInvite=isOwner || role?.role === "organization_admin";
  let invite: any = null;
  if (canInvite) {
    const { data } = await s.rpc("rpc_get_workspace_invite_code", {p_organization_id: w.id});
    invite = data;
  }

  const [{ data: members }, { data: myMemberships }] = await Promise.all([
    s.from("organization_members").select("user_id,role,status").eq("organization_id", w.id),
    s.from("organization_members").select("organization_id,role,status,organizations(id,name,slug)").eq("user_id", userId).eq("status", "active"),
  ]);

  const workspaces = (myMemberships || []).map((membership: any) => ({id: membership.organizations?.id,name: membership.organizations?.name,slug: membership.organizations?.slug,role: membership.role})).filter((workspace: any) => workspace.id && workspace.name).sort((a: any, b: any) => a.name.localeCompare(b.name, "pt-BR"));

  return <main className="page">
    <span className="eyebrow">Organização</span>
    <h1>{w.name}</h1>
    <p className="muted">Seu workspace atual.</p>

    {switchStatus === "error" && <div className="error">Não foi possível trocar de workspace. Verifique sua permissão.</div>}

    <section className="card">
      <div className="eyebrow">Seu papel</div>
      <div style={{fontWeight:900,fontSize:18,marginTop:7}}>{roleLabel(role?.role)}</div>
      <div className="row-sub">{members?.length || 0} membros</div>
    </section>

    {isOwner && <WorkspaceOwnerSettings organizationId={w.id} organizationName={w.name}/>} 
    {canInvite && <WorkspaceActions organizationId={w.id} organizationName={w.name} initial={invite}/>}

    <div className="section-title"><h2>Trocar workspace</h2></div>
    <section className="card list">
      {workspaces.map((org: any) => {
        const active = org.id === w.id;
        const owner = org.role === "organization_owner";
        return <form className="row" action={switchWorkspace} key={org.id} style={{gap:10}}>
          <input type="hidden" name="organization_id" value={org.id}/>
          <div className="row-main"><div className="row-title">{org.name}</div><div className="row-sub">{roleLabel(org.role)}{active ? " · workspace atual" : ""}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            {owner&&<WorkspaceDeleteButton organizationId={org.id} organizationName={org.name} active={active}/>} 
            <button className={`btn ${active ? "btn-secondary" : "btn-outline"}`} type="submit" disabled={active}>{active ? "Ativo" : "Usar"}</button>
          </div>
        </form>;
      })}
    </section>

    <section className="card"><Link className="btn btn-secondary btn-block" href="/onboarding">Criar ou entrar em outro workspace</Link></section>
  </main>;
}
