import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value:string|null){return value&&value.startsWith("/")&&!value.startsWith("//")?value:"/app/dashboard"}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  const next=safeNext(url.searchParams.get("next"));

  if (provider !== "google" && provider !== "azure") return NextResponse.redirect(new URL(`/login?error=provider&next=${encodeURIComponent(next)}`, url.origin));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexus-one-taupe-31.vercel.app";
  if (url.origin !== appUrl) return NextResponse.redirect(new URL(`/auth/start?provider=${provider}&next=${encodeURIComponent(next)}`, appUrl));

  const supabase = await createClient();
  await supabase.auth.signOut({scope: "local"});

  const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      ...(provider === "azure" ? {scopes: "email"} : {}),
      queryParams: {prompt: provider === "azure" ? "login" : "select_account"},
    },
  });

  if (error || !data.url) return NextResponse.redirect(new URL(`/login?error=oauth_start&next=${encodeURIComponent(next)}`, appUrl));
  return NextResponse.redirect(data.url);
}
