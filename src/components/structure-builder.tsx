"use client";
import {useState} from "react";
import Link from "next/link";
import {createClient} from "@/lib/supabase/client";

type ActivityDraft={title:string;start_date:string;due_date:string;priority:string};
type GroupOption={id:string;name:string};

export function StructureBuilder({organizationId,userId,groups}:{organizationId:string;userId:string;groups:GroupOption[]}) {
  const [groupId,setGroupId]=useState(groups[0]?.id||"");
  const [program,setProgram]=useState(""), [project,setProject]=useState("");
  const [programObjective,setProgramObjective]=useState(""), [projectDesc,setProjectDesc]=useState("");
  const [projectStart,setProjectStart]=useState(""), [projectEnd,setProjectEnd]=useState("");
  const [activities,setActivities]=useState<ActivityDraft[]>([{title:"",start_date:"",due_date:"",priority:"medium"}]);
  const [msg,setMsg]=useState(""), [busy,setBusy]=useState(false);

  function addActivity(){setActivities([...activities,{title:"",start_date:"",due_date:"",priority:"medium"}])}
  function updateActivity(i:number,k:keyof ActivityDraft,v:string){const a=[...activities];a[i]={...a[i],[k]:v};setActivities(a)}

  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg("");const s=createClient();
    try{
      if(!groupId) throw new Error("Selecione uma direção antes de continuar.");
      const {data:p,error:pe}=await s.from("programs").insert({organization_id:organizationId,group_id:groupId,name:program.trim(),objective:programObjective||null,owner_user_id:userId,start_date:projectStart||null,due_date:projectEnd||null}).select("id").single();
      if(pe) throw pe;
      const {data:pr,error:pre}=await s.from("projects").insert({organization_id:organizationId,program_id:p.id,name:project.trim(),description:projectDesc||null,owner_user_id:userId,start_date:projectStart||null,due_date:projectEnd||null}).select("id").single();
      if(pre) throw pre;
      const rows=activities.filter(a=>a.title.trim()).map(a=>({organization_id:organizationId,project_id:pr.id,title:a.title.trim(),start_date:a.start_date||null,due_date:a.due_date||null,priority:a.priority}));
      if(rows.length){const {error:ae}=await s.from("activities").insert(rows);if(ae) throw ae}
      location.href=`/app/project/${pr.id}`;
    }catch(err:any){setMsg(err?.message||"Não foi possível concluir a criação.");setBusy(false)}
  }

  if(!groups.length){
    return <section className="card form">
      <span className="eyebrow">Direção necessária</span>
      <h2>Crie uma direção primeiro</h2>
      <p className="muted">Programas, projetos e ações precisam estar vinculados a uma direção.</p>
      <Link className="btn btn-primary btn-block" href="/app/groups">Ir para Direções</Link>
    </section>;
  }

  return <form className="form" onSubmit={submit}>
    <section className="card form">
      <span className="eyebrow">1 · Direção</span>
      <div className="field"><label>Vincular à direção</label><select className="select" value={groupId} onChange={e=>setGroupId(e.target.value)} required>{groups.map(g=><option value={g.id} key={g.id}>{g.name}</option>)}</select></div>
      <div className="row-sub">A direção já existe e não será alterada por este fluxo.</div>
    </section>

    <section className="card form"><span className="eyebrow">2 · Programa</span><div className="field"><label>Nome do programa</label><input className="input" value={program} onChange={e=>setProgram(e.target.value)} required/></div><div className="field"><label>Objetivo</label><textarea className="textarea" value={programObjective} onChange={e=>setProgramObjective(e.target.value)}/></div></section>

    <section className="card form"><span className="eyebrow">3 · Projeto</span><div className="field"><label>Nome do projeto</label><input className="input" value={project} onChange={e=>setProject(e.target.value)} required/></div><div className="field"><label>Descrição</label><textarea className="textarea" value={projectDesc} onChange={e=>setProjectDesc(e.target.value)}/></div><div className="grid grid-2"><div className="field"><label>Início</label><input className="input" type="date" value={projectStart} onChange={e=>setProjectStart(e.target.value)}/></div><div className="field"><label>Fim</label><input className="input" type="date" value={projectEnd} onChange={e=>setProjectEnd(e.target.value)}/></div></div></section>

    <section className="card form"><div className="section-title" style={{margin:0}}><h2>4 · Ações</h2><button type="button" className="btn btn-secondary" onClick={addActivity}>+ Ação</button></div>{activities.map((a,i)=><div className="form" key={i} style={{paddingTop:10,borderTop:i?"1px solid var(--line)":"0"}}><div className="field"><label>Ação {i+1}</label><input className="input" value={a.title} onChange={e=>updateActivity(i,"title",e.target.value)}/></div><div className="grid grid-2"><div className="field"><label>Início</label><input className="input" type="date" value={a.start_date} onChange={e=>updateActivity(i,"start_date",e.target.value)}/></div><div className="field"><label>Fim</label><input className="input" type="date" value={a.due_date} onChange={e=>updateActivity(i,"due_date",e.target.value)}/></div></div><div className="field"><label>Prioridade</label><select className="select" value={a.priority} onChange={e=>updateActivity(i,"priority",e.target.value)}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="critical">Crítica</option></select></div></div>)}</section>

    <button className="btn btn-primary btn-block" disabled={busy}>{busy?"Criando...":"Criar programa, projeto e ações"}</button>
    {msg&&<div className="error">{msg}</div>}
  </form>
}
