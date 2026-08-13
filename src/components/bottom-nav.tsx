"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Layers3, Inbox, CalendarDays, Menu } from "lucide-react";
const items = [
  ["/app/dashboard","Início",House],
  ["/app/portfolio","Portfólio",Layers3],
  ["/app/inbox","Inbox",Inbox],
  ["/app/agenda","Agenda",CalendarDays],
  ["/app/more","Mais",Menu],
] as const;
export function BottomNav(){
  const p=usePathname();
  return <nav className="bottom-nav">
    {items.map(([href,label,Icon])=><Link key={href} href={href} className={`nav-item ${p.startsWith(href)?"active":""}`}><Icon size={20}/><span>{label}</span></Link>)}
  </nav>;
}
