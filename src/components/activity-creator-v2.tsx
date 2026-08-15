"use client";

import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type EffortProfile="flat"|"front_loaded"|"back_loaded"|"bell"|"double_peak"|"shifted_peak";

const PROFILES:{key:EffortProfile;label:string;short:string;path:string;hint:string}[]=[
  {key:"flat",label:"Flat",short:"Constante",path:"M3 13 L29 13",hint:"Esforço uniforme durante todo o período."},
  {key:"front_loaded",label:"Front-Loaded",short:"Início",path:"M3 4 C10 5 17 10 29 17",hint:"Maior esforço no início, reduzindo até o fim."},
  {key:"back_loaded",label:"Back-Loaded",short:"Final",path:"M3 17 C15 16 22 8 29 4",hint:"Começa leve e concentra esforço no final."},
  {key:"bell",label:"Bell-Shaped",short:"Sino",path:"M3 17 C9 17 10 5 16 4 C22 5 23 17 29 17",hint:"Esforço cresce até o meio e depois diminui."},
  {key:"double_peak",label:"Double Peak",short:"Duplo pico",path:"M3 16 C7 4 11 4 14 15 C17 18 20 4 24 4 C27 6 28 12 29 16",hint:"Picos no início e no final, com vale no meio."},
  {key:"shifted_peak",label:"Early / Late",short:"Pico deslocado",path:"M3 17 C7 16 8 6 12 4 C18 7 22 14 29 17",hint:"Pico deslocado para o início ou para o final."},
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
  const w=weights(n,profile,timing); const sum=w.reduce((a,b)=>a+b,0); const max=Math.max(...w);
  return Math.floor((10*sum/max)*2)/2;
}

function curve(n:number,total:number,profile:EffortProfile,timing:"early"|"late"="early"){
  if(n<=0||total<=0)return [];
  const w=weights(n,profile,timing); const sum=w.reduce((a,b)=>a+b,0);
  return w.map(v=>total*v/sum);
}

function CurveIcon({path}:{path:string}){return <svg viewBox="0 0 32 22" width="46" height="31" aria-hidden="true"><path d="M2 19 H30" fill="none" stroke="currentColor" strokeWidth="1" opacity=".28"/><path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>}

