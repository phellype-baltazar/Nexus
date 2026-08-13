import Link from "next/link";
import { getCurrentWorkspace } from "@/lib/workspace";
export async function AppHeader(){
  const w = await getCurrentWorkspace();
  return <header className="topbar">
    <Link href="/app/dashboard" className="brand"><div className="brand-mark">N</div><span>{w?.name || "Nexus"}</span></Link>
    <Link href="/app/workspace" className="chip success">● Online</Link>
  </header>;
}
