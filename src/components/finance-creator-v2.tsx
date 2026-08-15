"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {FloatingCreate} from "@/components/floating-create";

export function FinanceCreatorV2({organizationId,projectId}:{organizationId:string;projectId:string}) {
  const [capexBudget,setCapexBudget]=useState("");
  const [opexBudget,setOpexBudget]=useState("");
  const [savingFullYear,setSavingFullYear]=useState("");
  const [savingInYear,setSavingInYear]=useState("");
  const [msg,setMsg]=useState("");

  async function submit(e:React.FormEvent){
    e.preventDefault();
    const s=createClient();
    const {error}=await s.from("budgets").insert({
      organization_id:organizationId,
      project_id:projectId,
      capex_budget:Number(capexBudget||0),
      opex_budget:Number(opexBudget||0),
      saving_full_year:Number(savingFullYear||0),
      saving_in_year:Number(savingInYear||0),
      budget:Number(capexBudget||0)+Number(opexBudget||0),
      saving:Number(savingFullYear||0)
    });
    if(error)setMsg(error.message);else location.reload();
  }

  const fields=[
    ["CAPEX Budget",capexBudget,setCapexBudget],
    ["OPEX Budget",opexBudget,setOpexBudget],
    ["Saving (Full Year)",savingFullYear,setSavingFullYear],
    ["Saving (Dentro do ano)",savingInYear,setSavingInYear],
  ] as const;

  return <FloatingCreate title="Registrar financeiro">
    <form className="card form" style={{margin:0}} onSubmit={submit}>
      <div className="grid grid-2">
        {fields.map(([label,value,setValue])=><div className="field" key={label}>
          <label>{label}</label>
          <input className="input" type="number" min="0" step="any" value={value} onChange={e=>setValue(e.target.value)}/>
        </div>)}
      </div>
      <button className="btn btn-primary btn-block">Salvar financeiro no projeto</button>
      {msg&&<div className="error">{msg}</div>}
    </form>
  </FloatingCreate>;
}
