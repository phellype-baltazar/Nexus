"use client";

import Link from "next/link";
import {useMemo,useState} from "react";
import {ArrowDown,ArrowUp,ArrowUpDown,Search} from "lucide-react";

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

function n(v:unknown){const x=Number(v??0);return Number.isFinite(x)?x:0}
function tone(v:number,inverse=false){
  const effective=inverse?100-v:v;
  if(effective>=75)return {background:"#ecfdf5",color:"#047857",borderColor:"#a7f3d0"};
  if(effective>=50)return {background:"#fffbeb",color:"#b45309",borderColor:"#fde68a"};
  return {background:"#fff1f2",color:"#b91c1c",borderColor:"#fecdd3"};
}

export function PrioritizationTable({rows}:{rows:Row[]}){
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState<SortKey>("total_score");
  const [dir,setDir]=useState<"asc"|"desc">("desc");

  function setSortKey(key:SortKey){
    if(sort===key){setDir(dir==="desc"?"asc":"desc");return}
    setSort(key);setDir(key==="name"?"asc":"desc");
  }

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

  const SortIcon=({k}:{k:SortKey})=>sort!==k?<ArrowUpDown size={14}/>:dir==="asc"?<ArrowUp size={14}/>:<ArrowDown size={14}/>;
  const head=(label:string,k:SortKey)=><button type="button" onClick={()=>setSortKey(k)} style={{display:"inline-flex",alignItems:"center",gap:5,border:0,background:"transparent",font:"inherit",fontWeight:800,color:"inherit",padding:0,whiteSpace:"nowrap"}}>{label}<SortIcon k={k}/></button>;
  const cell=(value:unknown,inverse=false)=>{const v=n(value);const t=tone(v,inverse);return <span style={{display:"inline-flex",minWidth:52,justifyContent:"center",padding:"6px 8px",borderRadius:10,border:`1px solid ${t.borderColor}`,background:t.background,color:t.color,fontWeight:850,fontVariantNumeric:"tabular-nums"}}>{Math.round(v)}</span>};

  return <>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
      <div style={{position:"relative",flex:"1 1 220px"}}>
        <Search size={17} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#64748b"}}/>
        <input className="input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar iniciativa" style={{paddingLeft:38}}/>
      </div>
      <span className="chip">{data.length} iniciativas</span>
    </div>

    <section className="card" style={{padding:0,overflow:"hidden"}}>
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <table style={{borderCollapse:"separate",borderSpacing:0,width:"max-content",minWidth:"100%",fontSize:13}}>
          <thead>
            <tr style={{background:"#f8fafc"}}>
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
            </tr>
          </thead>
          <tbody>
            {data.map((r,i)=>{
              const score=n(r.total_score);const scoreTone=tone(score);
              return <tr key={r.id} style={{background:i%2?"#fbfdff":"#fff"}}>
                <td style={{position:"sticky",left:0,zIndex:2,background:"inherit",padding:"12px 10px",borderBottom:"1px solid #eef2f7",textAlign:"center",fontWeight:900,color:i<3?"var(--primary, #5b21b6)":"#64748b"}}>{i+1}</td>
                <td style={{position:"sticky",left:52,zIndex:2,background:"inherit",padding:"12px 14px",borderBottom:"1px solid #eef2f7",minWidth:230,maxWidth:280}}>
                  <Link href={`/app/project/${r.project_id}`} style={{display:"block",color:"inherit",textDecoration:"none"}}>
                    <div style={{fontWeight:850,lineHeight:1.25}}>{r.projects?.name||"Projeto"}</div>
                    <div className="row-sub" style={{marginTop:3}}>{r.projects?.priority||"prioridade não definida"}</div>
                  </Link>
                </td>
                <td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.strategic_alignment)}</td>
                <td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.expected_value)}</td>
                <td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.urgency)}</td>
                <td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.compliance)}</td>
                <td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.capacity_fit)}</td>
                <td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.risk,true)}</td>
                <td style={{padding:"10px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>{cell(r.effort,true)}</td>
                <td style={{position:"sticky",right:0,zIndex:2,background:"inherit",padding:"10px 12px",borderBottom:"1px solid #eef2f7",textAlign:"center"}}>
                  <span style={{display:"inline-flex",minWidth:64,justifyContent:"center",padding:"8px 10px",borderRadius:999,border:`1px solid ${scoreTone.borderColor}`,background:scoreTone.background,color:scoreTone.color,fontWeight:950,fontSize:14,fontVariantNumeric:"tabular-nums"}}>{score.toFixed(1)}</span>
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
      {!data.length&&<div className="empty" style={{padding:24}}>Nenhuma iniciativa encontrada.</div>}
    </section>

    <div className="row-sub" style={{marginTop:9}}>Arraste horizontalmente para comparar todos os critérios. Toque nos cabeçalhos para ordenar.</div>
  </>;
}
