"use client";

import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

export type ActivityMember={user_id:string;full_name:string|null};
export type ActivityComment={id:string;body:string;created_at:string;author_name:string};

type Editor="progress"|"status"|"owner"|null;

function dateOnly(value:string|null){
  if(!value)return null;
  if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return null;
  return d.toISOString().slice(0,10);
}

function visualStatus(status:string,dueDate:string|null,completedAt:string|null){
  const due=dateOnly(dueDate);
  const completed=dateOnly(completedAt);
  const today=new Date().toISOString().slice(0,10);

  if(status==="cancelled")return {label:"Cancelada",bg:"#eef1f5",color:"#5d6675",border:"#d9dee7"};
  if(status==="done"){
    if(!due||!completed)return {label:"Feita",bg:"#e8f7ef",color:"#0b7a46",border:"#bfe8d1"};
    if(completed<due)return {label:"Feita antes do prazo",bg:"#e8f7ef",color:"#0b7a46",border:"#bfe8d1"};
    if(completed===due)return {label:"Feita no prazo",bg:"#e8f7ef",color:"#0b7a46",border:"#bfe8d1"};
    return {label:"Feita fora do prazo",bg:"#fdecef",color:"#b42318",border:"#f3c6ce"};
  }
  if(due&&due<today)return {label:"Atrasada",bg:"#fdecef",color:"#b42318",border:"#f3c6ce"};
  return {label:"Em andamento",bg:"#fff4dd",color:"#9a5b00",border:"#f1ddb0"};
}

function cardBase(){
  return {
    minHeight:122,
    height:122,
    minWidth:0,
    marginTop:0,
    padding:"16px 14px",
    display:"flex",
    flexDirection:"column" as const,
    alignItems:"center",
    justifyContent:"center",
    gap:10,
    boxSizing:"border-box" as const,
    overflow:"hidden",
    textAlign:"center" as const,
    width:"100%",
  };
}

function valueSize(text:string){
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(text))return 20;
  if(text.length>25)return 16;
  if(text.length>18)return 18;
  if(text.length>12)return 20;
  return 30;
}

