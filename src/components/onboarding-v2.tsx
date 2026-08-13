"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export function OnboardingV2(){
  const [mode,setMode]=useState<"create"|"code"|"search">("create");
  const [name,setName]=useState(""); const [code,setCode]=useState(""); const [q,setQ]=useState("");
  const [results,setResults]=useState<any[]>([]); const [msg,setMsg]=useState("");
  const s=createClient();

  async function create(e:React.FormEvent){e.preventDefault();setMsg("");const{error}=await s.rpc("rpc_create_organization",{p_name:name,p_description:null});if(error)setMsg(error.message);else location.href="/app/workspace"}
  async function join(e:React.FormEvent){e.preventDefault();setMsg("");const{data,error}=await s.rpc("rpc_join_workspace_by_code",{p_code:code,p_message:null});if(error)setMsg(error.message);else{setMsg((data as any)?.status==="pending"?"Solicitação enviada para aprovação.":"Acesso realizado.");setTimeout(()=>location.href="/app/dashboard",900)}}
  async function search(e:React.FormEvent){e.preventDefault();const{data,error}=await s.rpc("rpc_search_organizations",{p_query:q});if(error)setMsg(error.message);else setResults(data||[])}
  async function request(id:string){const{error}=await s.rpc("rpc_request_access",{p_organization_id:id,p_group_id:null,p_message:null});setMsg(error?error.message:"Solicitação enviada.")}

  return <div className="form">
    <div className="tabs">
      <button className={`tab ${mode==="create"?"active":""}`} onClick={()=>setMode("create")}>Criar workspace</button>
      <button className={`tab ${mode==="code"?"active":""}`} onClick={()=>setMode("code")}>Usar código</button>
      <button className={`tab ${mode==="search"?"active":""}`} onClick={()=>setMode("search")}>Buscar</button>
    </div>
    {mode==="create"&&<form className="form" onSubmit={create}><div className="field"><label>Nome do workspace</label><input className="input" value={name} onChange={e=>setName(e.target.value)} required/></div><div className="notice">O nome precisa ser único no Nexus. Se já existir, o backend bloqueia.</div><button className="btn btn-primary btn-block">Criar workspace</button></form>}
    {mode==="code"&&<form className="form" onSubmit={join}><div className="field"><label>Código de convite</label><input className="input" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} required/></div><button className="btn btn-primary btn-block">Entrar com código</button></form>}
    {mode==="search"&&<><form className="form" onSubmit={search}><div className="field"><label>Buscar organização</label><input className="input" value={q} onChange={e=>setQ(e.target.value)} required/></div><button className="btn btn-secondary btn-block">Buscar</button></form>{results.map(r=><div className="row" key={r.organization_id}><div className="row-main"><div className="row-title">{r.organization_name}</div><div className="row-sub">{r.member_count} membros</div></div><button className="btn btn-outline" onClick={()=>request(r.organization_id)}>Solicitar</button></div>)}</>}
    {msg&&<div className={msg.toLowerCase().includes("já existe")?"error":"successbox"}>{msg}</div>}
  </div>
}
