import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace,getMyRole} from "@/lib/workspace";
import {StructureBuilder} from "@/components/structure-builder";

export default async function Page(){
  const s=await createClient();
  const w=await getCurrentWorkspace();
  if(!w)return null;

  const role=await getMyRole(w.id);
  const [{data:c},{data:groups},{data:programs}]=await Promise.all([
    s.auth.getClaims(),
    s.from("groups").select("id,name").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name"),
    s.from("programs").select("id,name,group_id").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name")
  ]);
  const uid=String(c?.claims?.sub||"");

  return <main className="page">
    <span className="eyebrow">Criação</span>
    <h1>Criar</h1>
    <p className="muted">As opções disponíveis seguem o seu papel neste workspace.</p>
    <StructureBuilder organizationId={w.id} userId={uid} role={role?.role||"member"} groups={groups||[]} programs={programs||[]}/>
  </main>;
}
