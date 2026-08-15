"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

export function RecalcQueueControl({organizationId}:{organizationId:string}){
  const [busy,setBusy]=useState(false);const [msg,setMsg]=useState("");
  async function process(){setBusy(true);setMsg("");const s=createClient();const {data,error}=await s.rpc("rpc_admin_process_recalc_queue",{p_organization_id:organizationId,p_limit:500});setMsg(error?error.message:`${data||0} projetos recalculados.`);setBusy(false)}
  return <button className="btn btn-primary btn-block" onClick={()=>void process()} disabled={busy}>{busy?"Processando...":"Processar fila agora"}{msg&&<span style={{display:"block",fontSize:11,marginTop:4}}>{msg}</span>}</button>;
}