export function ActivityInteractiveDashboard({
  id,organizationId,userId,progress,status,dueDate,completedAt,ownerId,ownerName,members,comments,legacyDescription,
}:{
  id:string;organizationId:string;userId:string;progress:number;status:string;dueDate:string|null;completedAt:string|null;
  ownerId:string|null;ownerName:string;members:ActivityMember[];comments:ActivityComment[];legacyDescription:string|null;
}){
  const [editor,setEditor]=useState<Editor>(null);
  const [progressValue,setProgressValue]=useState(String(Math.round(Number(progress||0))));
  const [ownerValue,setOwnerValue]=useState(ownerId||"");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [comment,setComment]=useState("");
  const visual=useMemo(()=>visualStatus(status,dueDate,completedAt),[status,dueDate,completedAt]);

  async function saveProgress(){
    const value=Math.max(0,Math.min(100,Number(progressValue||0)));
    setBusy(true);setMessage("");
    const s=createClient();
    const {error}=await s.from("activities").update({progress:value}).eq("id",id);
    if(error){setMessage(error.message);setBusy(false);return;}
    location.reload();
  }

  async function saveStatus(next:"done"|"cancelled"){
    setBusy(true);setMessage("");
    const s=createClient();
    const {error}=await s.from("activities").update({status:next,progress:100}).eq("id",id);
    if(error){setMessage(error.message);setBusy(false);return;}
    location.reload();
  }

  async function saveOwner(){
    setBusy(true);setMessage("");
    const s=createClient();
    const {error}=await s.from("activities").update({primary_owner_id:ownerValue||null}).eq("id",id);
    if(error){setMessage(error.message);setBusy(false);return;}
    location.reload();
  }

  async function addComment(e:React.FormEvent){
    e.preventDefault();
    const body=comment.trim();
    if(!body)return;
    setBusy(true);setMessage("");
    const s=createClient();
    const {error}=await s.from("comments").insert({organization_id:organizationId,author_user_id:userId,entity_type:"activity",entity_id:id,body});
    if(error){setMessage(error.message);setBusy(false);return;}
    setComment("");
    location.reload();
  }

  const dateText=dueDate?new Date(`${dueDate}T12:00:00`).toLocaleDateString("pt-BR"):"—";
  const pText=`${Math.round(Number(progress||0))}%`;

  return <>
    <section style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginTop:14,width:"100%",maxWidth:"100%",overflow:"hidden"}}>
      <button type="button" className="card" onClick={()=>setEditor("progress")} style={{...cardBase(),cursor:"pointer",border:"1px solid var(--line)",background:"white"}}>
        <div className="eyebrow" style={{margin:0,textAlign:"center"}}>Progresso</div>
        <div style={{fontSize:valueSize(pText),lineHeight:1,fontWeight:900,textAlign:"center"}}>{pText}</div>
      </button>

      <button type="button" className="card" onClick={()=>setEditor("status")} style={{...cardBase(),cursor:"pointer",border:`1px solid ${visual.border}`,background:visual.bg,color:visual.color}}>
        <div className="eyebrow" style={{margin:0,textAlign:"center",color:visual.color}}>Status</div>
        <div style={{fontSize:valueSize(visual.label),lineHeight:1.08,fontWeight:900,textAlign:"center",maxWidth:"100%"}}>{visual.label}</div>
      </button>

      <div className="card" style={{...cardBase(),border:"1px solid var(--line)",background:"white"}}>
        <div className="eyebrow" style={{margin:0,textAlign:"center"}}>Data prevista</div>
        <div style={{fontSize:20,lineHeight:1,fontWeight:900,textAlign:"center",whiteSpace:"nowrap"}}>{dateText}</div>
      </div>

      <button type="button" className="card" onClick={()=>setEditor("owner")} style={{...cardBase(),cursor:"pointer",border:"1px solid var(--line)",background:"white"}}>
        <div className="eyebrow" style={{margin:0,textAlign:"center"}}>Responsável</div>
        <div style={{fontSize:valueSize(ownerName),lineHeight:1.08,fontWeight:900,textAlign:"center",maxWidth:"100%",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{ownerName}</div>
      </button>
    </section>

    <section className="card" style={{marginTop:12}}>
      <h2>Comentários</h2>
      {legacyDescription&&<div style={{padding:"10px 0",borderBottom:comments.length?"1px solid var(--line)":"none"}}><div className="muted" style={{fontSize:12,fontWeight:800}}>Descrição original</div><div>{legacyDescription}</div></div>}
      {!comments.length&&!legacyDescription&&<p className="muted">Nenhum comentário ainda.</p>}
      {comments.map(c=><div key={c.id} style={{padding:"12px 0",borderTop:"1px solid var(--line)"}}>
        <div style={{fontWeight:800,fontSize:13}}>{c.author_name}</div>
        <div className="muted" style={{fontSize:11,marginTop:2}}>{new Date(c.created_at).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}</div>
        <div style={{marginTop:6,whiteSpace:"pre-wrap"}}>{c.body}</div>
      </div>)}
      <form onSubmit={addComment} style={{marginTop:12}}>
        <textarea className="textarea" value={comment} onChange={e=>setComment(e.target.value)} placeholder="Adicionar comentário..." rows={3}/>
        <button className="btn btn-primary btn-block" disabled={busy||!comment.trim()} style={{marginTop:8}}>Comentar</button>
      </form>
      {message&&<div className="error" style={{marginTop:8}}>{message}</div>}
    </section>

    {editor&&<div role="dialog" aria-modal="true" onClick={()=>!busy&&setEditor(null)} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(15,23,42,.35)",display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"18px"}}>
      <div className="card" onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,margin:0,padding:20,borderRadius:24}}>
        {editor==="progress"&&<>
          <h2>Atualizar progresso</h2>
          <div className="field"><label>Progresso (%)</label><input className="input" type="number" min="0" max="100" value={progressValue} onChange={e=>setProgressValue(e.target.value)}/></div>
          <div className="muted" style={{fontSize:12}}>Ao salvar 100%, a ação será marcada automaticamente como feita.</div>
          <button className="btn btn-primary btn-block" disabled={busy} onClick={saveProgress} style={{marginTop:12}}>Salvar</button>
        </>}

        {editor==="status"&&<>
          <h2>Atualizar status</h2>
          <button className="btn btn-primary btn-block" disabled={busy} onClick={()=>saveStatus("done")}>Marcar como feita</button>
          <button className="btn btn-outline btn-block" disabled={busy} onClick={()=>saveStatus("cancelled")} style={{marginTop:10}}>Cancelar ação</button>
          <div className="muted" style={{fontSize:12,marginTop:10}}>Feita ou cancelada encerram a ação com 100% de progresso.</div>
        </>}

        {editor==="owner"&&<>
          <h2>Alterar responsável</h2>
          <div className="field"><label>Responsável</label><select className="select" value={ownerValue} onChange={e=>setOwnerValue(e.target.value)}><option value="">Sem responsável</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.full_name||"Usuário"}</option>)}</select></div>
          <button className="btn btn-primary btn-block" disabled={busy} onClick={saveOwner}>Salvar responsável</button>
        </>}

        <button className="btn btn-outline btn-block" disabled={busy} onClick={()=>setEditor(null)} style={{marginTop:10}}>Fechar</button>
      </div>
    </div>}
  </>;
}
