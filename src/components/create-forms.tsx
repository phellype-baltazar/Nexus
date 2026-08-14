"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function CreateGroupForm({organizationId,userId}:{organizationId:string,userId:string}){
 const[name,setName]=useState("");const[description,setDescription]=useState("");const[msg,setMsg]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();const s=createClient();const slug=name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")+"-"+Math.random().toString(36).slice(2,6);const{error}=await s.from("groups").insert({organization_id:organizationId,name:name.trim(),description:description||null,slug,owner_user_id:userId});if(error)setMsg(error.message);else location.reload()}
 return <form className="card form" onSubmit={submit}><h2>Nova direção</h2><div className="field"><label>Nome</label><input className="input" value={name} onChange={e=>setName(e.target.value)} required/></div><div className="field"><label>Descrição</label><textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)}/></div><button className="btn btn-primary btn-block">Criar direção</button>{msg&&<div className="error">{msg}</div>}</form>
}

export function CreateProgramForm({organizationId,groups}:{organizationId:string,groups:{id:string,name:string}[]}){
 const[name,setName]=useState("");const[group,setGroup]=useState(groups[0]?.id||"");const[obj,setObj]=useState("");const[msg,setMsg]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();const s=createClient();const{error}=await s.from("programs").insert({organization_id:organizationId,group_id:group,name:name.trim(),objective:obj||null});if(error)setMsg(error.message);else location.reload()}
 if(!groups.length)return <div className="notice">Crie uma direção antes de criar um programa.</div>;
 return <form className="card form" onSubmit={submit}><h2>Novo programa</h2><div className="field"><label>Direção</label><select className="select" value={group} onChange={e=>setGroup(e.target.value)}>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></div><div className="field"><label>Nome</label><input className="input" value={name} onChange={e=>setName(e.target.value)} required/></div><div className="field"><label>Objetivo</label><textarea className="textarea" value={obj} onChange={e=>setObj(e.target.value)}/></div><button className="btn btn-primary btn-block">Criar programa</button>{msg&&<div className="error">{msg}</div>}</form>
}

export function CreateProjectForm({organizationId,programs}:{organizationId:string,programs:{id:string,name:string}[]}){
 const[name,setName]=useState("");const[program,setProgram]=useState(programs[0]?.id||"");const[description,setDescription]=useState("");const[msg,setMsg]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();const s=createClient();const{error}=await s.from("projects").insert({organization_id:organizationId,program_id:program,name:name.trim(),description:description||null});if(error)setMsg(error.message);else location.reload()}
 if(!programs.length)return <div className="notice">Crie um programa antes de criar um projeto.</div>;
 return <form className="card form" onSubmit={submit}><h2>Novo projeto</h2><div className="field"><label>Programa</label><select className="select" value={program} onChange={e=>setProgram(e.target.value)}>{programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="field"><label>Nome</label><input className="input" value={name} onChange={e=>setName(e.target.value)} required/></div><div className="field"><label>Descrição</label><textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)}/></div><button className="btn btn-primary btn-block">Criar projeto</button>{msg&&<div className="error">{msg}</div>}</form>
}

export function CreateActivityForm({organizationId,projects}:{organizationId:string,projects:{id:string,name:string}[]}){
 const[title,setTitle]=useState("");const[project,setProject]=useState(projects[0]?.id||"");const[due,setDue]=useState("");const[msg,setMsg]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();const s=createClient();const{error}=await s.from("activities").insert({organization_id:organizationId,project_id:project,title:title.trim(),due_date:due||null});if(error)setMsg(error.message);else location.reload()}
 if(!projects.length)return <div className="notice">Crie um projeto antes de criar uma atividade.</div>;
 return <form className="card form" onSubmit={submit}><h2>Nova atividade</h2><div className="field"><label>Projeto</label><select className="select" value={project} onChange={e=>setProject(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="field"><label>Título</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)} required/></div><div className="field"><label>Prazo</label><input className="input" type="date" value={due} onChange={e=>setDue(e.target.value)}/></div><button className="btn btn-primary btn-block">Criar atividade</button>{msg&&<div className="error">{msg}</div>}</form>
}
