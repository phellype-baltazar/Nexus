import Link from "next/link";
import {Layers3,FolderKanban,BriefcaseBusiness,PlusCircle,SlidersHorizontal} from "lucide-react";

const tileStyle={position:"relative" as const};
const subStyle={display:"block",marginTop:5,fontSize:11,lineHeight:1.2,fontWeight:600,color:"var(--muted)",letterSpacing:0};

export default function Page(){
  return <main className="page">
    <span className="eyebrow">Estrutura</span>
    <h1>Portfólio</h1>
    <p className="muted">Direções, programas, projetos e priorização.</p>
    <section className="quick-grid">
      <Link className="quick" href="/app/groups" style={tileStyle}>
        <Layers3/>
        <span>Direções<small style={subStyle}>Gerenciar e criar</small></span>
        <PlusCircle aria-hidden="true" style={{position:"absolute",right:13,top:13,width:18,height:18}}/>
      </Link>
      <Link className="quick" href="/app/create"><PlusCircle/><span>Criar<small style={subStyle}>Programa · Projeto · Ação</small></span></Link>
      <Link className="quick" href="/app/programs"><FolderKanban/><span>Programas<small style={subStyle}>Atuais e histórico</small></span></Link>
      <Link className="quick" href="/app/projects"><BriefcaseBusiness/><span>Projetos<small style={subStyle}>Ativos e concluídos</small></span></Link>
      <Link className="quick" href="/app/portfolio/prioritization"><SlidersHorizontal/><span>Priorização<small style={subStyle}>Comparar e ordenar</small></span></Link>
    </section>
  </main>
}