const cellStyle={minHeight:122,padding:"14px 12px",display:"flex",flexDirection:"column" as const,justifyContent:"center",gap:8,textAlign:"center" as const,boxSizing:"border-box" as const,overflow:"hidden"};

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
  const [proposal,setProposal]=useState<{profile:EffortProfile;timing:"early"|"late";max:number}|null>(null);
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);

  const days=useMemo(()=>inclusiveDays(start,due),[start,due]);
  const absoluteMax=days*10;
  const selectedMax=useMemo(()=>profileMaxHours(days,profile,timing),[days,profile,timing]);
  const hourValue=Number(hours||0);
  const preview=useMemo(()=>curve(days,hourValue,profile,timing),[days,hourValue,profile,timing]);
  const previewMax=Math.max(0,...preview);

  function chooseProfile(next:EffortProfile,nextTiming:"early"|"late"=timing){
    const max=profileMaxHours(days,next,nextTiming);
    if(days>0&&hourValue>max){setProposal({profile:next,timing:nextTiming,max});return;}
    setProfile(next);if(next==="shifted_peak")setTiming(nextTiming);
  }

  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg("");
    if(!start||!due){setMsg("Informe data de início e data prevista.");setBusy(false);return;}
    if(due<start){setMsg("A data prevista não pode ser anterior à data de início.");setBusy(false);return;}
    if(owner==="__external__"&&!externalOwner.trim()){setMsg("Informe o nome do responsável externo.");setBusy(false);return;}
    if(!Number.isFinite(hourValue)||hourValue<0){setMsg("Informe uma quantidade válida de horas.");setBusy(false);return;}
    if(hourValue>absoluteMax){setMsg(`Máximo absoluto para este período: ${absoluteMax} h.`);setBusy(false);return;}
    if(hourValue>selectedMax){setMsg(`Com a curva escolhida, o máximo é ${selectedMax} h para manter até 10 h por dia.`);setBusy(false);return;}
    const s=createClient();
    const {error}=await s.from("activities").insert({organization_id:organizationId,project_id:projectId,title:title.trim(),description:description.trim()||null,start_date:start,due_date:due,primary_owner_id:owner&&owner!=="__external__"?owner:null,external_owner_name:owner==="__external__"?externalOwner.trim():null,priority,status:"todo",estimated_hours:hours?hourValue:null,effort_profile:profile,shifted_peak_timing:profile==="shifted_peak"?timing:null});
    if(error){setMsg(error.message);setBusy(false);return;}
    setOpen(false);
    location.reload();
  }

  return <>
    <button
      type="button"
      aria-label="Criar nova atividade"
      title="Nova atividade"
      onClick={()=>{setMsg("");setOpen(true)}}
      style={{position:"fixed",right:20,bottom:"calc(86px + env(safe-area-inset-bottom, 0px))",zIndex:70,width:60,height:60,borderRadius:"50%",border:0,background:"var(--primary)",color:"white",fontSize:38,fontWeight:300,lineHeight:1,display:"grid",placeItems:"center",boxShadow:"0 10px 28px rgba(37,99,235,.34)",cursor:"pointer"}}
    >+</button>

    {open&&<div role="dialog" aria-modal="true" aria-label="Nova atividade" onClick={()=>!busy&&setOpen(false)} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(15,23,42,.42)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:620,maxHeight:"92dvh",overflowY:"auto",background:"var(--background, #f8fafc)",borderRadius:"26px 26px 0 0",padding:"10px 16px calc(24px + env(safe-area-inset-bottom, 0px))",boxShadow:"0 -18px 50px rgba(15,23,42,.18)"}}>
        <div style={{width:44,height:5,borderRadius:999,background:"#cbd5e1",margin:"2px auto 14px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:8}}>
          <h2 style={{margin:0}}>Nova atividade</h2>
          <button type="button" aria-label="Fechar" onClick={()=>!busy&&setOpen(false)} style={{width:40,height:40,borderRadius:"50%",border:"1px solid var(--line)",background:"white",fontSize:24,lineHeight:1,cursor:"pointer"}}>×</button>
        </div>

        <form className="form" onSubmit={submit}>
          <section className="card"><div className="field"><label>Título</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)} required placeholder="Nome da atividade"/></div><div className="field"><label>Comentários iniciais</label><textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)} rows={3}/></div></section>

          <section style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginTop:12}}>
            <div className="card" style={cellStyle}><div className="eyebrow">Data de início</div><input className="input" type="date" value={start} max={due||undefined} onChange={e=>setStart(e.target.value)} required/></div>
            <div className="card" style={cellStyle}><div className="eyebrow">Data prevista</div><input className="input" type="date" value={due} min={start||undefined} onChange={e=>setDue(e.target.value)} required/></div>
            <div className="card" style={cellStyle}><div className="eyebrow">Responsável</div><select className="select" value={owner} onChange={e=>setOwner(e.target.value)}><option value="">Sem responsável</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.full_name||m.email||"Usuário"}</option>)}<option value="__external__">Outro / responsável externo</option></select>{owner==="__external__"&&<input className="input" value={externalOwner} onChange={e=>setExternalOwner(e.target.value)} placeholder="Nome externo" maxLength={160}/>}</div>
            <div className="card" style={cellStyle}><div className="eyebrow">Horas previstas</div><input className="input" type="number" min="0" max={selectedMax||absoluteMax||undefined} step="0.5" value={hours} onChange={e=>setHours(e.target.value)}/>{days>0&&<div className="muted" style={{fontSize:11}}>Máx. com esta curva: <strong>{selectedMax} h</strong></div>}</div>
          </section>

          <section className="card" style={{marginTop:12}}><div className="field"><label>Prioridade</label><select className="select" value={priority} onChange={e=>setPriority(e.target.value)}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="critical">Crítica</option></select></div></section>

          <section className="card" style={{marginTop:12}}><h2 style={{marginBottom:4}}>Distribuição do esforço</h2><p className="muted" style={{marginTop:0,fontSize:13}}>Defina como as horas serão distribuídas entre as duas datas. As datas ficam bloqueadas depois que a atividade for criada.</p><div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8,marginTop:12}}>{PROFILES.map(p=>{const active=profile===p.key;return <button key={p.key} type="button" onClick={()=>chooseProfile(p.key)} style={{minHeight:88,borderRadius:16,border:`1px solid ${active?"var(--primary)":"var(--line)"}`,background:active?"#edf4ff":"white",color:active?"var(--primary)":"var(--text)",padding:"8px 5px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,fontWeight:800}}><CurveIcon path={p.path}/><span style={{fontSize:11}}>{p.short}</span></button>})}</div>{profile==="shifted_peak"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}><button type="button" className={`btn ${timing==="early"?"btn-primary":"btn-outline"}`} onClick={()=>chooseProfile("shifted_peak","early")}>Pico Early</button><button type="button" className={`btn ${timing==="late"?"btn-primary":"btn-outline"}`} onClick={()=>chooseProfile("shifted_peak","late")}>Pico Late</button></div>}{preview.length>0&&<div style={{marginTop:14,paddingTop:12,borderTop:"1px solid var(--line)"}}><div style={{display:"flex",justifyContent:"space-between"}}><strong>Prévia da carga</strong><strong>{hourValue||0} h</strong></div><div style={{height:84,display:"flex",alignItems:"flex-end",gap:2,marginTop:10,borderBottom:"1px solid var(--line)"}}>{preview.map((h,i)=><div key={i} title={`${h.toFixed(2)} h`} style={{flex:1,minWidth:2,height:`${Math.max(4,previewMax?Math.round(h/previewMax*76):4)}px`,background:h>10?"#b42318":"var(--primary)",borderRadius:"3px 3px 0 0"}}/>)}</div></div>}</section>

          <div className="notice" style={{marginTop:12}}>Limite duro: até 10 h por dia considerando todas as atividades do responsável. O Nexus também sinaliza risco acima de 44 h semanais ou 7 dias consecutivos.</div>
          {msg&&<div className="error" style={{marginTop:10}}>{msg}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1.35fr",gap:10,marginTop:12}}>
            <button type="button" className="btn btn-outline" disabled={busy} onClick={()=>setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" disabled={busy}>{busy?"Criando...":"Criar atividade"}</button>
          </div>

          {proposal&&<div role="dialog" aria-modal="true" style={{position:"fixed",inset:0,zIndex:120,background:"rgba(15,23,42,.38)",display:"flex",alignItems:"flex-end",justifyContent:"center",padding:18}}><div className="card" style={{width:"100%",maxWidth:520,margin:0,borderRadius:24,padding:20}}><h2>Ajustar horas previstas?</h2><p>Com <strong>{PROFILES.find(p=>p.key===proposal.profile)?.short}</strong>, {hourValue} h ultrapassaria 10 h em pelo menos um dia.</p><div className="notice">Para usar esta curva, reduza para no máximo <strong>{proposal.max} h</strong>.</div><button type="button" className="btn btn-primary btn-block" style={{marginTop:12}} onClick={()=>{setHours(String(proposal.max));setProfile(proposal.profile);setTiming(proposal.timing);setProposal(null)}}>Ajustar para {proposal.max} h e aplicar</button><button type="button" className="btn btn-outline btn-block" style={{marginTop:10}} onClick={()=>setProposal(null)}>Cancelar</button></div></div>}
        </form>
      </div>
    </div>}
  </>;
}
