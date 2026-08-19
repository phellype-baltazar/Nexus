import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { ProductTelemetry } from "@/components/product-telemetry";

export default async function AppLayout({children}:{children:React.ReactNode}){
  const s=await createClient();
  const {data}=await s.auth.getClaims();
  if(!data?.claims) redirect("/login");
  const userId=String(data.claims.sub||"");
  const w=await getCurrentWorkspace();
  const [{data:branding},{data:inboxData}]=w?await Promise.all([
    s.from("organization_settings").select("display_name,logo_url,primary_color,secondary_color,accent_color").eq("organization_id",w.id).maybeSingle(),
    s.rpc("rpc_inbox",{p_organization_id:w.id,p_only_unread:true,p_limit:1})
  ]):[{data:null as any},{data:null as any}];
  const unread=Number((inboxData as any)?.summary?.unread||0);
  const style={
    "--primary":branding?.primary_color||"#1f5bc4",
    "--secondary":branding?.secondary_color||"#eef3fb",
    "--accent":branding?.accent_color||branding?.primary_color||"#1f5bc4",
  } as React.CSSProperties;
  return <div className="shell" style={style}><ProductTelemetry organizationId={w?.id||null} userId={userId}/><AppHeader branding={branding||undefined}/>{children}<BottomNav organizationId={w?.id||null} initialUnread={unread}/></div>;
}
