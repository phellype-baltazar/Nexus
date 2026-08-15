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
  return <div className="shell"><ProductTelemetry organizationId={w?.id||null} userId={userId}/><AppHeader/>{children}<BottomNav/></div>;
}
