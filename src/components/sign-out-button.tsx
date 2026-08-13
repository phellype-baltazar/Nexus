"use client";import {createClient} from "@/lib/supabase/client";
export function SignOutButton(){async function out(){await createClient().auth.signOut();location.href="/login"}return <button className="btn btn-outline btn-block" onClick={out}>Sair da conta</button>}
