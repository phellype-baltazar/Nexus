"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

type Branding={display_name?:string|null;logo_url?:string|null;primary_color?:string|null;secondary_color?:string|null;accent_color?:string|null};

const BRANDING_BUCKET="organization-branding";
const MAX_LOGO_BYTES=5*1024*1024;
const ALLOWED_TYPES=new Set(["image/png","image/jpeg","image/webp","image/svg+xml"]);

export function BrandingEditor({organizationId,initial}:{organizationId:string;initial:Branding}){
  const router=useRouter();
  const s=createClient();
  const[displayName,setDisplayName]=useState(initial.display_name||"");
  const[primary,setPrimary]=useState(initial.primary_color||"#1f5bc4");
  const[secondary,setSecondary]=useState(initial.secondary_color||"#eef3fb");
  const[accent,setAccent]=useState(initial.accent_color||"#1f5bc4");
  const[logoUrl,setLogoUrl]=useState(initial.logo_url||"");
  const[file,setFile]=useState<File|null>(null);
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState("");

  function chooseFile(next:File|null){
    setMsg("");
    if(!next){setFile(null);return;}
    if(!ALLOWED_TYPES.has(next.type)){setFile(null);setMsg("Formato de logo não suportado. Use PNG, JPG, WEBP ou SVG.");return;}
    if(next.size>MAX_LOGO_BYTES){setFile(null);setMsg("O logo deve ter no máximo 5 MB.");return;}
    setFile(next);
  }

  async function save(){
    setBusy(true);setMsg("");
    try{
      let nextLogo=logoUrl;
      if(file){
        const ext=(file.name.split(".").pop()||"png").toLowerCase().replace(/[^a-z0-9]/g,"");
        const path=`${organizationId}/logo-${Date.now()}.${ext||"png"}`;
        const up=await s.storage.from(BRANDING_BUCKET).upload(path,file,{upsert:true,contentType:file.type||undefined,cacheControl:"3600"});
        if(up.error)throw up.error;
        nextLogo=s.storage.from(BRANDING_BUCKET).getPublicUrl(path).data.publicUrl;
      }
      const{error}=await s.from("organization_settings").upsert({organization_id:organizationId,display_name:displayName||null,logo_url:nextLogo||null,primary_color:primary,secondary_color:secondary,accent_color:accent,updated_at:new Date().toISOString()},{onConflict:"organization_id"});
      if(error)throw error;
      setLogoUrl(nextLogo);setFile(null);setMsg("Identidade visual salva.");router.refresh();
    }catch(e:any){
      const raw=String(e?.message||"");
      if(raw.toLowerCase().includes("row-level security"))setMsg("Você não tem permissão de administrador para alterar a identidade visual deste workspace.");
      else if(raw.toLowerCase().includes("bucket"))setMsg("Não foi possível acessar o armazenamento de logos. Tente novamente após atualizar a página.");
      else setMsg(raw||"Não foi possível salvar.");
    }finally{setBusy(false);}
  }

  return <section className="card form">
    <div className="section-title" style={{margin:0}}><h2>Identidade visual</h2></div>
    <div className="field"><label>Nome exibido</label><input className="input" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Nome da empresa"/></div>
    <div className="field"><label>Logo</label>{logoUrl?<img src={logoUrl} alt="Logo atual" style={{maxWidth:180,maxHeight:72,objectFit:"contain",objectPosition:"left center",marginBottom:8}}/>:null}<input className="input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>chooseFile(e.target.files?.[0]||null)}/><div className="row-sub">PNG, JPG, WEBP ou SVG · máximo 5 MB. A mesma marca será usada no app e nos relatórios.</div></div>
    <div className="grid grid-2">
      <div className="field"><label>Cor principal</label><input className="input" type="color" value={primary} onChange={e=>setPrimary(e.target.value)} style={{padding:6}}/></div>
      <div className="field"><label>Cor secundária</label><input className="input" type="color" value={secondary} onChange={e=>setSecondary(e.target.value)} style={{padding:6}}/></div>
    </div>
    <div className="field"><label>Cor de destaque</label><input className="input" type="color" value={accent} onChange={e=>setAccent(e.target.value)} style={{padding:6}}/></div>
    <div className="card" style={{boxShadow:"none",background:secondary,borderColor:accent}}><div style={{fontWeight:900,color:primary}}>Prévia da marca</div><div className="row-sub">Botões, seleções, cabeçalho e relatórios usarão estas cores.</div><div className="btn" style={{background:primary,color:"#fff",marginTop:12}}>Ação principal</div></div>
    {msg?<div className={msg.includes("salva")?"successbox":"error"}>{msg}</div>:null}
    <button className="btn btn-primary btn-block" disabled={busy} onClick={save}>{busy?"Salvando...":"Salvar identidade visual"}</button>
  </section>;
}
