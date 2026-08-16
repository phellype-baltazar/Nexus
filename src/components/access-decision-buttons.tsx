"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

const LABELS:Record<string,string>={program_manager:"Program Manager",project_manager:"Project Manager",member:"Time"};

export function AccessDecisionButtons({requestId,requestedRole="member"}:{requestId:string;requestedRole?:string}){
  const [role,setRole]=useState(["program_manager","project_manager","member"].includes(requestedRole)?requestedRole:"member");
  const [busy,setBusy]=useState(false);

  async function decide(ok:boolean){
    setBusy(true);
    const s=createClient();
    const{error}=await s.rpc("rpc_decide_access_request",{
      p_request_id:requestId,
      p_approve:ok,
      p_role:role,
      p_group_ids:[],
      p_valid_until:null,
      p_note:null
    });
    if(error){alert(error.message);setBusy(false);return}
    location.reload();
  }

  return <div style={{display:"grid",gap:8,minWidth:170}}>
    <div className="field" style={{margin:0}}>
      <label style={{fontSize:12}}>Acesso ao aprovar</label>
      <select className="select" value={role} onChange={e=>setRole(e.target.value)} disabled={busy}>
        <option value="program_manager">Program Manager</option>
        <option value="project_manager">Project Manager</option>
        <option value="member">Time</option>
      </select>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      <button className="btn btn-primary" disabled={busy} onClick={()=>decide(true)}>Aprovar</button>
      <button className="btn btn-outline" disabled={busy} onClick={()=>decide(false)}>Recusar</button>
    </div>
    <div className="row-sub" style={{fontSize:12}}>Solicitado: {LABELS[requestedRole]||"Time"}</div>
  </div>;
}
