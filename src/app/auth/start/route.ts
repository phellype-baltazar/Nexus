import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const provider = url.searchParams.get("provider");

  if (
    provider !== "google" &&
    provider !== "azure"
  ) {
    return NextResponse.redirect(
      new URL("/login?error=provider", url.origin)
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://nexus-one-taupe-31.vercel.app";

  /*
   * IMPORTANTE:
   * o início do PKCE e o callback precisam acontecer
   * no mesmo domínio.
   *
   * Se o usuário abriu um alias da Vercel,
   * primeiro levamos para o domínio oficial.
   */
  if (url.origin !== appUrl) {
    return NextResponse.redirect(
      new URL(
        `/auth/start?provider=${provider}`,
        appUrl
      )
    );
  }

  const supabase = await createClient();

  await supabase.auth.signOut({
    scope: "local",
  });

  const redirectTo =
    `${appUrl}/auth/callback`;

  const { data, error } =
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,

        ...(provider === "azure"
          ? {
              scopes: "email",
            }
          : {}),

        queryParams: {
          prompt:
            provider === "azure"
              ? "login"
              : "select_account",
        },
      },
    });

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL(
        "/login?error=oauth_start",
        appUrl
      )
    );
  }

  return NextResponse.redirect(data.url);
}
