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

  const [{data:memberRows},{data:commentRows},{data:workloadRows},{data:riskRows}]=await Promise.all([
    s.from("organization_members")
      .select("user_id,profiles!organization_members_user_id_fkey(full_name)")
      .eq("organization_id",a.organization_id)
      .eq("status","active"),
    s.from("comments")
      .select("id,body,created_at,profiles!comments_author_user_id_fkey(full_name)")
      .eq("entity_type","activity")
      .eq("entity_id",id)
      .is("deleted_at",null)
      .order("created_at",{ascending:true}),
    s.rpc("rpc_activity_workload_curve",{p_activity_id:id}),
    s.rpc("rpc_activity_workload_risk",{p_activity_id:id})
  ]);

  const members=(memberRows||[]).map((m:any)=>({user_id:m.user_id,full_name:m.profiles?.full_name||null}));
  const comments=(commentRows||[]).map((c:any)=>({id:c.id,body:c.body,created_at:c.created_at,author_name:c.profiles?.full_name||"Usuário"}));
  const workloadCurve=(workloadRows||[]).map((r:any)=>({work_date:String(r.work_date),planned_hours:Number(r.planned_hours||0),relative_weight:Number(r.relative_weight||0)}));
  const riskMessages=Array.isArray((riskRows||[])[0]?.risk_messages)?(riskRows||[])[0].risk_messages:[];
  const externalOwnerName=String((a as any).external_owner_name||"").trim()||null;
  const ownerName=externalOwnerName||(a as any).profiles?.full_name||"Sem responsável";
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
      startDate={a.start_date||null}
      dueDate={a.due_date||null}
      forecastDueDate={(a as any).forecast_due_date||a.due_date||null}
      completedAt={a.completed_at||null}
      estimatedHours={a.estimated_hours==null?null:Number(a.estimated_hours)}
      baselineEstimatedHours={(a as any).baseline_estimated_hours==null?null:Number((a as any).baseline_estimated_hours)}
      effortProfile={(a.effort_profile||"bell") as any}
      shiftedPeakTiming={(a.shifted_peak_timing||null) as any}
      ownerId={a.primary_owner_id||null}
      externalOwnerName={externalOwnerName}
      ownerName={ownerName}
      members={members}
      comments={comments}
      legacyDescription={a.description||null}
      workloadCurve={workloadCurve}
      riskMessages={riskMessages}
    />
  </main>;
}
