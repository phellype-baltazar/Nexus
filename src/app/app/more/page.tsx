import Link from "next/link";
import {SignOutButton} from "@/components/sign-out-button";

export default function Page(){
  const items=[
    ["/app/executive","Visão Executiva","Exceções e decisões para liderança"],
    ["/app/decision-center","Decisões","Itens que exigem ação"],
    ["/app/search","Buscar","Busca global, favoritos e buscas salvas"],
    ["/app/workspace","Workspace","Convites, acesso e organização"],
    ["/app/people","Pessoas","Membros e aprovações"],
    ["/app/capacity","Capacidade","Workload, capacidade e ausências"],
    ["/app/management","Gestão contextual","KPIs, riscos e financeiro por nível"],
    ["/app/strategy","Estratégia","Objetivos e alinhamento"],
    ["/app/roadmap","Roadmap","Projetos no tempo"],
    ["/app/reports","Relatórios","Snapshots e exportações"],
    ["/app/analytics","Uso do Nexus","Telemetria real e adoção"],
    ["/app/operations","Operações em lote","Fila e recálculos administrativos"],
    ["/app/ai","IA","Análises e recomendações"],
    ["/app/audit","Auditoria","Histórico de alterações"],
    ["/app/settings","Configurações","White-label e módulos"]
  ];
  return <main className="page"><span className="eyebrow">Nexus</span><h1>Mais</h1><section className="card list">{items.map(([href,title,sub])=><Link className="row" href={href} key={href}><div className="row-main"><div className="row-title">{title}</div><div className="row-sub">{sub}</div></div><span className="row-arrow">›</span></Link>)}</section><section className="card"><SignOutButton/></section></main>;
}
