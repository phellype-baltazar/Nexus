"use client";
import Link from "next/link";import {usePathname} from "next/navigation";import {House,Inbox,CalendarDays,Menu} from "lucide-react";
const items=[{href:"/app/dashboard",label:"Início",Icon:House},{href:"/app/inbox",label:"Inbox",Icon:Inbox},{href:"/app/agenda",label:"Agenda",Icon:CalendarDays},{href:"/app/more",label:"Mais",Icon:Menu}] as const;
export function BottomNav(){const path=usePathname();return <nav className="bottom-nav" aria-label="Navegação principal">{items.map(({href,label,Icon})=>{const active=path.startsWith(href);return <Link key={href} href={href} className={`nav-item ${active?"active":""}`}><Icon size={20} strokeWidth={active?2.5:2}/><span>{label}</span></Link>})}</nav>}
