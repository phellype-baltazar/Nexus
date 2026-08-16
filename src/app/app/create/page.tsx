import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {StructureBuilder} from "@/components/structure-builder";

export default async function Page(){
  const s=await createClient();
  const w=await getCurrentWorkspace();
  if(!w)return null;

  const [{data:c},{data:groups}]=await Promise.all([
    s.auth.getClaims(),
    s.from("groups").select("id,name").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name")
  ]);
  const uid=String(c?.claims?.sub||"");

  return <main className="page">
    <span className="eyebrow">Criação</span>
    <h1>Criar</h1>
    <p className="muted">Selecione uma direção existente e crie programa, projeto e ações vinculados a ela.</p>
    <StructureBuilder organizationId={w.id} userId={uid} groups={groups||[]}/>
  </main>;
}
