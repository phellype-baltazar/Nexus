import Link from "next/link";
import { getCurrentWorkspace } from "@/lib/workspace";

export async function AppHeader({branding}:{branding?:{display_name?:string|null;logo_url?:string|null}}){
  const w = await getCurrentWorkspace();
  const name=branding?.display_name||w?.name||"Nexus";
  return <header className="topbar">
    <Link href="/app/dashboard" className="brand">
      {branding?.logo_url?
        <div className="brand-logo-wrap" style={{width:68,height:54,padding:2,overflow:"visible",borderRadius:8,background:"transparent"}}>
          <img
            src={branding.logo_url}
            alt={name}
            style={{display:"block",width:"100%",height:"100%",objectFit:"contain",objectPosition:"center"}}
          />
        </div>
        :<div className="brand-mark">{name.trim().charAt(0).toUpperCase()||"N"}</div>}
      <span>{name}</span>
    </Link>
    <Link href="/app/workspace" className="chip success">● Online</Link>
  </header>;
}
