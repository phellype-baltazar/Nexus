"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {createClient} from "@/lib/supabase/client";

type ActivityDraft={title:string;start_date:string;due_date:string;priority:string};
type GroupOption={id:string;name:string};
type ProgramOption={id:string;name:string;group_id:string|null};

export function StructureBuilder({organizationId,userId,role,groups,programs}:{organizationId:string;userId:string;role:string;groups:GroupOption[];programs:ProgramOption[]}) {
  const isOwner=role==="organization_owner"||role==="organization_admin";
  const isProgramManager=role==="program_manager";
  const isProjectManager=role==="project_manager";
  const canCreateProgram=isOwner||isProgramManager;
  const canCreateProject=isOwner||isProjectManager;
  const [mode,setMode]=useState<"program"|"project">(canCreateProgram?"program":"project");
  const [groupId,setGroupId]=useState(groups[0]?.id||"");
  const filteredPrograms=useMemo(()=>programs.filter(p=>!groupId||p.group_id===groupId),[programs,groupId]);
  const [programId,setProgramId]=useState("");
  const [program,setProgram]=useState(""), [programObjective,setProgramObjective]=useState("");
  const [project,setProject]=useState(""), [projectDesc,setProjectDesc]=useState("");
  const [projectStart,setProjectStart]=useState(""), [projectEnd,setProjectEnd]=useState("");
  const [activities,setActivities]=useState<ActivityDraft[]>([{title:"",start_date:"",due_date:"",priority:"medium"}]);
  const [msg,setMsg]=useState(""), [busy,setBusy]=useState(false);

  function addActivity(){setActivities([...activities,{title:"",start_date:"",due_date:"",priority:"medium"}])}
  function updateActivity(i:number,k:keyof ActivityDraft,v:string){const a=[...activities];a[i]={...a[i],[k]:v};setActivities(a)}

  async function submitProgram(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg("");
    const s=createClient();
    try{
      if(!groupId)throw new Error("Selecione uma direção.");
      const{data,error}=await s.from("programs").insert({organization_id:organizationId,group_id:groupId,name:program.trim(),objective:programObjective||null,owner_user_id:userId}).select("id").single();
      if(error)throw error;
      location.href=`/app/program/${data.id}`;
    }catch(err:any){setMsg(err?.message||"Não foi possível criar o programa.");setBusy(false)}
  }

  async function submitProject(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg("");
    const s=createClient();
    try{
      const selectedProgram=programId||filteredPrograms[0]?.id;
      if(!selectedProgram)throw new Error("Selecione um programa existente.");
      const{data:pr,error:pre}=await s.from("projects").insert({organization_id:organizationId,program_id:selectedProgram,name:project.trim(),description:projectDesc||null,owner_user_id:userId,start_date:projectStart||null,due_date:projectEnd||null}).select("id").single();
      if(pre)throw pre;
      const rows=activities.filter(a=>a.title.trim()).map(a=>({organization_id:organizationId,project_id:pr.id,title:a.title.trim(),start_date:a.start_date||null,due_date:a.due_date||null,priority:a.priority}));
      if(rows.length){const{error:ae}=await s.from("activities").insert(rows);if(ae)throw ae}
      location.href=`/app/project/${pr.id}`;
    }catch(err:any){setMsg(err?.message||"Não foi possível criar o projeto.");setBusy(false)}
  }

  if(!isOwner&&!isProgramManager&&!isProjectManager){
    return <section className="card form">
      <span className="eyebrow">Seu papel · Time</span>
      <h2>Atualização de ações</h2>
      <p className="muted">Seu acesso é focado na execução. Você pode atualizar as ações sob sua responsabilidade, mas não criar Direções, Programas ou Projetos.</p>
      <Link className="btn btn-primary btn-block" href="/app/activities">Ver minhas ações</Link>
    </section>;
  }

  if(!groups.length){
    return <section className="card form"><span className="eyebrow">Direção necessária</span><h2>Não há direção disponível</h2><p className="muted">Programas e projetos precisam estar vinculados a uma direção.</p>{isOwner?<Link className="btn btn-primary btn-block" href="/app/groups">Criar Direção</Link>:<div className="notice">Peça ao Owner para criar uma Direção primeiro.</div>}</section>;
  }

  return <div className="form">
    {isOwner&&<section className="card"><div className="row-sub">Como Owner, você pode configurar o app, criar Direções e também atuar nos níveis abaixo.</div><Link className="btn btn-outline btn-block" href="/app/groups" style={{marginTop:10}}>Gerenciar Direções</Link></section>}

    {isOwner&&<div className="tabs"><button type="button" className={`tab ${mode==="program"?"active":""}`} onClick={()=>setMode("program")}>Programa</button><button type="button" className={`tab ${mode==="project"?"active":""}`} onClick={()=>setMode("project")}>Projeto + Ações</button></div>}

    {canCreateProgram&&mode==="program"&&<form className="form" onSubmit={submitProgram}>
      <section className="card form"><span className="eyebrow">Program Manager</span><h2>Criar Programa</h2><div className="field"><label>Direção</label><select className="select" value={groupId} onChange={e=>setGroupId(e.target.value)} required>{groups.map(g=><option value={g.id} key={g.id}>{g.name}</option>)}</select></div><div className="field"><label>Nome do programa</label><input className="input" value={program} onChange={e=>setProgram(e.target.value)} required/></div><div className="field"><label>Objetivo</label><textarea className="textarea" value={programObjective} onChange={e=>setProgramObjective(e.target.value)}/></div><button className="btn btn-primary btn-block" disabled={busy}>{busy?"Criando...":"Criar Programa"}</button></section>
      {msg&&<div className="error">{msg}</div>}
    </form>}

    {canCreateProject&&mode==="project"&&<form className="form" onSubmit={submitProject}>
      <section className="card form"><span className="eyebrow">Project Manager</span><h2>Criar Projeto</h2><div className="field"><label>Direção</label><select className="select" value={groupId} onChange={e=>{setGroupId(e.target.value);setProgramId("")}} required>{groups.map(g=><option value={g.id} key={g.id}>{g.name}</option>)}</select></div><div className="field"><label>Programa</label><select className="select" value={programId} onChange={e=>setProgramId(e.target.value)} required><option value="">Selecionar</option>{filteredPrograms.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></div><div className="field"><label>Nome do projeto</label><input className="input" value={project} onChange={e=>setProject(e.target.value)} required/></div><div className="field"><label>Descrição</label><textarea className="textarea" value={projectDesc} onChange={e=>setProjectDesc(e.target.value)}/></div><div className="grid grid-2"><div className="field"><label>Início</label><input className="input" type="date" value={projectStart} onChange={e=>setProjectStart(e.target.value)}/></div><div className="field"><label>Fim</label><input className="input" type="date" value={projectEnd} onChange={e=>setProjectEnd(e.target.value)}/></div></div></section>
      <section className="card form"><div className="section-title" style={{margin:0}}><h2>Ações</h2><button type="button" className="btn btn-secondary" onClick={addActivity}>+ Ação</button></div>{activities.map((a,i)=><div className="form" key={i} style={{paddingTop:10,borderTop:i?"1px solid var(--line)":"0"}}><div className="field"><label>Ação {i+1}</label><input className="input" value={a.title} onChange={e=>updateActivity(i,"title",e.target.value)}/></div><div className="grid grid-2"><div className="field"><label>Início</label><input className="input" type="date" value={a.start_date} onChange={e=>updateActivity(i,"start_date",e.target.value)}/></div><div className="field"><label>Fim</label><input className="input" type="date" value={a.due_date} onChange={e=>updateActivity(i,"due_date",e.target.value)}/></div></div><div className="field"><label>Prioridade</label><select className="select" value={a.priority} onChange={e=>updateActivity(i,"priority",e.target.value)}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="critical">Crítica</option></select></div></div>)}</section>
      <button className="btn btn-primary btn-block" disabled={busy}>{busy?"Criando...":"Criar Projeto e Ações"}</button>{msg&&<div className="error">{msg}</div>}
    </form>}
  </div>;
}
