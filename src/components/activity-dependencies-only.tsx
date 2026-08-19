"use client";

import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type ActivityOption={id:string;title:string};
type Dependency={id:string;activity_id:string;depends_on_activity_id:string;dependency_type:"FS"|"SS"|"FF"|"SF";lag_days:number;note:string|null};

type Props={organizationId:string;projectId:string;currentActivityId:string;activities:ActivityOption[];dependencies:Dependency[];isCritical?:boolean;totalFloatDays?:number|null};

const TYPES=[
 {key:"FS",label:"FS · Finish → Start",hint:"O sucessor começa após o predecessor terminar."},
 {key:"SS",label:"SS · Start → Start",hint:"O sucessor pode iniciar junto/após o início do predecessor."},
 {key:"FF",label:"FF · Finish → Finish",hint:"O término do sucessor depende do término do predecessor."},
 {key:"SF",label:"SF · Start → Finish",hint:"O término do sucessor depende do início do predecessor."},
] as const;

export function ActivityDependenciesOnly({organizationId,projectId,currentActivityId,activities,dependencies,isCritical=false,totalFloatDays=null}:Props){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 const [relation,setRelation]=useState<"predecessor"|"successor">("predecessor"),[otherId,setOtherId]=useState(""),[depType,setDepType]=useState<"FS"|"SS"|"FF"|"SF">("FS"),[lag,setLag]=useState("0"),[note,setNote]=useState("");
 const preds=dependencies.filter(x=>x.activity_id===currentActivityId),succs=dependencies.filter(x=>x.depends_on_activity_id===currentActivityId);
 const byId=useMemo(()=>new Map(activities.map(a=>[a.id,a.title])),[activities]);

 async function addDependency(){
  if(!otherId)return setMsg("Selecione uma atividade.");
  setBusy(true);setMsg("");const s=createClient();
  const payload=relation==="predecessor"?{organization_id:organizationId,project_id:projectId,activity_id:currentActivityId,depends_on_activity_id:otherId,dependency_type:depType,lag_days:Number(lag||0),note:note.trim()||null}:{organization_id:organizationId,project_id:projectId,activity_id:otherId,depends_on_activity_id:currentActivityId,dependency_type:depType,lag_days:Number(lag||0),note:note.trim()||null};
  const {error}=await s.from("activity_dependencies").insert(payload);
  if(error){setMsg(error.message);setBusy(false);return}location.reload();
 }
 async function removeDependency(id:string){setBusy(true);setMsg("");const s=createClient();const {error}=await s.from("activity_dependencies").delete().eq("id",id);if(error){setMsg(error.message);setBusy(false);return}location.reload()}

 return <>
  <button type="button" onClick={()=>setOpen(true)} className="card" style={{width:"100%",textAlign:"left",border:"1px solid var(--line)",background:"white",marginTop:12,padding:14,cursor:"pointer"}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><div><div className="eyebrow">Dependências do cronograma</div><strong>{preds.length} predecessor{preds.length===1?"":"es"} · {succs.length} sucessor{succs.length===1?"":"es"}</strong></div><span className="chip">Configurar</span></div>
   <div className="muted" style={{fontSize:12,marginTop:6}}>{isCritical?"🔴 Atividade crítica · 0 dias de folga":totalFloatDays!=null?`Folga total: ${totalFloatDays} dias`:"Sem cálculo de folga disponível"}</div>
  </button>
  {open&&<div role="dialog" aria-modal="true" onClick={()=>!busy&&setOpen(false)} style={{position:"fixed",inset:0,zIndex:120,background:"rgba(15,23,42,.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:760,maxHeight:"94dvh",overflowY:"auto",background:"#f6f8fb",borderRadius:"28px 28px 0 0",padding:"12px 14px calc(28px + env(safe-area-inset-bottom,0px))",boxSizing:"border-box"}}>
   <div style={{width:44,height:5,borderRadius:999,background:"#cbd5e1",margin:"0 auto 14px"}}/>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:14}}><h2 style={{margin:0}}>Predecessores e sucessores</h2><button type="button" onClick={()=>setOpen(false)} style={{width:42,height:42,borderRadius:"50%",border:"1px solid var(--line)",background:"white",fontSize:24}}>×</button></div>
   <section className="card"><h3 style={{marginTop:0}}>Relacionamentos atuais</h3><div className="eyebrow">Predecessores</div>{!preds.length?<div className="empty" style={{padding:"12px 0"}}>Nenhum predecessor.</div>:preds.map(x=><div className="row" key={x.id}><div className="row-main"><div className="row-title">{byId.get(x.depends_on_activity_id)||"Atividade"}</div><div className="row-sub">{x.dependency_type} · lag {x.lag_days} d{x.note?` · ${x.note}`:""}</div></div><button className="chip danger" disabled={busy} onClick={()=>removeDependency(x.id)}>Remover</button></div>)}<div className="eyebrow" style={{marginTop:14}}>Sucessores</div>{!succs.length?<div className="empty" style={{padding:"12px 0"}}>Nenhum sucessor.</div>:succs.map(x=><div className="row" key={x.id}><div className="row-main"><div className="row-title">{byId.get(x.activity_id)||"Atividade"}</div><div className="row-sub">{x.dependency_type} · lag {x.lag_days} d{x.note?` · ${x.note}`:""}</div></div><button className="chip danger" disabled={busy} onClick={()=>removeDependency(x.id)}>Remover</button></div>)}</section>
   <section className="card"><h3 style={{marginTop:0}}>Adicionar dependência</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><button type="button" className={`btn ${relation==="predecessor"?"btn-primary":"btn-outline"}`} onClick={()=>setRelation("predecessor")}>Predecessor</button><button type="button" className={`btn ${relation==="successor"?"btn-primary":"btn-outline"}`} onClick={()=>setRelation("successor")}>Sucessor</button></div><div className="field" style={{marginTop:12}}><label>Atividade</label><select className="select" value={otherId} onChange={e=>setOtherId(e.target.value)}><option value="">Selecione...</option>{activities.filter(a=>a.id!==currentActivityId).map(a=><option value={a.id} key={a.id}>{a.title}</option>)}</select></div><div className="field" style={{marginTop:10}}><label>Tipo de relação</label><select className="select" value={depType} onChange={e=>setDepType(e.target.value as any)}>{TYPES.map(t=><option value={t.key} key={t.key}>{t.label}</option>)}</select><div className="muted" style={{fontSize:11,marginTop:4}}>{TYPES.find(t=>t.key===depType)?.hint}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}><div className="field"><label>Lag / Lead (dias)</label><input className="input" type="number" min="-3650" max="3650" value={lag} onChange={e=>setLag(e.target.value)}/></div><div className="field"><label>Observação</label><input className="input" value={note} onChange={e=>setNote(e.target.value)} placeholder="Opcional"/></div></div>{msg&&<div className="error" style={{marginTop:10}}>{msg}</div>}<button className="btn btn-primary btn-block" type="button" disabled={busy||!otherId} onClick={addDependency} style={{marginTop:12}}>{busy?"Salvando...":"Adicionar dependência"}</button></section>
  </div></div>}
 </>;
}
