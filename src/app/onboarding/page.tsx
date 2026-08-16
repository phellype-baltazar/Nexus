import {redirect} from "next/navigation";
import {OnboardingV2} from "@/components/onboarding-v2";
import {createClient} from "@/lib/supabase/server";

export default async function Page({searchParams}:{searchParams:Promise<{invite?:string}>}){
  const {invite=""}=await searchParams;
  if(invite){
    const s=await createClient();
    const {data:claims}=await s.auth.getClaims();
    const userId=String(claims?.claims?.sub||"");
    if(!userId) redirect(`/login?next=${encodeURIComponent(`/onboarding?invite=${invite}`)}`);
  }
  return <main className="login-wrap"><section className="card login-card"><span className="eyebrow">Workspace</span><h1>{invite?"Você recebeu um convite":"Como você quer começar?"}</h1><p className="muted">{invite?"Entre no workspace compartilhado sem precisar procurá-lo.":"Crie, entre com código ou solicite acesso."}</p><OnboardingV2 initialCode={invite}/></section></main>
}
