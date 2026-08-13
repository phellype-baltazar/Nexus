"use client";
import {useState} from "react";import {createClient} from "@/lib/supabase/client";
export function WorkspaceActions({organizationId,initial}:{organizationId:string,initial:any}){
 const[info,setInfo]=useState<any>(initial);const[msg,setMsg]=useState("");const[joinMode,setJoinMode]=useState(initial?.join_mode||"request");const s=createClient();
 async function regen(){setMsg("");const{data,error}=await s.rpc("rpc_regenerate_workspace_invite_code",{p_organization_id:organizationId,p_join_mode:joinMode,p_expires_at:null,p_max_uses:null});if(error)setMsg(error.message);else{setInfo(data);setMsg("Novo código gerado.")}}
 async function copy(){if(info?.code){await navigator.clipboard.writeText(info.code);setMsg("Código copiado.")}}
 return <section className="card form"><h2>Código de convite</h2>{info?.code?<><div className="codebox">{info.code}</div><div className="field"><label>Modo de entrada</label><select className="select" value={joinMode} onChange={e=>setJoinMode(e.target.value)}><option value="request">Exigir aprovação</option><option value="auto_join">Entrada automática como Member</option></select></div><button className="btn btn-primary btn-block" onClick={copy}>Copiar código</button><button className="btn btn-outline btn-block" onClick={regen}>Regenerar código</button></>:<button className="btn btn-primary btn-block" onClick={regen}>Gerar código</button>}{msg&&<div className="successbox">{msg}</div>}</section>
}
