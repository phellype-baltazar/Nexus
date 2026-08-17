"use client";

import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

const LABELS:Record<string,string>={group_admin:"Diretor",program_manager:"Program Manager",project_manager:"Project Manager",member:"Time"};

function allowedRoles(approverRole:string){
  if(["organization_owner","organization_admin"].includes(approverRole))return ["group_admin","program_manager","project_manager","member"];
  if(approverRole==="group_admin")return ["program_manager","project_manager","member"];
  if(["program_manager","project_manager"].includes(approverRole))return ["member"];
  return [];
}

export function AccessDecisionButtons({requestId,requestedRole="member",approverRole}:{requestId:string;requestedRole?:string;approverRole:string}){
  const options=useMemo(()=>allowedRoles(approverRole),[approverRole]);
  const initial=options.includes(requestedRole)?requestedRole:(options[0]||"member");
  const [role,setRole]=useState(initial);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");

  async function decide(ok:boolean){
    setBusy(true);setMsg("");
    const s=createClient();
    const{error}=await s.rpc("rpc_decide_access_request",{p_request_id:requestId,p_approve:ok,p_role:role,p_group_ids:[],p_valid_until:null,p_note:null});
    if(error){setMsg(error.message);setBusy(false);return}
    location.reload();
  }

  if(!options.length)return null;

  return <div style={{display:"grid",gap:8,width:"100%"}}>
    <div className="field" style={{margin:0}}><label style={{fontSize:12}}>Acesso ao aprovar</label><select className="select" value={role} onChange={e=>setRole(e.target.value)} disabled={busy}>{options.map(r=><option key={r} value={r}>{LABELS[r]}</option>)}</select></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><button className="btn btn-primary" disabled={busy} onClick={()=>decide(true)}>{busy?"...":"Aprovar"}</button><button className="btn btn-outline" disabled={busy} onClick={()=>decide(false)}>Recusar</button></div>
    <div className="row-sub" style={{fontSize:12}}>Solicitado: {LABELS[requestedRole]||"Time"}</div>
    {msg&&<div className="error" style={{fontSize:12}}>{msg}</div>}
  </div>;
}
