"use client";

import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type EffortProfile="flat"|"front_loaded"|"back_loaded"|"bell"|"double_peak"|"shifted_peak";

const PROFILES:{key:EffortProfile;short:string;path:string}[]=[
  {key:"flat",short:"Constante",path:"M3 13 L29 13"},
  {key:"front_loaded",short:"Início",path:"M3 4 C10 5 17 10 29 17"},
  {key:"back_loaded",short:"Final",path:"M3 17 C15 16 22 8 29 4"},
  {key:"bell",short:"Sino",path:"M3 17 C9 17 10 5 16 4 C22 5 23 17 29 17"},
  {key:"double_peak",short:"Duplo pico",path:"M3 16 C7 4 11 4 14 15 C17 18 20 4 24 4 C27 6 28 12 29 16"},
  {key:"shifted_peak",short:"Pico deslocado",path:"M3 17 C7 16 8 6 12 4 C18 7 22 14 29 17"},
];

function inclusiveDays(start:string,due:string){
  if(!start||!due)return 0;
  const a=new Date(`${start}T12:00:00Z`).getTime();
  const b=new Date(`${due}T12:00:00Z`).getTime();
  if(!Number.isFinite(a)||!Number.isFinite(b)||b<a)return 0;
  return Math.floor((b-a)/86400000)+1;
}

function weights(n:number,profile:EffortProfile,timing:"early"|"late"="early"){
  return Array.from({length:n},(_,i)=>{
    const x=(i+.5)/Math.max(n,1);
    if(profile==="flat")return 1;
    if(profile==="front_loaded")return Math.max(n-i,.1);
    if(profile==="back_loaded")return Math.max(i+1,.1);
    if(profile==="bell")return Math.max(Math.sin(Math.PI*x),.05);
    if(profile==="double_peak")return Math.max(Math.exp(-Math.pow((x-.18)/.16,2))+Math.exp(-Math.pow((x-.82)/.16,2)),.05);
    const peak=timing==="late"?.72:.28;
    return Math.max(Math.exp(-Math.pow((x-peak)/.22,2)),.05);
  });
}

function profileMaxHours(n:number,profile:EffortProfile,timing:"early"|"late"="early"){
  if(n<=0)return 0;
  const w=weights(n,profile,timing);const sum=w.reduce((a,b)=>a+b,0);const max=Math.max(...w);
  return Math.floor((10*sum/max)*2)/2;
}

function CurveIcon({path}:{path:string}){
  return <svg viewBox="0 0 32 22" width="46" height="31" aria-hidden="true"><path d="M2 19 H30" fill="none" stroke="currentColor" strokeWidth="1" opacity=".24"/><path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>;
}

