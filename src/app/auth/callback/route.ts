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

  const supabase = await createClient();

  // Encerra a sessão atual no servidor
  // antes de iniciar outro provedor.
  await supabase.auth.signOut({
    scope: "local",
  });

  const redirectTo =
    `${url.origin}/auth/callback?expected=${provider}`;

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

        // Obriga Google/Microsoft a mostrar
        // a escolha de conta.
        queryParams: {
          prompt: "select_account",
        },
      },
    });

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL(
        "/login?error=oauth_start",
        url.origin
      )
    );
  }

  return NextResponse.redirect(data.url);
}
