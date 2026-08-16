import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {BrandingEditor} from "@/components/branding-editor";

export default async function Page(){
  const s=await createClient();
  const w=await getCurrentWorkspace();
  if(!w)return null;
  const{data}=await s.from("organization_settings").select("*").eq("organization_id",w.id).maybeSingle();
  return <main className="page">
    <span className="eyebrow">Administração</span><h1>Configurações</h1>
    <BrandingEditor organizationId={w.id} initial={{display_name:data?.display_name||w.name,logo_url:data?.logo_url,primary_color:data?.primary_color,secondary_color:data?.secondary_color,accent_color:data?.accent_color}}/>
    <section className="card list" style={{marginTop:12}}>
      <div className="row"><div className="row-main"><div className="row-title">Idioma / fuso</div><div className="row-sub">{data?.language||"pt-BR"} · {data?.timezone||"America/Sao_Paulo"}</div></div></div>
      <div className="row"><div className="row-main"><div className="row-title">Nomenclatura</div><div className="row-sub">{JSON.stringify(data?.labels||{})}</div></div></div>
    </section>
  </main>;
}
