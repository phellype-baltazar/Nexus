import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {StructureBuilder} from "@/components/structure-builder";

export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const {data:c}=await s.auth.getClaims();const uid=String(c?.claims?.sub||"");
  return <main className="page"><span className="eyebrow">Criação integrada</span><h1>Criar estrutura</h1><p className="muted">Monte Direção, Programa, Projeto e atividades em uma única sequência.</p><StructureBuilder organizationId={w.id} userId={uid}/></main>;
}
