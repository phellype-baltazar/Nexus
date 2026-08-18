import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {OnboardingV2} from "@/components/onboarding-v2";
import {createClient} from "@/lib/supabase/server";

const ROLE_LABELS:Record<string,string>={
  group_admin:"Diretor",
  program_manager:"Program Manager",
  project_manager:"Project Manager",
  member:"Time",
};

async function getInvitePreview(code:string){
  if(!code)return null;
  const s=await createClient();
  const {data}=await s.rpc("rpc_workspace_invite_preview",{p_code:code});
  return data||null;
}

async function openWorkspace(formData:FormData){
  "use server";
  const organizationId=String(formData.get("organization_id")||"");
  const code=String(formData.get("code")||"");
  if(!organizationId)redirect(code?`/invite/${encodeURIComponent(code)}`:"/app/workspace");

  const s=await createClient();
  const {data:claims}=await s.auth.getClaims();
  const userId=String(claims?.claims?.sub||"");
  if(!userId)redirect(`/login?next=${encodeURIComponent(code?`/invite/${code}`:"/app/workspace")}`);

  const {data:membership}=await s.from("organization_members")
    .select("status,valid_until")
    .eq("organization_id",organizationId)
    .eq("user_id",userId)
    .maybeSingle();

  const valid=membership?.status==="active"&&(!membership?.valid_until||new Date(membership.valid_until).getTime()>Date.now());
  if(!valid)redirect(code?`/invite/${encodeURIComponent(code)}`:"/app/workspace");

  const {data,error}=await s.rpc("rpc_set_current_workspace",{p_organization_id:organizationId,p_group_id:null});
  if(error||data!==true)redirect("/app/workspace?switch=error");

  redirect("/app/dashboard");
}

export async function generateMetadata({params}:{params:Promise<{code:string}>}):Promise<Metadata>{
  const {code}=await params;
  const preview:any=await getInvitePreview(code);
  if(!preview)return{title:"Convite para workspace"};

  const displayName=preview?.display_name||preview?.organization_name||"Workspace";
  const description=`Você foi convidado para solicitar acesso ao workspace ${displayName}.`;
  const logo=preview?.logo_url||undefined;

  return{
    title:`Convite · ${displayName}`,
    description,
    applicationName:displayName,
    icons:logo?{icon:[{url:logo}],shortcut:[{url:logo}],apple:[{url:logo}]}:undefined,
    openGraph:{
      title:`Convite · ${displayName}`,
      description,
      type:"website",
      siteName:displayName,
      images:logo?[{url:logo,alt:`Logo ${displayName}`}]:undefined,
    },
    twitter:{
      card:logo?"summary_large_image":"summary",
      title:`Convite · ${displayName}`,
      description,
      images:logo?[logo]:undefined,
    },
  };
}

export default async function InvitePage({params}:{params:Promise<{code:string}>}){
  const {code}=await params;
  const preview:any=await getInvitePreview(code);
  const s=await createClient();
  const {data:claims}=await s.auth.getClaims();
  const userId=String(claims?.claims?.sub||"");

  if(!preview){
    return <main className="login-wrap"><section className="card login-card"><span className="eyebrow">Convite</span><h1>Convite indisponível</h1><p className="muted">Este convite não existe mais ou expirou.</p></section></main>;
  }

  const organizationId=String(preview?.organization_id||"");
  let activeMembership=false;
  if(userId&&organizationId){
    const {data:membership}=await s.from("organization_members")
      .select("status,valid_until")
      .eq("organization_id",organizationId)
      .eq("user_id",userId)
      .maybeSingle();
    activeMembership=membership?.status==="active"&&(!membership?.valid_until||new Date(membership.valid_until).getTime()>Date.now());
  }

  const primary=preview?.primary_color||"#5b21b6";
  const secondary=preview?.secondary_color||"#f5f7fb";
  const accent=preview?.accent_color||primary;
  const displayName=preview?.display_name||preview?.organization_name||"Workspace";
  const roleLabel=ROLE_LABELS[preview?.requested_role]||"Time";
  const next=`/invite/${encodeURIComponent(code)}`;

  return <main className="login-wrap" style={{background:`linear-gradient(180deg, ${secondary} 0%, #ffffff 100%)`}}>
    <section className="card login-card" style={{borderColor:accent,boxShadow:`0 18px 50px color-mix(in srgb, ${primary} 14%, transparent)`}}>
      {preview?.logo_url?<div style={{display:"flex",justifyContent:"center",marginBottom:16}}><img src={preview.logo_url} alt={displayName} style={{maxWidth:240,maxHeight:104,objectFit:"contain"}}/></div>:null}
      <span className="eyebrow" style={{color:primary}}>Convite para workspace</span>
      <h1 style={{color:primary}}>{displayName}</h1>

      {!userId?<>
        <p className="muted">Você foi convidado para solicitar acesso a este workspace. Perfil sugerido: <strong>{roleLabel}</strong>. Seu acesso será revisado antes da liberação.</p>
        <div className="notice" style={{borderColor:accent,background:secondary}}><strong style={{color:primary}}>Identidade do workspace</strong><div className="row-sub" style={{marginTop:4}}>Este convite usa o logo, nome e cores definidos pelo workspace.</div></div>
        <Link className="btn btn-primary btn-block" href={`/login?next=${encodeURIComponent(next)}`} style={{background:primary,borderColor:primary}}>Entrar para solicitar acesso</Link>
      </>:activeMembership?<>
        <div className="successbox"><strong>Acesso liberado</strong><br/>Você já é membro deste workspace. Abra-o diretamente abaixo.</div>
        <form action={openWorkspace}>
          <input type="hidden" name="organization_id" value={organizationId}/>
          <input type="hidden" name="code" value={code}/>
          <button className="btn btn-primary btn-block" type="submit" style={{background:primary,borderColor:primary}}>Abrir {displayName}</button>
        </form>
        <Link className="btn btn-outline btn-block" href="/app/workspace">Meus workspaces</Link>
      </>:<>
        <p className="muted">Você foi convidado para solicitar acesso a este workspace. Perfil sugerido: <strong>{roleLabel}</strong>. Seu acesso será revisado antes da liberação.</p>
        <OnboardingV2 initialCode={code}/>
      </>}
    </section>
  </main>;
}
