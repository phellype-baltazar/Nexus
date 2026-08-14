import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const expected = url.searchParams.get("expected");

  let next =
    url.searchParams.get("next") ||
    "/app/dashboard";

  if (!next.startsWith("/")) {
    next = "/app/dashboard";
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=oauth", url.origin)
    );
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=oauth", url.origin)
    );
  }

  const { data: userData } =
    await supabase.auth.getUser();

  const actualProvider =
    userData.user?.app_metadata?.provider;

  // Impede que um fluxo iniciado como Google
  // termine usando silenciosamente uma sessão Microsoft,
  // ou vice-versa.
  if (
    expected &&
    actualProvider &&
    actualProvider !== expected
  ) {
    await supabase.auth.signOut({
      scope: "local",
    });

    return NextResponse.redirect(
      new URL(
        `/login?error=provider_mismatch&expected=${expected}`,
        url.origin
      )
    );
  }

  return NextResponse.redirect(
    new URL(next, url.origin)
  );
}
