import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {SearchExperience} from "@/components/search-experience";

export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;const {data}=await s.auth.getClaims();const userId=String(data?.claims?.sub||"");
  return <main className="page"><span className="eyebrow">Nexus</span><h1>Buscar</h1><p className="muted">Encontre qualquer direção, programa, projeto ou atividade. Salve buscas e favoritos para voltar rápido.</p><SearchExperience organizationId={w.id} userId={userId}/></main>;
}
