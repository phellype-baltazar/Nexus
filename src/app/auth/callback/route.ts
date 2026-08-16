import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value:string|null){return value&&value.startsWith("/")&&!value.startsWith("//")?value:"/app/dashboard"}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next=safeNext(url.searchParams.get("next"));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexus-one-taupe-31.vercel.app";

  if (!code) return NextResponse.redirect(new URL(`/login?error=missing_code&next=${encodeURIComponent(next)}`, appUrl));

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("OAuth callback error:", error.message);
    return NextResponse.redirect(new URL(`/login?error=oauth_callback&next=${encodeURIComponent(next)}`, appUrl));
  }

  return NextResponse.redirect(new URL(next, appUrl));
}
