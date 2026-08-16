"use client";

import {useMemo,useState} from "react";
import {ArrowDown,ArrowUp,ArrowUpDown,Search,X} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

type Row={
  id:string;
  project_id:string;
  strategic_alignment:number|null;
  expected_value:number|null;
  urgency:number|null;
  compliance:number|null;
  capacity_fit:number|null;
  risk:number|null;
  effort:number|null;
  total_score:number|null;
  projects?:{name?:string|null;priority?:string|null;health?:string|null}|null;
};

type SortKey="total_score"|"strategic_alignment"|"expected_value"|"urgency"|"compliance"|"capacity_fit"|"risk"|"effort"|"name";
type Draft={strategic_alignment:string;expected_value:string;urgency:string;compliance:string;capacity_fit:string;risk:string;effort:string};

function n(v:unknown){const x=Number(v??0);return Number.isFinite(x)?x:0}
function tone(v:number,inverse=false){
  const effective=inverse?100-v:v;
  if(effective>=75)return {background:"#ecfdf5",color:"#047857",borderColor:"#a7f3d0"};
  if(effective>=50)return {background:"#fffbeb",color:"#b45309",borderColor:"#fde68a"};
  return {background:"#fff1f2",color:"#b91c1c",borderColor:"#fecdd3"};
}
function draftFromRow(r:Row):Draft{return {
  strategic_alignment:String(n(r.strategic_alignment)),expected_value:String(n(r.expected_value)),urgency:String(n(r.urgency)),compliance:String(n(r.compliance)),capacity_fit:String(n(r.capacity_fit)),risk:String(n(r.risk)),effort:String(n(r.effort))
}}

