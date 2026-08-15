"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Result={entity_type:string;entity_id:string;title:string;subtitle:string;path:string};
type Saved={id:string;name:string;filters:any};

export function SearchExperience({organizationId,userId}:{organizationId:string;userId:string}){
  const [q,setQ]=useState("");const [results,setResults]=useState<Result[]>([]);const [saved,setSaved]=useState<Saved[]>([]);const [favorites,setFavorites]=useState<any[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  const s=createClient();

  async function loadPersonal(){
    const [{data:sv},{data:fav}]=await Promise.all([
      s.from("saved_views").select("id,name,filters").eq("organization_id",organizationId).eq("user_id",userId).eq("module","search").order("created_at",{ascending:false}),
      s.from("favorites").select("*").eq("organization_id",organizationId).eq("user_id",userId).order("created_at",{ascending:false})
    ]);setSaved((sv||[]) as Saved[]);setFavorites(fav||[]);
  }
  useEffect(()=>{void loadPersonal()},[]);

  async function search(value=q){setBusy(true);setError("");const {data,error}=await s.rpc("rpc_global_search",{p_organization_id:organizationId,p_query:value,p_limit:50});if(error)setError(error.message);else setResults((data||[]) as Result[]);setBusy(false)}
  async function saveSearch(){if(!q.trim())return;const name=prompt("Nome desta busca salva:",q.trim());if(!name)return;const {error}=await s.from("saved_views").upsert({organization_id:organizationId,user_id:userId,module:"search",name,filters:{q:q.trim()}},{onConflict:"organization_id,user_id,module,name"});if(error)setError(error.message);else void loadPersonal()}
  async function toggleFavorite(r:Result){const existing=favorites.find((f:any)=>f.entity_type===r.entity_type&&f.entity_id===r.entity_id);if(existing){await s.from("favorites").delete().eq("id",existing.id)}else{await s.from("favorites").insert({organization_id:organizationId,user_id:userId,entity_type:r.entity_type,entity_id:r.entity_id,label:r.title,path:r.path})}void loadPersonal()}

  return <>
    <section className="card"><div style={{display:"flex",gap:8}}><input className="input" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void search()}} placeholder="Buscar direção, programa, projeto ou atividade..."/><button className="btn btn-primary" onClick={()=>void search()} disabled={busy}>{busy?"...":"Buscar"}</button></div><button className="btn btn-outline btn-block" style={{marginTop:8}} onClick={()=>void saveSearch()} disabled={!q.trim()}>Salvar busca</button>{error&&<div className="error" style={{marginTop:8}}>{error}</div>}</section>

    {!!saved.length&&<><div className="section-title"><h2>Buscas salvas</h2></div><section className="card list">{saved.map(v=><button className="row" style={{width:"100%",textAlign:"left",background:"transparent",border:0}} key={v.id} onClick={()=>{const value=String(v.filters?.q||"");setQ(value);void search(value)}}><div className="row-main"><div className="row-title">{v.name}</div><div className="row-sub">{String(v.filters?.q||"")}</div></div><span className="row-arrow">›</span></button>)}</section></>}

    {!!favorites.length&&<><div className="section-title"><h2>Favoritos</h2></div><section className="card list">{favorites.map((f:any)=><Link className="row" href={f.path} key={f.id}><div className="row-main"><div className="row-title">★ {f.label}</div><div className="row-sub">{f.entity_type}</div></div><span className="row-arrow">›</span></Link>)}</section></>}

    <div className="section-title"><h2>Resultados</h2></div><section className="card list">{!results.length?<div className="empty">Digite um termo para pesquisar todo o workspace.</div>:results.map(r=>{const active=favorites.some((f:any)=>f.entity_type===r.entity_type&&f.entity_id===r.entity_id);return <div className="row" key={`${r.entity_type}-${r.entity_id}`}><Link href={r.path} className="row-main"><div className="row-title">{r.title}</div><div className="row-sub">{r.entity_type} · {r.subtitle||"Sem descrição"}</div></Link><button className="chip" onClick={()=>void toggleFavorite(r)}>{active?"★":"☆"}</button></div>})}</section>
  </>;
}
