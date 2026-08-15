import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {ContextNav} from "@/components/context-nav";
import {ActivityInteractiveDashboard} from "@/components/activity-interactive-dashboard";

function inclusiveDays(start:string|null,due:string|null){
  if(!start||!due)return 0;
  const a=new Date(`${start}T12:00:00Z`).getTime();
  const b=new Date(`${due}T12:00:00Z`).getTime();
  if(!Number.isFinite(a)||!Number.isFinite(b)||b<a)return 0;
  return Math.floor((b-a)/86400000)+1;
}

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
  const risk:any=Array.isArray(riskRows)?riskRows[0]:riskRows;
  const externalOwnerName=String((a as any).external_owner_name||"").trim()||null;
  const ownerName=externalOwnerName||(a as any).profiles?.full_name||"Sem responsável";
  const project=(a as any).projects;
  const program=project?.programs;
  const group=program?.groups;
  const days=inclusiveDays(a.start_date||null,a.due_date||null);
  const activityMaxHours=days*10;

  return <main className="page" style={{maxWidth:"100%",overflowX:"hidden"}}>
    <ContextNav organizationName={w.name} group={group} program={program} project={project}/>
    <span className="eyebrow">Atividade</span>
    <h1>{a.title}</h1>

    {days>0&&<div className="notice" style={{marginTop:10}}>
      <strong>Limite de planejamento:</strong> até {activityMaxHours} h nesta atividade ({days} dias corridos × 10 h/dia, incluindo sábados e domingos). A soma das atividades do mesmo responsável também não pode ultrapassar 10 h em um mesmo dia.
    </div>}

    {risk?.has_risk&&<section className="card" style={{marginTop:12,border:"1px solid #f0b429",background:"#fff8e6"}}>
      <div className="eyebrow" style={{color:"#9a5b00"}}>Risco de jornada — corrigir</div>
      <h2 style={{marginTop:4,marginBottom:8}}>Planejamento exige revisão</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8,marginBottom:10}}>
        <div><div className="muted" style={{fontSize:11}}>Pico diário</div><strong>{Number(risk.max_daily_hours||0).toLocaleString("pt-BR",{maximumFractionDigits:2})} h</strong></div>
        <div><div className="muted" style={{fontSize:11}}>Pico semanal</div><strong>{Number(risk.max_weekly_hours||0).toLocaleString("pt-BR",{maximumFractionDigits:2})} h</strong></div>
        <div><div className="muted" style={{fontSize:11}}>Dias seguidos</div><strong>{Number(risk.max_consecutive_days||0)}</strong></div>
      </div>
      {(risk.risk_messages||[]).map((m:string)=><div key={m} style={{fontWeight:700,fontSize:13,marginTop:5}}>• {m}</div>)}
      <div className="muted" style={{fontSize:11,marginTop:10}}>Alerta preventivo de planejamento. Regras especiais, escalas e instrumentos coletivos podem alterar a análise jurídica aplicável.</div>
    </section>}

    <ActivityInteractiveDashboard
      id={a.id}
      organizationId={a.organization_id}
      userId={userId}
      progress={Number(a.progress||0)}
      status={String(a.status||"")}
      startDate={a.start_date||null}
      dueDate={a.due_date||null}
      completedAt={a.completed_at||null}
      estimatedHours={a.estimated_hours==null?null:Number(a.estimated_hours)}
      effortProfile={(a.effort_profile||"bell") as any}
      shiftedPeakTiming={(a.shifted_peak_timing||null) as any}
      ownerId={a.primary_owner_id||null}
      externalOwnerName={externalOwnerName}
      ownerName={ownerName}
      members={members}
      comments={comments}
      legacyDescription={a.description||null}
      workloadCurve={workloadCurve}
    />
  </main>;
}
