"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Target, Layers3, CalendarDays, Menu } from "lucide-react";

const items = [
  ["/app/dashboard","Início",House],
  ["/app/strategy","Estratégia",Target],
  ["/app/portfolio","Portfólio",Layers3],
  ["/app/agenda","Agenda",CalendarDays],
  ["/app/more","Mais",Menu],
] as const;

type Props={organizationId?:string|null;initialUnread?:number};

export function BottomNav({organizationId:_organizationId=null,initialUnread:_initialUnread=0}:Props){
  const p=usePathname();
  return <nav className="bottom-nav">
    {items.map(([href,label,Icon])=><Link key={href} href={href} className={`nav-item ${p.startsWith(href)?"active":""}`}>
      <Icon size={20}/><span>{label}</span>
    </Link>)}
  </nav>;
}
