"use client";

import {useState} from "react";
import {Trash2,X} from "lucide-react";
import {deleteWorkspaceAction} from "@/app/app/workspace/actions";

export function WorkspaceDeleteButton({organizationId,organizationName,active}:{organizationId:string;organizationName:string;active:boolean}){
  const[open,setOpen]=useState(false);
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState("");

  async function remove(){
    setBusy(true);setMsg("");
    try{
      const result=await deleteWorkspaceAction(organizationId,organizationName.trim());
      if(!result?.ok){setMsg(result?.error||"Não foi possível excluir o workspace.");return;}
      setOpen(false);
      if(active) window.location.assign("/onboarding");
      else window.location.reload();
    }catch(e:any){
      setMsg(e?.message||"Não foi possível excluir o workspace.");
    }finally{
      setBusy(false);
    }
  }

  return <>
    <button
      type="button"
      aria-label={`Excluir ${organizationName}`}
      title="Excluir workspace"
      onClick={e=>{e.preventDefault();e.stopPropagation();setMsg("");setOpen(true);}}
      style={{width:44,height:44,borderRadius:14,border:"1px solid #f3b4ae",background:"#fff",color:"#b42318",display:"grid",placeItems:"center",flexShrink:0,cursor:"pointer"}}
    ><Trash2 size={19}/></button>

    {open&&<div onClick={()=>!busy&&setOpen(false)} style={{position:"fixed",inset:0,zIndex:1200,background:"rgba(15,23,42,.55)",display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(560px,100%)",background:"white",borderRadius:24,padding:20,boxShadow:"0 24px 60px rgba(0,0,0,.28)"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"}}>
          <div>
            <h3 style={{margin:0}}>Excluir workspace?</h3>
            <p className="row-sub" style={{margin:"6px 0 0"}}>Você está prestes a excluir <strong>{organizationName}</strong>. O workspace será desativado e o acesso dos membros será removido.</p>
          </div>
          <button type="button" onClick={()=>setOpen(false)} disabled={busy} aria-label="Fechar" style={{border:0,background:"transparent",padding:2}}><X size={21}/></button>
        </div>

        {msg&&<div className="error" style={{marginTop:12}}>{msg}</div>}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:18}}>
          <button type="button" className="btn btn-outline" onClick={()=>setOpen(false)} disabled={busy}>Cancelar</button>
          <button type="button" className="btn" onClick={remove} disabled={busy} style={{background:"#b42318",color:"#fff"}}>{busy?"Excluindo...":"Sim, excluir"}</button>
        </div>
      </div>
    </div>}
  </>;
}
