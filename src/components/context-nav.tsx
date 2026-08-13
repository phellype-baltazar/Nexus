import Link from "next/link";

export function ContextNav({
  organizationName, group, program, project,
}: {
  organizationName: string;
  group?: { id: string; name: string } | null;
  program?: { id: string; name: string } | null;
  project?: { id: string; name: string } | null;
}) {
  return (
    <div style={{display:"flex",gap:6,alignItems:"center",overflowX:"auto",paddingBottom:8,fontSize:12,fontWeight:800,color:"var(--muted)"}}>
      <Link href="/app/dashboard">{organizationName}</Link>
      {group && <><span>›</span><Link href={`/app/group/${group.id}`}>{group.name}</Link></>}
      {program && <><span>›</span><Link href={`/app/program/${program.id}`}>{program.name}</Link></>}
      {project && <><span>›</span><Link href={`/app/project/${project.id}`}>{project.name}</Link></>}
    </div>
  );
}
