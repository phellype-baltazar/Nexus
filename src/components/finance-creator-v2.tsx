"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {FloatingCreate} from "@/components/floating-create";

export function FinanceCreatorV2({organizationId,projectId}:{organizationId:string;projectId:string}) {
  const [label,setLabel]=useState("");
  const [amount,setAmount]=useState("");
  const [notes,setNotes]=useState("");
  const [msg,setMsg]=useState("");

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setMsg("");
    const s=createClient();
    const {data:{user}}=await s.auth.getUser();
    const {error}=await s.from("project_financial_items").insert({
      organization_id:organizationId,
      project_id:projectId,
      label:label.trim(),
      amount:Number(amount||0),
      currency:"BRL",
      notes:notes.trim()||null,
      created_by:user?.id||null
    });
    if(error)setMsg(error.message);else location.reload();
  }

  return <FloatingCreate title="Adicionar item financeiro">
    <form className="card form" style={{margin:0}} onSubmit={submit}>
      <div className="field">
        <label>Nome do item</label>
        <input className="input" value={label} onChange={e=>setLabel(e.target.value)} placeholder="Ex.: Treinamento, Licença, Receita adicional..." maxLength={80} required/>
      </div>
      <div className="field">
        <label>Valor</label>
        <input className="input" type="number" step="any" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0,00" required/>
      </div>
      <div className="field">
        <label>Observação <span className="muted">(opcional)</span></label>
        <textarea className="textarea" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Detalhe do item financeiro"/>
      </div>
      <button className="btn btn-primary btn-block">Adicionar item</button>
      {msg&&<div className="error">{msg}</div>}
    </form>
  </FloatingCreate>;
}
