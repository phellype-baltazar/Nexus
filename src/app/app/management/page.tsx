import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {ContextManagement} from "@/components/context-management";
export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const [{data:g},{data:p},{data:pr},{data:r},{data:k},{data:b}]=await Promise.all([
    s.from("groups").select("id,name").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name"),
    s.from("programs").select("id,name,group_id").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name"),
    s.from("projects").select("id,name,program_id").eq("organization_id",w.id).is("deleted_at",null).is("archived_at",null).order("name"),
    s.from("risks").select("*").eq("organization_id",w.id).is("deleted_at",null),
    s.from("kpis").select("*").eq("organization_id",w.id).is("deleted_at",null),
    s.from("budgets").select("*").eq("organization_id",w.id)
  ]);
  return <main className="page"><span className="eyebrow">Gestão contextual</span><h1>Indicadores, riscos e finanças</h1><p className="muted">Escolha Empresa, Grupo, Programa ou Projeto e veja apenas os dados daquele contexto.</p><ContextManagement organizationId={w.id} organizationName={w.name} groups={g||[]} programs={p||[]} projects={pr||[]} risks={r||[]} kpis={k||[]} budgets={b||[]}/></main>
}
