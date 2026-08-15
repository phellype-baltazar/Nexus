import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {RecalcQueueControl} from "@/components/recalc-queue-control";

export default async function Page(){
  const s=await createClient();const w=await getCurrentWorkspace();if(!w)return null;
  const {count}=await s.from("recalc_queue").select("id",{count:"exact",head:true}).eq("organization_id",w.id).is("processed_at",null);
  return <main className="page"><span className="eyebrow">Administração</span><h1>Operações em lote</h1><p className="muted">Mudanças massivas podem ser agrupadas e recalculadas uma única vez por projeto, evitando o custo de rollups linha a linha.</p><section className="card"><div className="eyebrow">Projetos pendentes de recálculo</div><strong style={{fontSize:34}}>{count||0}</strong><div style={{marginTop:12}}><RecalcQueueControl organizationId={w.id}/></div></section><section className="card"><h3 style={{marginTop:0}}>Proteção de escala</h3><p className="muted">O backend agora possui modo de atualização em lote e coalescência de recálculos. Operações normais continuam atualizando o projeto imediatamente; cargas massivas podem usar a fila para recalcular cada projeto apenas uma vez.</p></section></main>;
}
