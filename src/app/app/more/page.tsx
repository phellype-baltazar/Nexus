import Link from "next/link";
import {SignOutButton} from "@/components/sign-out-button";

export default function Page(){
  const items=[["/app/workspace","Workspace","Convites, acesso e organização"],["/app/people","Pessoas","Membros e aprovações"],["/app/capacity","Capacidade","Alocação e sobrecarga"],["/app/management","Gestão contextual","KPIs, riscos e financeiro por nível"],["/app/strategy","Estratégia","Objetivos e alinhamento"],["/app/roadmap","Roadmap","Projetos no tempo"],["/app/reports","Relatórios","Snapshots e exportações"],["/app/ai","IA","Análises e recomendações"],["/app/audit","Auditoria","Histórico de alterações"],["/app/settings","Configurações","White-label e módulos"]];
  return <main className="page"><span className="eyebrow">Nexus</span><h1>Mais</h1><section className="card list">{items.map(([href,title,sub])=><Link className="row" href={href} key={href}><div className="row-main"><div className="row-title">{title}</div><div className="row-sub">{sub}</div></div><span className="row-arrow">›</span></Link>)}</section><section className="card"><SignOutButton/></section></main>
}
