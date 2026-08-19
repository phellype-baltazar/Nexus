"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { House, Layers3, Inbox, CalendarDays, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const items = [
  ["/app/dashboard","Início",House],
  ["/app/portfolio","Portfólio",Layers3],
  ["/app/inbox","Inbox",Inbox],
  ["/app/agenda","Agenda",CalendarDays],
  ["/app/more","Mais",Menu],
] as const;

type Props={organizationId?:string|null;initialUnread?:number};

export function BottomNav({organizationId=null,initialUnread=0}:Props){
  const p=usePathname();
  const [unread,setUnread]=useState(Math.max(0,Number(initialUnread||0)));
  const supabase=useMemo(()=>createClient(),[]);

  const refreshUnread=useCallback(async()=>{
    if(!organizationId){setUnread(0);return;}
    const {data}=await supabase.rpc("rpc_inbox",{p_organization_id:organizationId,p_only_unread:true,p_limit:1});
    const n=Number((data as any)?.summary?.unread||0);
    setUnread(Number.isFinite(n)?Math.max(0,n):0);
  },[organizationId,supabase]);

  useEffect(()=>{setUnread(Math.max(0,Number(initialUnread||0)))},[initialUnread,organizationId]);

  useEffect(()=>{
    if(p.startsWith("/app/inbox")) setUnread(0);
    else refreshUnread();
  },[p,refreshUnread]);

  useEffect(()=>{
    if(!organizationId)return;
    const channel=supabase.channel(`inbox-badge-${organizationId}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"notifications",filter:`organization_id=eq.${organizationId}`},()=>{void refreshUnread()})
      .subscribe();
    const timer=window.setInterval(()=>{if(!document.hidden)void refreshUnread()},15000);
    const onVisible=()=>{if(!document.hidden)void refreshUnread()};
    document.addEventListener("visibilitychange",onVisible);
    return ()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",onVisible);void supabase.removeChannel(channel)};
  },[organizationId,refreshUnread,supabase]);

  return <nav className="bottom-nav">
    {items.map(([href,label,Icon])=>{
      const isInbox=href==="/app/inbox";
      const badge=isInbox&&unread>0?(unread>99?"99+":`+${unread}`):null;
      return <Link key={href} href={href} className={`nav-item ${p.startsWith(href)?"active":""}`}>
        <span style={{position:"relative",display:"inline-grid",placeItems:"center"}}>
          <Icon size={20}/>
          {badge&&<span aria-label={`${unread} novas mensagens`} style={{position:"absolute",left:"58%",top:-9,minWidth:18,height:18,padding:"0 4px",borderRadius:999,display:"grid",placeItems:"center",fontSize:9,fontWeight:900,lineHeight:1,color:"white",background:"#dc2626",border:"2px solid white",boxSizing:"border-box",whiteSpace:"nowrap"}}>{badge}</span>}
        </span>
        <span>{label}</span>
      </Link>;
    })}
  </nav>;
}
