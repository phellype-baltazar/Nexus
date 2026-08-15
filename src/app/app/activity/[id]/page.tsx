import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {ContextNav} from "@/components/context-nav";
import {ActivityInteractiveDashboard} from "@/components/activity-interactive-dashboard";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const s=await createClient();
  const w=await getCurrentWorkspace();
  if(!w)return null;

  const {data:claims}=await s.auth.getClaims();
  const userId=String(claims?.claims?.sub||"");

  const {data:a}=await s.from("activities")
    .select("*,profiles!activities_primary_owner_id_fkey(id,full_name),projects(id,name,programs(id,name,groups(id,name)))")
    .eq("id",id).is("deleted_at",null).maybeSingle();

  if(!a)return <main className="page"><h1>Atividade</h1><div className="card">Não encontrada ou sem permissão.</div></main>;

  const [{data:memberRows},{data:commentRows}]=await Promise.all([
    s.from("organization_members")
      .select("user_id,profiles!organization_members_user_id_fkey(full_name)")
      .eq("organization_id",a.organization_id)
      .eq("status","active"),
    s.from("comments")
      .select("id,body,created_at,profiles!comments_author_user_id_fkey(full_name)")
      .eq("entity_type","activity")
      .eq("entity_id",id)
      .is("deleted_at",null)
      .order("created_at",{ascending:true})
  ]);

  const members=(memberRows||[]).map((m:any)=>({user_id:m.user_id,full_name:m.profiles?.full_name||null}));
  const comments=(commentRows||[]).map((c:any)=>({id:c.id,body:c.body,created_at:c.created_at,author_name:c.profiles?.full_name||"Usuário"}));
  const ownerName=(a as any).profiles?.full_name||"Sem responsável";
  const project=(a as any).projects;
  const program=project?.programs;
  const group=program?.groups;

  return <main className="page" style={{maxWidth:"100%",overflowX:"hidden"}}>
    <ContextNav organizationName={w.name} group={group} program={program} project={project}/>
    <span className="eyebrow">Atividade</span>
    <h1>{a.title}</h1>

    <ActivityInteractiveDashboard
      id={a.id}
      organizationId={a.organization_id}
      userId={userId}
      progress={Number(a.progress||0)}
      status={String(a.status||"")}
      dueDate={a.due_date||null}
      completedAt={a.completed_at||null}
      ownerId={a.primary_owner_id||null}
      ownerName={ownerName}
      members={members}
      comments={comments}
      legacyDescription={a.description||null}
    />
  </main>;
}
