import Link from "next/link";
import {Layers3,FolderKanban,BriefcaseBusiness,ListTodo,PlusCircle,Map,Target,SlidersHorizontal} from "lucide-react";

export default function Page(){
  return <main className="page"><span className="eyebrow">Estrutura</span><h1>Portfólio</h1><p className="muted">Estratégia, estrutura, execução e priorização.</p><section className="quick-grid"><Link className="quick" href="/app/create"><PlusCircle/><span>Criar estrutura</span></Link><Link className="quick" href="/app/groups"><Layers3/><span>Grupos</span></Link><Link className="quick" href="/app/programs"><FolderKanban/><span>Programas</span></Link><Link className="quick" href="/app/projects"><BriefcaseBusiness/><span>Projetos</span></Link><Link className="quick" href="/app/activities"><ListTodo/><span>Atividades</span></Link><Link className="quick" href="/app/roadmap"><Map/><span>Roadmap</span></Link><Link className="quick" href="/app/strategy"><Target/><span>Estratégia</span></Link><Link className="quick" href="/app/portfolio/prioritization"><SlidersHorizontal/><span>Priorização</span></Link></section></main>
}
