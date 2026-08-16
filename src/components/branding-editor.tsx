"use client";

import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

type Branding={display_name?:string|null;logo_url?:string|null;primary_color?:string|null;secondary_color?:string|null;accent_color?:string|null};
type HSV={h:number;s:number;v:number};

const BRANDING_BUCKET="organization-branding";
const MAX_LOGO_BYTES=5*1024*1024;
const ALLOWED_TYPES=new Set(["image/png","image/jpeg","image/webp","image/svg+xml"]);

function clamp(n:number,min:number,max:number){return Math.min(max,Math.max(min,n));}
function hexToHsv(hex:string):HSV{
  const safe=(hex||"#000000").replace("#","").padEnd(6,"0").slice(0,6);
  const r=parseInt(safe.slice(0,2),16)/255,g=parseInt(safe.slice(2,4),16)/255,b=parseInt(safe.slice(4,6),16)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=0;
  if(d){if(max===r)h=60*(((g-b)/d)%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4);}
  if(h<0)h+=360;
  return{h,s:max===0?0:(d/max)*100,v:max*100};
}
function hsvToHex({h,s,v}:HSV){
  const sat=clamp(s,0,100)/100,val=clamp(v,0,100)/100,c=val*sat,x=c*(1-Math.abs(((h/60)%2)-1)),m=val-c;
  let rp=0,gp=0,bp=0;
  if(h<60){rp=c;gp=x;}else if(h<120){rp=x;gp=c;}else if(h<180){gp=c;bp=x;}else if(h<240){gp=x;bp=c;}else if(h<300){rp=x;bp=c;}else{rp=c;bp=x;}
  const toHex=(n:number)=>Math.round((n+m)*255).toString(16).padStart(2,"0");
  return`#${toHex(rp)}${toHex(gp)}${toHex(bp)}`;
}

async function fileToCompactDataUrl(file:File){
  if(file.type==="image/svg+xml"){
    const text=await file.text();
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(text)))}`;
  }
  const source=URL.createObjectURL(file);
  try{
    const image=await new Promise<HTMLImageElement>((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error("Não foi possível processar a imagem selecionada."));
      img.src=source;
    });
    const maxW=900,maxH=320;
    const scale=Math.min(1,maxW/image.naturalWidth,maxH/image.naturalHeight);
    const width=Math.max(1,Math.round(image.naturalWidth*scale));
    const height=Math.max(1,Math.round(image.naturalHeight*scale));
    const canvas=document.createElement("canvas");
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext("2d");
    if(!ctx)throw new Error("Não foi possível processar o logo.");
    ctx.clearRect(0,0,width,height);
    ctx.drawImage(image,0,0,width,height);
    return canvas.toDataURL("image/webp",.86);
  }finally{URL.revokeObjectURL(source);}
}

function ColorEditor({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){
  const[open,setOpen]=useState(false);
  const[draft,setDraft]=useState<HSV>(()=>hexToHsv(value));
  useEffect(()=>{if(!open)setDraft(hexToHsv(value));},[value,open]);
  const selected=useMemo(()=>hsvToHex(draft),[draft]);
  const hueColor=hsvToHex({h:draft.h,s:100,v:100});
  const sliderStyle={width:"100%",height:34,appearance:"none" as const,borderRadius:10,outline:"none",border:"1px solid #cbd5e1"};
  return <div className="field">
    <label>{label}</label>
    <button type="button" className="input" onClick={()=>{setDraft(hexToHsv(value));setOpen(true);}} style={{height:58,padding:8,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
      <span style={{width:70,height:40,borderRadius:8,background:value,border:"1px solid #94a3b8",display:"block"}}/>
      <span style={{fontWeight:800,color:"var(--ink)"}}>{value.toUpperCase()}</span>
    </button>
    {open?<div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(15,23,42,.55)",display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}} onClick={()=>setOpen(false)}>
      <div onClick={e=>e.stopPropagation()} style={{width:"min(620px,100%)",background:"#fff",borderRadius:24,padding:22,boxShadow:"0 24px 60px rgba(0,0,0,.28)"}}>
        <h3 style={{margin:"0 0 18px",fontSize:26}}>Selecionar cor</h3>
        <div style={{display:"grid",gap:18}}>
          <div><div style={{fontWeight:800,marginBottom:7}}>Matiz</div><input type="range" min="0" max="359" value={Math.round(draft.h)} onChange={e=>setDraft(d=>({...d,h:Number(e.target.value)}))} style={{...sliderStyle,background:"linear-gradient(to right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)"}}/></div>
          <div><div style={{fontWeight:800,marginBottom:7}}>Saturação</div><input type="range" min="0" max="100" value={100-Math.round(draft.s)} onChange={e=>setDraft(d=>({...d,s:100-Number(e.target.value)}))} style={{...sliderStyle,background:`linear-gradient(to right,${hueColor},#ffffff)`}}/><div style={{fontSize:12,color:"#64748b",marginTop:5}}>Mais intensa à esquerda · mais neutra à direita</div></div>
          <div><div style={{fontWeight:800,marginBottom:7}}>Valor</div><input type="range" min="0" max="100" value={100-Math.round(draft.v)} onChange={e=>setDraft(d=>({...d,v:100-Number(e.target.value)}))} style={{...sliderStyle,background:"linear-gradient(to right,#ffffff,#000000)"}}/><div style={{fontSize:12,color:"#64748b",marginTop:5}}>Branco à esquerda · preto à direita</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginTop:22,paddingTop:18,borderTop:"1px solid #e2e8f0"}}>
          <div><div style={{fontSize:13,color:"#64748b"}}>Cor escolhida</div><div style={{display:"flex",alignItems:"center",gap:10,marginTop:5}}><span style={{width:54,height:54,borderRadius:10,background:selected,border:"2px solid #cbd5e1"}}/><strong>{selected.toUpperCase()}</strong></div></div>
          <div style={{display:"flex",gap:10}}><button type="button" className="btn" onClick={()=>setOpen(false)}>Cancelar</button><button type="button" className="btn btn-primary" onClick={()=>{onChange(selected);setOpen(false);}}>Definir</button></div>
        </div>
      </div>
    </div>:null}
  </div>;
}