export function ActivityCreatorV2({organizationId,projectId,members}:{organizationId:string;projectId:string;members:any[]}){
  const [open,setOpen]=useState(false);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [start,setStart]=useState("");
  const [due,setDue]=useState("");
  const [owner,setOwner]=useState("");
  const [externalOwner,setExternalOwner]=useState("");
  const [priority,setPriority]=useState("medium");
  const [hours,setHours]=useState("");
  const [profile,setProfile]=useState<EffortProfile>("bell");
  const [timing,setTiming]=useState<"early"|"late">("early");
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);

  const days=useMemo(()=>inclusiveDays(start,due),[start,due]);
  const hourValue=Number(hours||0);
  const selectedMax=useMemo(()=>profileMaxHours(days,profile,timing),[days,profile,timing]);
  const absoluteMax=days*10;
  const chartDays=Math.max(days,14);
  const preview=useMemo(()=>{
    const w=weights(chartDays,profile,timing);
    const sum=w.reduce((a,b)=>a+b,0);
    if(hourValue>0)return w.map(v=>hourValue*v/sum);
    const max=Math.max(...w);
    return w.map(v=>v/max*10);
  },[chartDays,profile,timing,hourValue]);
  const previewMax=Math.max(...preview,1);

  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg("");
    if(!start||!due){setMsg("Informe data de início e data prevista.");setBusy(false);return;}
    if(due<start){setMsg("A data prevista não pode ser anterior à data de início.");setBusy(false);return;}
    if(owner==="__external__"&&!externalOwner.trim()){setMsg("Informe o nome do responsável externo.");setBusy(false);return;}
    if(!Number.isFinite(hourValue)||hourValue<0){setMsg("Informe uma quantidade válida de horas.");setBusy(false);return;}
    if(hourValue>absoluteMax){setMsg(`Máximo absoluto para este período: ${absoluteMax} h.`);setBusy(false);return;}
    if(days>0&&hourValue>selectedMax){setMsg(`Com a curva escolhida, o máximo é ${selectedMax} h para manter até 10 h por dia.`);setBusy(false);return;}
    const s=createClient();
    const {error}=await s.from("activities").insert({organization_id:organizationId,project_id:projectId,title:title.trim(),description:description.trim()||null,start_date:start,due_date:due,primary_owner_id:owner&&owner!=="__external__"?owner:null,external_owner_name:owner==="__external__"?externalOwner.trim():null,priority,status:"todo",estimated_hours:hours?hourValue:null,effort_profile:profile,shifted_peak_timing:profile==="shifted_peak"?timing:null});
    if(error){setMsg(error.message);setBusy(false);return;}
    setOpen(false);location.reload();
  }

  const fieldCard:React.CSSProperties={background:"white",border:"1px solid var(--line)",borderRadius:18,padding:16,minWidth:0,boxSizing:"border-box"};

  return <>
    <button type="button" aria-label="Criar nova atividade" title="Nova atividade" onClick={()=>{setMsg("");setOpen(true)}} style={{position:"fixed",right:20,bottom:"calc(86px + env(safe-area-inset-bottom, 0px))",zIndex:70,width:60,height:60,borderRadius:"50%",border:0,background:"var(--primary)",color:"white",fontSize:38,fontWeight:300,lineHeight:1,display:"grid",placeItems:"center",boxShadow:"0 10px 28px rgba(37,99,235,.34)",cursor:"pointer"}}>+</button>

    {open&&<div role="dialog" aria-modal="true" aria-label="Nova atividade" onClick={()=>!busy&&setOpen(false)} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(15,23,42,.42)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:620,maxHeight:"94dvh",overflowY:"auto",background:"#f6f8fb",borderRadius:"28px 28px 0 0",padding:"10px 14px calc(24px + env(safe-area-inset-bottom,0px))",boxSizing:"border-box",boxShadow:"0 -18px 50px rgba(15,23,42,.18)"}}>
        <div style={{width:44,height:5,borderRadius:999,background:"#cbd5e1",margin:"2px auto 14px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,margin:"0 2px 14px"}}><h2 style={{margin:0,fontSize:24}}>Nova atividade</h2><button type="button" aria-label="Fechar" onClick={()=>!busy&&setOpen(false)} style={{width:42,height:42,borderRadius:"50%",border:"1px solid var(--line)",background:"white",fontSize:25,cursor:"pointer"}}>×</button></div>

        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:12}}>
          <section style={fieldCard}><div className="field" style={{marginBottom:14}}><label>Título</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)} required placeholder="Nome da atividade"/></div><div className="field"><label>Comentários iniciais</label><textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)} rows={3} placeholder="Escreva os comentários iniciais"/></div></section>

          <section style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={fieldCard}><div className="field"><label>Data de início</label><input className="input" type="date" value={start} max={due||undefined} onChange={e=>setStart(e.target.value)} required/></div></div>
            <div style={fieldCard}><div className="field"><label>Data prevista</label><input className="input" type="date" value={due} min={start||undefined} onChange={e=>setDue(e.target.value)} required/></div></div>
          </section>

          <section style={fieldCard}><div className="field"><label>Responsável</label><select className="select" value={owner} onChange={e=>setOwner(e.target.value)}><option value="">Sem responsável</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.full_name||m.email||"Usuário"}</option>)}<option value="__external__">Outro / responsável externo</option></select></div>{owner==="__external__"&&<div className="field" style={{marginTop:10}}><label>Nome do responsável externo</label><input className="input" value={externalOwner} onChange={e=>setExternalOwner(e.target.value)} placeholder="Nome externo" maxLength={160}/></div>}</section>

          <section style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={fieldCard}><div className="field"><label>Horas previstas</label><input className="input" type="number" min="0" max={selectedMax||absoluteMax||undefined} step="0.5" value={hours} onChange={e=>setHours(e.target.value)} placeholder="0"/>{days>0&&<div className="muted" style={{fontSize:12,marginTop:6}}>Máx. nesta curva: <strong>{selectedMax} h</strong></div>}</div></div>
            <div style={fieldCard}><div className="field"><label>Prioridade</label><select className="select" value={priority} onChange={e=>setPriority(e.target.value)}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="critical">Crítica</option></select></div></div>
          </section>

          <section style={fieldCard}><h2 style={{margin:"0 0 4px",fontSize:20}}>Distribuição do esforço</h2><p className="muted" style={{margin:"0 0 12px",fontSize:13}}>Escolha a curva. A prévia abaixo muda imediatamente.</p><div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8}}>{PROFILES.map(p=>{const active=profile===p.key;return <button key={p.key} type="button" onClick={()=>setProfile(p.key)} style={{minHeight:86,borderRadius:15,border:`1px solid ${active?"var(--primary)":"var(--line)"}`,background:active?"#edf4ff":"white",color:active?"var(--primary)":"var(--text)",padding:"8px 4px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,fontWeight:800}}><CurveIcon path={p.path}/><span style={{fontSize:11,textAlign:"center"}}>{p.short}</span></button>})}</div>{profile==="shifted_peak"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}><button type="button" className={`btn ${timing==="early"?"btn-primary":"btn-outline"}`} onClick={()=>setTiming("early")}>Pico Early</button><button type="button" className={`btn ${timing==="late"?"btn-primary":"btn-outline"}`} onClick={()=>setTiming("late")}>Pico Late</button></div>}

            <div style={{marginTop:16,paddingTop:14,borderTop:"1px solid var(--line)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:10}}><strong>Prévia da distribuição</strong><span className="muted" style={{fontSize:12}}>{days>0?`${days} dias`:"Defina as datas"}{hourValue>0?` · ${hourValue} h`:""}</span></div><div style={{height:112,display:"flex",alignItems:"flex-end",gap:3,marginTop:12,padding:"0 2px 6px",borderBottom:"1px solid var(--line)",overflow:"hidden"}}>{preview.map((h,i)=><div key={i} title={`${h.toFixed(1)} h`} style={{flex:1,minWidth:2,maxWidth:18,height:`${Math.max(5,Math.round(h/previewMax*96))}px`,background:"var(--primary)",borderRadius:"4px 4px 0 0",opacity:.88}}/>)}</div><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)",marginTop:5}}><span>Início</span><span>Fim</span></div></div>
          </section>

          <div className="notice">Limite duro: até 10 h por dia. O Nexus também sinaliza risco acima de 44 h semanais ou 7 dias consecutivos.</div>
          {msg&&<div className="error">{msg}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1.35fr",gap:10,position:"sticky",bottom:0,background:"#f6f8fb",paddingTop:4}}><button type="button" className="btn btn-outline" disabled={busy} onClick={()=>setOpen(false)}>Cancelar</button><button className="btn btn-primary" disabled={busy}>{busy?"Criando...":"Criar atividade"}</button></div>
        </form>
      </div>
    </div>}
  </>;
}
