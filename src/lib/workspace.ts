import { createClient } from "@/lib/supabase/server";

export async function getBootstrap() {
  const s = await createClient();
  const { data } = await s.rpc("rpc_mobile_bootstrap");
  return (data ?? {}) as any;
}

export async function getCurrentWorkspace() {
  const b = await getBootstrap();
  return b?.current_organization ?? null;
}

export async function getMyRole(organizationId: string) {
  const s = await createClient();
  const { data: claims } = await s.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return null;
  const { data } = await s.from("organization_members")
    .select("role,status")
    .eq("organization_id", organizationId)
    .eq("user_id", uid)
    .maybeSingle();
  return data;
}