export function BrandingEditor({organizationId,initial}:{organizationId:string;initial:Branding}){
  const router=useRouter();
  const s=createClient();
  const[displayName,setDisplayName]=useState(initial.display_name||"");
  const[primary,setPrimary]=useState(initial.primary_color||"#1f5bc4");
  const[secondary,setSecondary]=useState(initial.secondary_color||"#eef3fb");
  const[accent,setAccent]=useState(initial.accent_color||"#1f5bc4");
  const[logoUrl,setLogoUrl]=useState(initial.logo_url||"");
  const[file,setFile]=useState<File|null>(null);
  const[localPreview,setLocalPreview]=useState("");
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState("");

  useEffect(()=>{
    if(!file){setLocalPreview("");return;}
    const url=URL.createObjectURL(file);
    setLocalPreview(url);
    return()=>URL.revokeObjectURL(url);
  },[file]);

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
      let usedFallback=false;
      if(file){
        const ext=(file.name.split(".").pop()||"png").toLowerCase().replace(/[^a-z0-9]/g,"");
        const path=`${organizationId}/logo.${ext||"png"}`;
        const up=await s.storage.from(BRANDING_BUCKET).upload(path,file,{upsert:true,contentType:file.type||undefined,cacheControl:"3600"});
        if(!up.error){
          const publicData=s.storage.from(BRANDING_BUCKET).getPublicUrl(path).data;
          nextLogo=`${publicData.publicUrl}?v=${Date.now()}`;
        }else{
          nextLogo=await fileToCompactDataUrl(file);
          usedFallback=true;
        }
      }
      const{error}=await s.from("organization_settings").upsert({organization_id:organizationId,display_name:displayName||null,logo_url:nextLogo||null,primary_color:primary,secondary_color:secondary,accent_color:accent,updated_at:new Date().toISOString()},{onConflict:"organization_id"});
      if(error)throw error;
      setLogoUrl(nextLogo);setFile(null);setMsg(usedFallback?"Identidade visual salva. O logo foi otimizado e armazenado com segurança na configuração.":"Identidade visual salva.");router.refresh();
    }catch(e:any){
      const raw=String(e?.message||"");
      const low=raw.toLowerCase();
      if(low.includes("row-level security")||low.includes("policy"))setMsg("Você não tem permissão de administrador para alterar a identidade visual deste workspace.");
      else if(low.includes("mime")||low.includes("content type"))setMsg("Formato de arquivo não permitido. Use PNG, JPG, WEBP ou SVG.");
      else if(low.includes("size")||low.includes("too large"))setMsg("O logo deve ter no máximo 5 MB.");
      else setMsg(raw||"Não foi possível salvar.");
    }finally{setBusy(false);}
  }

  const previewLogo=localPreview||logoUrl;

  return <section className="card form">
    <div className="section-title" style={{margin:0}}><h2>Identidade visual</h2></div>
    <div className="field"><label>Nome exibido</label><input className="input" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Nome da empresa"/></div>
    <div className="field"><label>Logo</label>{previewLogo?<div style={{minHeight:86,border:"1px solid var(--line)",borderRadius:14,display:"flex",alignItems:"center",padding:12,background:"#fff"}}><img src={previewLogo} alt="Prévia do logo" style={{maxWidth:220,maxHeight:70,objectFit:"contain",objectPosition:"left center"}}/></div>:null}<input className="input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>chooseFile(e.target.files?.[0]||null)}/><div className="row-sub">PNG, JPG, WEBP ou SVG · máximo 5 MB. A prévia aparece antes de salvar e a mesma marca será usada no app e nos relatórios.</div></div>
    <div className="grid grid-2"><ColorEditor label="Cor principal" value={primary} onChange={setPrimary}/><ColorEditor label="Cor secundária" value={secondary} onChange={setSecondary}/></div>
    <ColorEditor label="Cor de destaque" value={accent} onChange={setAccent}/>
    <div className="card" style={{boxShadow:"none",background:secondary,borderColor:accent}}>{previewLogo?<img src={previewLogo} alt="Marca" style={{maxWidth:150,maxHeight:52,objectFit:"contain",marginBottom:10}}/>:null}<div style={{fontWeight:900,color:primary}}>Prévia da marca</div><div className="row-sub">Botões, seleções, cabeçalho e relatórios usarão estas cores.</div><div className="btn" style={{background:primary,color:"#fff",marginTop:12}}>Ação principal</div></div>
    {msg?<div className={msg.includes("salva")?"successbox":"error"}>{msg}</div>:null}
    <button className="btn btn-primary btn-block" disabled={busy} onClick={save}>{busy?"Salvando...":"Salvar identidade visual"}</button>
  </section>;
}