export function PrioritizationTable({rows,organizationId}:{rows:Row[];organizationId:string}){
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState<SortKey>("total_score");
  const [dir,setDir]=useState<"asc"|"desc">("desc");
  const [selected,setSelected]=useState<Row|null>(null);
  const [draft,setDraft]=useState<Draft|null>(null);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");

  function openEditor(r:Row){setSelected(r);setDraft(draftFromRow(r));setMsg("")}
  function closeEditor(){if(busy)return;setSelected(null);setDraft(null);setMsg("")}
  function setSortKey(key:SortKey){if(sort===key){setDir(dir==="desc"?"asc":"desc");return}setSort(key);setDir(key==="name"?"asc":"desc")}

  const data=useMemo(()=>{
    const q=query.trim().toLowerCase();
    const filtered=rows.filter(r=>!q||String(r.projects?.name||"").toLowerCase().includes(q));
    return [...filtered].sort((a,b)=>{
      const av=sort==="name"?String(a.projects?.name||"").toLowerCase():n(a[sort]);
      const bv=sort==="name"?String(b.projects?.name||"").toLowerCase():n(b[sort]);
      const cmp=typeof av==="string"?av.localeCompare(String(bv)):Number(av)-Number(bv);
      return dir==="asc"?cmp:-cmp;
    });
  },[rows,query,sort,dir]);

  async function save(){
    if(!selected||!draft)return;
    setBusy(true);setMsg("");
    const payload={organization_id:organizationId,project_id:selected.project_id,strategic_alignment:n(draft.strategic_alignment),expected_value:n(draft.expected_value),urgency:n(draft.urgency),compliance:n(draft.compliance),capacity_fit:n(draft.capacity_fit),risk:n(draft.risk),effort:n(draft.effort),updated_at:new Date().toISOString()};
    const s=createClient();
    const {error}=await s.from("portfolio_scores").upsert(payload,{onConflict:"project_id"});
    if(error){setMsg(error.message);setBusy(false);return}
    location.reload();
  }

  const SortIcon=({k}:{k:SortKey})=>sort!==k?<ArrowUpDown size={14}/>:dir==="asc"?<ArrowUp size={14}/>:<ArrowDown size={14}/>;
  const head=(label:string,k:SortKey)=><button type="button" onClick={()=>setSortKey(k)} style={{display:"inline-flex",alignItems:"center",gap:5,border:0,background:"transparent",font:"inherit",fontWeight:800,color:"inherit",padding:0,whiteSpace:"nowrap"}}>{label}<SortIcon k={k}/></button>;
  const cell=(value:unknown,inverse=false)=>{const v=n(value);const t=tone(v,inverse);return <span style={{display:"inline-flex",minWidth:52,justifyContent:"center",padding:"6px 8px",borderRadius:10,border:`1px solid ${t.borderColor}`,background:t.background,color:t.color,fontWeight:850,fontVariantNumeric:"tabular-nums"}}>{Math.round(v)}</span>};
  const field=(label:string,key:keyof Draft,inverse=false)=>{
    const value=Number(draft?.[key]??0);const t=tone(value,inverse);
    return <div className="field"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}><label>{label}</label><span style={{fontSize:12,fontWeight:850,color:t.color}}>{Math.round(value)}</span></div><input className="input" type="range" min="0" max="100" step="1" value={draft?.[key]??"0"} onChange={e=>setDraft(d=>d?{...d,[key]:e.target.value}:d)} style={{accentColor:"var(--primary, #5b21b6)"}}/><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#94a3b8"}}><span>0</span><span>100</span></div></div>;
  };

  return <>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
      <div style={{position:"relative",flex:"1 1 220px"}}><Search size={17} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#64748b"}}/><input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar iniciativa" style={{paddingLeft:38}}/></div>
      <span className="chip">{data.length} iniciativas</span>
    </div>

    <section className="card" style={{padding:0,overflow:"hidden"}}>
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <table style={{borderCollapse:"separate",borderSpacing:0,width:"max-content",minWidth:"100%",fontSize:13}}>
          <thead><tr style={{background:"#f8fafc"}}>
            <th style={{position:"sticky",left:0,zIndex:4,background:"#f8fafc",padding:"12px 10px",borderBottom:"1px solid var(--line)",textAlign:"center",minWidth:52}}>#</th>
            <th style={{position:"sticky",left:52,zIndex:4,background:"#f8fafc",padding:"12px 14px",borderBottom:"1px solid var(--line)",textAlign:"left",minWidth:230,maxWidth:280}}>{head("Iniciativa","name")}</th>
            <th style={{padding:"12px 10px",borderBottom:"1px solid var(--line)"}}>{head("Alinh.","strategic_alignment")}</th>
            <th style={{padding:"12px 10px",borderBottom:"1px solid var(--line)"}}>{head("Valor","expected_value")}</th>
            <th style={{padding:"12px 10px",borderBottom:"1px solid var(--line)"}}>{head("Urgência","urgency")}</th>
            <th style={{padding:"12px 10px",borderBottom:"1px solid var(--line)"}}>{head("Compliance","compliance")}</th>
            <th style={{padding:"12px 10px",borderBottom:"1px solid var(--line)"}}>{head("Capacidade","capacity_fit")}</th>
            <th style={{padding:"12px 10px",borderBottom:"1px solid var(--line)"}}>{head("Risco","risk")}</th>
            <th style={{padding:"12px 10px",borderBottom:"1px solid var(--line)"}}>{head("Esforço","effort")}</th>
            <th style={{position:"sticky",right:0,zIndex:4,background:"#f8fafc",padding:"12px 12px",borderBottom:"1px solid var(--line)"}}>{head("Score","total_score")}</th>
          </tr></thead>
          <tbody>{data.map((r,i)=>{const score=n(r.total_score);const scoreTone=tone(score);return <tr key={r.id} onClick={()=>openEditor(r)} style={{background:i%2?"#fbfdff":"#fff",cursor:"pointer"}}>
            <td style={{position:"sticky",left:0,zIndex:2,background:"inherit",padding:"12px 10px",borderBottom:"1px solid #eef2f7",textAlign:"center",fontWeight:900,color:i<3?"var(--primary, #5b21b6)":"#64748b"}}>{i+1}</td>
            <td style={{position:"sticky",left:52,zIndex:2,background:"inherit",padding:"12px 14px",borderBottom:"1px solid #eef2f7",minWidth:230,maxWidth:280}}><div style={{fontWeight:850,lineHeight:1.25}}>{r.projects?.name||"Projeto"}</div><div className="row-sub" style={{marginTop:3}}>Toque para revisar a priorização</div></td>
            <td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.strategic_alignment)}</td><td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.expected_value)}</td><td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.urgency)}</td><td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.compliance)}</td><td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.capacity_fit)}</td><td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.risk,true)}</td><td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.effort,true)}</td>
            <td style={{position:"sticky",right:0,zIndex:2,background:"inherit",padding:"10px 12px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}><span style={{display:"inline-flex",minWidth:64,justifyContent:"center",padding:"8px 10px",borderRadius:999,border:`1px solid ${scoreTone.borderColor}`,background:scoreTone.background,color:scoreTone.color,fontWeight:950,fontSize:14,fontVariantNumeric:"tabular-nums"}}>{score.toFixed(1)}</span></td>
          </tr>})}</tbody>
        </table>
      </div>
      {!data.length&&<div className="empty" style={{padding:24}}>Nenhuma iniciativa encontrada.</div>}
    </section>
    <div className="row-sub" style={{marginTop:9}}>Arraste horizontalmente para comparar. Toque em uma iniciativa para revisar seus critérios.</div>

    {selected&&draft&&<div role="dialog" aria-modal="true" onClick={closeEditor} style={{position:"fixed",inset:0,zIndex:80,background:"rgba(15,23,42,.42)",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingTop:24}}>
      <section className="card" onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:720,maxHeight:"88vh",overflowY:"auto",margin:0,borderRadius:"24px 24px 0 0",padding:"18px 18px 24px",boxShadow:"0 -16px 48px rgba(15,23,42,.18)"}}>
        <div style={{width:42,height:4,borderRadius:999,background:"#cbd5e1",margin:"0 auto 16px"}}/>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}><div><span className="eyebrow">Revisar priorização</span><h2 style={{marginTop:4,marginBottom:4}}>{selected.projects?.name||"Projeto"}</h2><div className="row-sub">Ajuste os critérios desta iniciativa. O score será recalculado após salvar.</div></div><button type="button" aria-label="Fechar" onClick={closeEditor} style={{width:38,height:38,borderRadius:12,border:"1px solid var(--line)",background:"#fff",display:"grid",placeItems:"center",flexShrink:0}}><X size={18}/></button></div>
        <div className="grid grid-2" style={{marginTop:18}}>{field("Alinhamento estratégico","strategic_alignment")}{field("Valor esperado","expected_value")}{field("Urgência","urgency")}{field("Compliance","compliance")}{field("Fit de capacidade","capacity_fit")}{field("Risco","risk",true)}{field("Esforço","effort",true)}</div>
        <div style={{display:"flex",gap:10,marginTop:18}}><button type="button" className="btn btn-outline" onClick={closeEditor} disabled={busy} style={{flex:1}}>Cancelar</button><button type="button" className="btn btn-primary" onClick={save} disabled={busy} style={{flex:1}}>{busy?"Salvando...":"Salvar priorização"}</button></div>
        {msg&&<div className="error" style={{marginTop:10}}>{msg}</div>}
      </section>
    </div>}
  </>;
}
