"use client";

import Link from "next/link";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Group={id:string;name:string;description:string|null;progress:number|null;health:string|null};

function IconButton({label,onClick,children,danger=false}:{label:string;onClick:()=>void;children:React.ReactNode;danger?:boolean}){
  return <button type="button" aria-label={label} title={label} onClick={(e)=>{e.preventDefault();e.stopPropagation();onClick()}} style={{width:42,height:42,borderRadius:12,border:`1px solid ${danger?"#f3c6ce":"var(--line)"}`,background:danger?"#fff7f8":"#fff",color:danger?"#b42318":"var(--primary)",display:"grid",placeItems:"center",flex:"0 0 auto"}}>{children}</button>;
}

const Pencil=()=> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>;
const Trash=()=> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>;

export function GroupListEditor({groups,canManage}:{groups:Group[];canManage:boolean}){
  const [editing,setEditing]=useState<Group|null>(null);
  const [deleting,setDeleting]=useState<Group|null>(null);
  const [name,setName]=useState("");
  const [description,setDescription]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  function openEdit(g:Group){setEditing(g);setName(g.name);setDescription(g.description||"");setMessage("")}
  async function save(){
    if(!editing||!name.trim())return;
    setBusy(true);setMessage("");
    const s=createClient();
    const {error}=await s.from("groups").update({name:name.trim(),description:description.trim()||null}).eq("id",editing.id);
    if(error){setMessage(error.message);setBusy(false);return}
    location.reload();
  }
  async function remove(){
    if(!deleting)return;
    setBusy(true);setMessage("");
    const s=createClient();
    const {error}=await s.from("groups").update({deleted_at:new Date().toISOString()}).eq("id",deleting.id);
    if(error){setMessage(error.message);setBusy(false);return}
    location.reload();
  }

  return <>
    <section className="card list">{!groups.length?<div className="empty">Nenhuma direção criada.</div>:groups.map(g=><div className="row" key={g.id} style={{alignItems:"center"}}>
      <Link href={`/app/group/${g.id}`} className="row-main" style={{display:"block",minWidth:0}}>
        <div className="row-title">{g.name}</div>
        <div className="row-sub">{g.description||"Sem descrição"} · {Math.round(Number(g.progress||0))}%</div>
      </Link>
      {canManage?<div style={{display:"flex",gap:8,alignItems:"center"}}>
        <IconButton label={`Editar ${g.name}`} onClick={()=>openEdit(g)}><Pencil/></IconButton>
        <IconButton label={`Excluir ${g.name}`} onClick={()=>{setDeleting(g);setMessage("")}} danger><Trash/></IconButton>
        <Link href={`/app/group/${g.id}`} aria-label={`Abrir ${g.name}`} className="row-arrow" style={{padding:"6px 0 6px 2px"}}>›</Link>
      </div>:<Link href={`/app/group/${g.id}`} className="row-arrow">›</Link>}
    </div>)}</section>

    {editing&&<div onClick={()=>!busy&&setEditing(null)} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(15,23,42,.45)",display:"grid",alignItems:"end",padding:"16px"}}>
      <section className="card form" onClick={e=>e.stopPropagation()} style={{width:"min(100%,520px)",margin:"0 auto",borderRadius:24}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><h2 style={{margin:0}}>Editar Direção</h2><button className="btn btn-secondary" type="button" onClick={()=>setEditing(null)}>Fechar</button></div>
        <div className="field"><label>Nome da Direção</label><input className="input" value={name} onChange={e=>setName(e.target.value)}/></div>
        <div className="field"><label>Descrição</label><textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)}/></div>
        {message&&<div className="error">{message}</div>}
        <button className="btn btn-primary btn-block" type="button" disabled={busy||!name.trim()} onClick={save}>{busy?"Salvando...":"Salvar alterações"}</button>
      </section>
    </div>}

    {deleting&&<div onClick={()=>!busy&&setDeleting(null)} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(15,23,42,.45)",display:"grid",alignItems:"end",padding:"16px"}}>
      <section className="card form" onClick={e=>e.stopPropagation()} style={{width:"min(100%,520px)",margin:"0 auto",borderRadius:24}}>
        <h2 style={{marginBottom:2}}>Excluir Direção?</h2>
        <p className="muted" style={{margin:0}}>A Direção <b>{deleting.name}</b> será removida da lista. Esta ação não deve ser feita por engano.</p>
        {message&&<div className="error">{message}</div>}
        <div className="grid grid-2"><button className="btn btn-outline" type="button" disabled={busy} onClick={()=>setDeleting(null)}>Cancelar</button><button className="btn btn-block" type="button" disabled={busy} onClick={remove} style={{background:"#b42318",color:"white"}}>{busy?"Excluindo...":"Sim, excluir"}</button></div>
      </section>
    </div>}
  </>;
}
