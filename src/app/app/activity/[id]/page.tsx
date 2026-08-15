import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {ContextNav} from "@/components/context-nav";
import {SummaryCards} from "@/components/summary-cards";
import {ActivityActionEditor} from "@/components/activity-action-editor";
import {dateBR,pct} from "@/lib/format";

function activityStatus(status:string,dueDate:string|null){
  if(status==="done") return "Feita";
  if(status==="cancelled") return "Cancelada";
  const today=new Date().toISOString().slice(0,10);
  if(dueDate&&dueDate<today) return "Atrasada";
  return "Em andamento";
}

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const s=await createClient();
  const w=await getCurrentWorkspace();
  if(!w)return null;

  const {data:a}=await s.from("activities")
    .select("*,profiles!activities_primary_owner_id_fkey(id,full_name),projects(id,name,programs(id,name,groups(id,name)))")
    .eq("id",id).is("deleted_at",null).maybeSingle();

  if(!a)return <main className="page"><h1>Atividade</h1><div className="card">Não encontrada ou sem permissão.</div></main>;

  const {data:memberRows}=await s.from("organization_members")
    .select("user_id,profiles!organization_members_user_id_fkey(full_name)")
    .eq("organization_id",a.organization_id)
    .eq("status","active");

  const members=(memberRows||[]).map((m:any)=>({user_id:m.user_id,full_name:m.profiles?.full_name||null}));
  const ownerName=(a as any).profiles?.full_name||"Sem responsável";
  const visualStatus=activityStatus(String(a.status||""),a.due_date||null);
  const project=(a as any).projects;
  const program=project?.programs;
  const group=program?.groups;

  return <main className="page" style={{maxWidth:"100%",overflowX:"hidden"}}>
    <ContextNav organizationName={w.name} group={group} program={program} project={project}/>
    <span className="eyebrow">Atividade</span>
    <h1>{a.title}</h1>

    <SummaryCards items={[
      {label:"Progresso",value:pct(a.progress)},
      {label:"Status",value:visualStatus},
      {label:"Data prevista",value:dateBR(a.due_date)},
      {label:"Responsável",value:ownerName},
    ]}/>

    <section className="card" style={{marginTop:12}}>
      <h2>Detalhes</h2>
      <p className="muted">{a.description||"Sem descrição."}</p>
      {a.start_date&&<span className="chip">Início {dateBR(a.start_date)}</span>}
    </section>

    <ActivityActionEditor id={a.id} initialStatus={String(a.status)} dueDate={a.due_date||null} initialOwnerId={a.primary_owner_id||null} members={members}/>
  </main>;
}
