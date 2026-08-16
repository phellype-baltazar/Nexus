import {redirect} from "next/navigation";
import {OnboardingV2} from "@/components/onboarding-v2";
import {createClient} from "@/lib/supabase/server";

const ROLE_LABELS:Record<string,string>={program_manager:"Program Manager",project_manager:"Project Manager",member:"Time"};

export default async function Page({searchParams}:{searchParams:Promise<{invite?:string}>}){
  const {invite=""}=await searchParams;
  const s=await createClient();
  let preview:any=null;

  if(invite){
    const {data}=await s.rpc("rpc_workspace_invite_preview",{p_code:invite});
    preview=data;
    const {data:claims}=await s.auth.getClaims();
    const userId=String(claims?.claims?.sub||"");
    if(!userId) redirect(`/login?next=${encodeURIComponent(`/onboarding?invite=${invite}`)}`);
  }

  const primary=preview?.primary_color||"#5b21b6";
  const secondary=preview?.secondary_color||"#f5f7fb";
  const accent=preview?.accent_color||primary;
  const displayName=preview?.display_name||preview?.organization_name;

  return <main className="login-wrap" style={preview?{background:`linear-gradient(180deg, ${secondary} 0%, #ffffff 100%)`}:undefined}>
    <section className="card login-card" style={preview?{borderColor:accent,boxShadow:`0 18px 50px color-mix(in srgb, ${primary} 14%, transparent)`}:undefined}>
      {preview?.logo_url?<div style={{display:"flex",justifyContent:"center",marginBottom:14}}><img src={preview.logo_url} alt={displayName||"Workspace"} style={{maxWidth:220,maxHeight:92,objectFit:"contain"}}/></div>:null}
      <span className="eyebrow" style={preview?{color:primary}:undefined}>{invite?"Convite para workspace":"Workspace"}</span>
      <h1 style={preview?{color:primary}:undefined}>{invite?(displayName||"Você recebeu um convite"):"Como você quer começar?"}</h1>
      <p className="muted">{invite?`Você foi convidado para entrar em ${displayName||"este workspace"}. O perfil sugerido é ${ROLE_LABELS[preview?.requested_role]||"Time"}; o Owner revisará e aprovará seu acesso.`:"Crie, entre com código ou solicite acesso."}</p>
      {preview?<div className="notice" style={{borderColor:accent,background:secondary}}><strong style={{color:primary}}>Identidade do workspace</strong><div className="row-sub" style={{marginTop:4}}>Logo, cores e nome são definidos pelo Owner e serão aplicados automaticamente quando seu acesso for aprovado.</div></div>:null}
      <OnboardingV2 initialCode={invite}/>
    </section>
  </main>
}
