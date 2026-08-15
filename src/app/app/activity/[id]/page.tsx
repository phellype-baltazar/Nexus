import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {ContextNav} from "@/components/context-nav";
import {ActivityInteractiveDashboard} from "@/components/activity-interactive-dashboard";
import {ActivityScheduleTools} from "@/components/activity-schedule-tools";

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

  const project=(a as any).projects;
  const projectId=String(project?.id||a.project_id||"");

  const [
    {data:memberRows},{data:commentRows},{data:workloadRows},{data:riskRows},
    {data:projectActivities},{data:dependencyRows},{data:scheduleSnapshot}
  ]=await Promise.all([
    s.from("organization_members").select("user_id,profiles!organization_members_user_id_fkey(full_name)").eq("organization_id",a.organization_id).eq("status","active"),
    s.from("comments").select("id,body,created_at,profiles!comments_author_user_id_fkey(full_name)").eq("entity_type","activity").eq("entity_id",id).is("deleted_at",null).order("created_at",{ascending:true}),
    s.rpc("rpc_activity_workload_curve",{p_activity_id:id}),
    s.rpc("rpc_activity_workload_risk",{p_activity_id:id}),
    s.from("activities").select("id,title").eq("project_id",projectId).is("deleted_at",null).order("start_date",{ascending:true}).order("title"),
    s.from("activity_dependencies").select("id,activity_id,depends_on_activity_id,dependency_type,lag_days,note").eq("project_id",projectId).order("created_at"),
    s.rpc("rpc_project_schedule_snapshot",{p_project_id:projectId})
  ]);

  const members=(memberRows||[]).map((m:any)=>({user_id:m.user_id,full_name:m.profiles?.full_name||null}));
  const comments=(commentRows||[]).map((c:any)=>({id:c.id,body:c.body,created_at:c.created_at,author_name:c.profiles?.full_name||"Usuário"}));
  const workloadCurve=(workloadRows||[]).map((r:any)=>({work_date:String(r.work_date),planned_hours:Number(r.planned_hours||0),relative_weight:Number(r.relative_weight||0)}));
  const riskMessages=Array.isArray((riskRows||[])[0]?.risk_messages)?(riskRows||[])[0].risk_messages:[];
  const externalOwnerName=String((a as any).external_owner_name||"").trim()||null;
  const ownerName=externalOwnerName||(a as any).profiles?.full_name||"Sem responsável";
  const program=project?.programs;
  const group=program?.groups;

  const snapshot=(scheduleSnapshot as any)||{};
  const scheduleRows=Array.isArray(snapshot?.schedule)?snapshot.schedule:[];
  const schedule=scheduleRows.map((r:any)=>({
    activity_id:String(r.activity_id),title:String(r.title||"Atividade"),start_date:String(r.start_date),finish_date:String(r.finish_date),duration_days:Number(r.duration_days||1),early_start:String(r.early_start),early_finish:String(r.early_finish),late_start:String(r.late_start),late_finish:String(r.late_finish),total_float_days:Number(r.total_float_days||0),is_critical:Boolean(r.is_critical),predecessor_count:Number(r.predecessor_count||0),successor_count:Number(r.successor_count||0),owner_name:String(r.owner_name||"Sem responsável"),progress:Number(r.progress||0),status:String(r.status||"")
  }));

  return <main className="page" style={{maxWidth:"100%",overflowX:"hidden"}}>
    <ContextNav organizationName={w.name} group={group} program={program} project={project}/>
    <span className="eyebrow">Atividade</span>
    <h1>{a.title}</h1>

    <ActivityScheduleTools
      organizationId={a.organization_id}
      projectId={projectId}
      projectName={project?.name||"Projeto"}
      currentActivityId={a.id}
      activities={(projectActivities||[]).map((x:any)=>({id:String(x.id),title:String(x.title||"Atividade")}))}
      dependencies={(dependencyRows||[]).map((x:any)=>({id:String(x.id),activity_id:String(x.activity_id),depends_on_activity_id:String(x.depends_on_activity_id),dependency_type:x.dependency_type,lag_days:Number(x.lag_days||0),note:x.note||null}))}
      schedule={schedule}
      optimization={(snapshot?.optimization as any)||null}
    />

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
      remainingWorkHours={(a as any).remaining_work_hours==null?null:Number((a as any).remaining_work_hours)}
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
