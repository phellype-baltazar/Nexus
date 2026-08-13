"use client";
import {useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Ctx={level:"organization"|"group"|"program"|"project";id:string;name:string;group_id?:string;program_id?:string};

export function ContextManagement({organizationId,organizationName,groups,programs,projects,risks,kpis,budgets}:{organizationId:string;organizationName:string;groups:any[];programs:any[];projects:any[];risks:any[];kpis:any[];budgets:any[]}) {
  const contexts:Ctx[]=[{level:"organization",id:organizationId,name:organizationName},...groups.map(g=>({level:"group" as const,id:g.id,name:g.name})),...programs.map(p=>({level:"program" as const,id:p.id,name:p.name,group_id:p.group_id})),...projects.map(p=>({level:"project" as const,id:p.id,name:p.name,program_id:p.program_id}))];
  const [level,setLevel]=useState<Ctx["level"]>("organization"),[ctxId,setCtxId]=useState(organizationId),[tab,setTab]=useState<"kpis"|"risks"|"finance">("kpis"),[scopeMode,setScopeMode]=useState<"direct"|"consolidated">("consolidated"),[msg,setMsg]=useState("");
  const [name,setName]=useState(""),[unit,setUnit]=useState(""),[target,setTarget]=useState(""),[current,setCurrent]=useState("");
  const [category,setCategory]=useState(""),[probability,setProbability]=useState("medium"),[impact,setImpact]=useState("medium");
  const [budget,setBudget]=useState(""),[actual,setActual]=useState(""),[forecast,setForecast]=useState(""),[saving,setSaving]=useState("");
  const available=contexts.filter(c=>c.level===level);
  const selected=contexts.find(c=>c.level===level&&c.id===ctxId)||available[0];

  function match(x:any){
    if(!selected)return false;
    if(scopeMode==="direct"){
      if(selected.level==="organization") return !x.group_id&&!x.program_id&&!x.project_id;
      if(selected.level==="group") return x.group_id===selected.id;
      if(selected.level==="program") return x.program_id===selected.id;
      return x.project_id===selected.id;
    }
    if(selected.level==="organization") return true;
    if(selected.level==="group"){
      const programIds=programs.filter(p=>p.group_id===selected.id).map(p=>p.id);
      const projectIds=projects.filter(p=>programIds.includes(p.program_id)).map(p=>p.id);
      return x.group_id===selected.id || programIds.includes(x.program_id) || projectIds.includes(x.project_id);
    }
    if(selected.level==="program"){
      const projectIds=projects.filter(p=>p.program_id===selected.id).map(p=>p.id);
      return x.program_id===selected.id || projectIds.includes(x.project_id);
    }
    return x.project_id===selected.id;
  }
  const fk=useMemo(()=>kpis.filter(match),[selected?.level,selected?.id,scopeMode,kpis,programs,projects]);
  const fr=useMemo(()=>risks.filter(match),[selected?.level,selected?.id,scopeMode,risks,programs,projects]);
  const fb=useMemo(()=>budgets.filter(match),[selected?.level,selected?.id,scopeMode,budgets,programs,projects]);

  function changeLevel(v:Ctx["level"]){setLevel(v);const first=contexts.find(c=>c.level===v);setCtxId(first?.id||organizationId)}
  function contextPayload(){
    const p:any={organization_id:organizationId,group_id:null,program_id:null,project_id:null};
    if(selected?.level==="group")p.group_id=selected.id;
    if(selected?.level==="program")p.program_id=selected.id;
    if(selected?.level==="project")p.project_id=selected.id;
    return p;
  }

  async function addKpi(e:React.FormEvent){e.preventDefault();const s=createClient();const{error}=await s.from("kpis").insert({...contextPayload(),name:name.trim(),unit:unit||null,target:target?Number(target):null,current_value:current?Number(current):null});if(error)setMsg(error.message);else location.reload()}
  async function addRisk(e:React.FormEvent){e.preventDefault();const s=createClient();const{error}=await s.from("risks").insert({...contextPayload(),title:name.trim(),category:category||null,probability,impact});if(error)setMsg(error.message);else location.reload()}
  async function addFinance(e:React.FormEvent){e.preventDefault();const s=createClient();const{error}=await s.from("budgets").insert({...contextPayload(),budget:Number(budget||0),actual:Number(actual||0),forecast:Number(forecast||0),saving:Number(saving||0)});if(error)setMsg(error.message);else location.reload()}

  return <div className="form">
    <section className="card form"><h2>Contexto</h2><div className="grid grid-2"><div className="field"><label>Nível</label><select className="select" value={level} onChange={e=>changeLevel(e.target.value as Ctx["level"])}><option value="organization">Empresa</option><option value="group">Grupo / Direção</option><option value="program">Programa</option><option value="project">Projeto</option></select></div><div className="field"><label>Selecionar</label><select className="select" value={selected?.id||""} onChange={e=>setCtxId(e.target.value)}>{available.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div><div className="field"><label>Visualização</label><select className="select" value={scopeMode} onChange={e=>setScopeMode(e.target.value as "direct"|"consolidated")}><option value="consolidated">Consolidado abaixo</option><option value="direct">Somente deste nível</option></select></div><div className="notice">Tudo criado abaixo ficará vinculado diretamente a: <strong>{selected?.name}</strong>.</div></section>
    <div className="tabs"><button className={`tab ${tab==="kpis"?"active":""}`} onClick={()=>setTab("kpis")}>KPIs</button><button className={`tab ${tab==="risks"?"active":""}`} onClick={()=>setTab("risks")}>Riscos</button><button className={`tab ${tab==="finance"?"active":""}`} onClick={()=>setTab("finance")}>Financeiro</button></div>

    {tab==="kpis"&&<><section className="card list">{!fk.length?<div className="empty">Nenhum KPI neste nível.</div>:fk.map((k:any)=><div className="row" key={k.id}><div className="row-main"><div className="row-title">{k.name}</div><div className="row-sub">Atual {k.current_value??"—"} {k.unit||""} · Meta {k.target??"—"} · {k.frequency||"monthly"}</div></div><span className="chip">{k.trend||"—"}</span></div>)}</section><form className="card form" onSubmit={addKpi}><h2>Novo KPI neste contexto</h2><div className="field"><label>Nome</label><input className="input" value={name} onChange={e=>setName(e.target.value)} required/></div><div className="field"><label>Unidade</label><input className="input" value={unit} onChange={e=>setUnit(e.target.value)}/></div><div className="grid grid-2"><div className="field"><label>Atual</label><input className="input" type="number" step="any" value={current} onChange={e=>setCurrent(e.target.value)}/></div><div className="field"><label>Meta</label><input className="input" type="number" step="any" value={target} onChange={e=>setTarget(e.target.value)}/></div></div><button className="btn btn-primary btn-block">Adicionar KPI</button></form></>}

    {tab==="risks"&&<><section className="card list">{!fr.length?<div className="empty">Nenhum risco neste nível.</div>:fr.map((r:any)=><div className="row" key={r.id}><div className="row-main"><div className="row-title">{r.title}</div><div className="row-sub">{r.category||"Sem categoria"} · {r.probability}/{r.impact}</div></div><span className="chip warning">{r.score??"—"}</span></div>)}</section><form className="card form" onSubmit={addRisk}><h2>Novo risco neste contexto</h2><div className="field"><label>Risco</label><input className="input" value={name} onChange={e=>setName(e.target.value)} required/></div><div className="field"><label>Categoria</label><input className="input" value={category} onChange={e=>setCategory(e.target.value)}/></div><div className="grid grid-2"><div className="field"><label>Probabilidade</label><select className="select" value={probability} onChange={e=>setProbability(e.target.value)}><option value="very_low">Muito baixa</option><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="very_high">Muito alta</option></select></div><div className="field"><label>Impacto</label><select className="select" value={impact} onChange={e=>setImpact(e.target.value)}><option value="very_low">Muito baixo</option><option value="low">Baixo</option><option value="medium">Médio</option><option value="high">Alto</option><option value="very_high">Muito alto</option></select></div></div><button className="btn btn-primary btn-block">Adicionar risco</button></form></>}

    {tab==="finance"&&<><section className="card list">{!fb.length?<div className="empty">Nenhum registro financeiro neste nível.</div>:fb.map((b:any)=><div className="row" key={b.id}><div className="row-main"><div className="row-title">{b.currency} · orçamento {Number(b.budget||0).toLocaleString("pt-BR")}</div><div className="row-sub">Realizado {Number(b.actual||0).toLocaleString("pt-BR")} · Forecast {Number(b.forecast||0).toLocaleString("pt-BR")} · Saving {Number(b.saving||0).toLocaleString("pt-BR")}</div></div></div>)}</section><form className="card form" onSubmit={addFinance}><h2>Novo financeiro neste contexto</h2><div className="grid grid-2"><div className="field"><label>Orçamento</label><input className="input" type="number" step="any" value={budget} onChange={e=>setBudget(e.target.value)}/></div><div className="field"><label>Realizado</label><input className="input" type="number" step="any" value={actual} onChange={e=>setActual(e.target.value)}/></div><div className="field"><label>Forecast</label><input className="input" type="number" step="any" value={forecast} onChange={e=>setForecast(e.target.value)}/></div><div className="field"><label>Saving</label><input className="input" type="number" step="any" value={saving} onChange={e=>setSaving(e.target.value)}/></div></div><button className="btn btn-primary btn-block">Adicionar financeiro</button></form></>}
    {msg&&<div className="error">{msg}</div>}
  </div>;
}
