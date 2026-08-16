type PdfStatus = "on_track" | "attention" | "off_track";

type PdfProject = {
  projectName: string;
  directionName: string;
  programName: string;
  workspaceName: string;
  status: PdfStatus;
  startDate: string | null;
  dueDate: string | null;
  plannedCost: number;
  actualCost: number;
  volunteers: number;
  progress: number;
  executed: string[];
  ongoing: string[];
  nextSteps: string[];
  attention: string[];
};

const W = 842;
const H = 595;

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/[^\u0000-\u00ff]/g, "");
}

function hex(value: unknown) {
  return Buffer.from(clean(value), "latin1").toString("hex");
}

function n(v: number) { return Number(v.toFixed(2)); }

function text(x: number, y: number, value: unknown, size = 10, bold = false, color = [0.12, 0.14, 0.2]) {
  const [r,g,b] = color;
  return `BT /${bold ? "F2" : "F1"} ${size} Tf ${r} ${g} ${b} rg 1 0 0 1 ${n(x)} ${n(y)} Tm <${hex(value)}> Tj ET\n`;
}

function line(x1:number,y1:number,x2:number,y2:number,width=0.7,color=[0.84,0.82,0.78]) {
  const [r,g,b]=color;
  return `${r} ${g} ${b} RG ${width} w ${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S\n`;
}

function rect(x:number,y:number,w:number,h:number,fill?:number[],stroke?:number[],width=0.7) {
  let out="";
  if(fill){out+=`${fill[0]} ${fill[1]} ${fill[2]} rg `;}
  if(stroke){out+=`${stroke[0]} ${stroke[1]} ${stroke[2]} RG ${width} w `;}
  out+=`${n(x)} ${n(y)} ${n(w)} ${n(h)} re `;
  out+=fill&&stroke?"B\n":fill?"f\n":"S\n";
  return out;
}

function wrap(value: unknown, maxWidth:number, size:number) {
  const words=clean(value).split(/\s+/).filter(Boolean);
  const avg=size*0.52;
  const maxChars=Math.max(8,Math.floor(maxWidth/avg));
  const lines:string[]=[];
  let current="";
  for(const word of words){
    if(!current){current=word;continue;}
    if((current+" "+word).length<=maxChars) current+=" "+word;
    else {lines.push(current);current=word;}
  }
  if(current) lines.push(current);
  return lines;
}

function multiText(x:number,y:number,value:unknown,maxWidth:number,size=10,maxLines=5,bold=false,color=[0.38,0.37,0.4]) {
  const lines=wrap(value,maxWidth,size).slice(0,maxLines);
  let out="";
  lines.forEach((ln,i)=>{let v=ln;if(i===maxLines-1 && wrap(value,maxWidth,size).length>maxLines)v=v.replace(/[.,;:]?$/,"...");out+=text(x,y-i*(size+4),v,size,bold,color);});
  return out;
}

function formatDate(value:string|null){
  if(!value) return "-";
  const [y,m,d]=String(value).slice(0,10).split("-");
  return y&&m&&d?`${d}/${m}/${y}`:"-";
}

function money(value:number){
  return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(Number(value||0));
}

function monthYear(date=new Date()){
  return new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric",timeZone:"America/Lima"}).format(date).toUpperCase();
}

function statusLabel(s:PdfStatus){return s==="off_track"?"OFF TRACKING":s==="attention"?"ATTENTION":"ON TRACKING";}
function statusColor(s:PdfStatus){return s==="off_track"?[0.75,0.08,0.1]:s==="attention"?[0.92,0.48,0.04]:[0.03,0.55,0.33];}

function pill(x:number,y:number,w:number,h:number,label:string,fill:number[]){
  return rect(x,y,w,h,fill)+text(x+10,y+7,label,8.5,true,[1,1,1]);
}

function listBlock(x:number,y:number,w:number,items:string[],maxItems=5){
  let out="";let cursor=y;
  const safe=items.filter(Boolean).slice(0,maxItems);
  if(!safe.length) return multiText(x,cursor,"Sem registros no período.",w,10,2,false,[0.55,0.53,0.55]);
  for(const item of safe){
    out+=rect(x,cursor+3,4,4,[0.36,0.08,0.63]);
    const lines=wrap(item,w-12,9.5).slice(0,3);
    lines.forEach((ln,i)=>{out+=text(x+10,cursor-i*13,ln,9.5,false,[0.36,0.35,0.38]);});
    cursor-=Math.max(24,lines.length*13+8);
    if(cursor<75)break;
  }
  return out;
}

function progressBar(x:number,y:number,w:number,pct:number,color:number[]){
  const p=Math.max(0,Math.min(1,pct));
  return rect(x,y,w,5,[0.9,0.88,0.84])+rect(x,y,w*p,5,color);
}

function buildPage(p:PdfProject,pageNo:number,totalPages:number){
  let c="";
  c+=rect(0,0,W,H,[0.985,0.978,0.955]);
  const purple=[0.37,0.05,0.63],orange=[0.94,0.34,0.02],muted=[0.52,0.5,0.54],ink=[0.14,0.13,0.18];
  c+=text(28,560,p.directionName.toUpperCase(),8,true,[0.46,0.43,0.5]);
  c+=multiText(28,523,p.projectName,420,24,2,false,[0.46,0.43,0.5]);
  c+=text(704,562,`${p.workspaceName} · ${monthYear()}`,7.5,true,[0.48,0.46,0.5]);
  const program=clean(p.programName||"PROGRAMA").toUpperCase();
  c+=pill(445,538,200,22,program.slice(0,36),purple);
  c+=pill(662,538,145,22,statusLabel(p.status),statusColor(p.status));
  c+=line(28,507,814,507,0.8,[0.82,0.79,0.75]);
  c+=line(204,24,204,507,0.8,[0.84,0.82,0.78]);
  c+=line(510,24,510,507,0.8,[0.84,0.82,0.78]);
  c+=line(204,286,814,286,0.8,[0.84,0.82,0.78]);

  // Sidebar
  c+=text(28,474,"INÍCIO",7.5,true,[0.48,0.45,0.5]);
  c+=text(28,454,formatDate(p.startDate),14,true,ink);c+=line(28,444,187,444);
  c+=text(28,417,"TÉRMINO",7.5,true,[0.48,0.45,0.5]);
  c+=text(28,397,formatDate(p.dueDate),14,true,ink);c+=line(28,387,187,387);
  c+=text(28,354,"CUSTO PLANEJADO",7.5,true,[0.48,0.45,0.5]);
  c+=text(28,334,money(p.plannedCost),14,true,ink);c+=line(28,324,187,324);
  c+=text(28,294,"CUSTO REALIZADO",7.5,true,[0.48,0.45,0.5]);
  c+=text(28,274,money(p.actualCost),14,true,ink);c+=line(28,264,187,264);
  c+=text(28,229,String(p.volunteers),15,true,[0.42,0.4,0.43]);
  c+=multiText(84,232,"VOLUNTÁRIOS ENVOLVIDOS",95,7.8,2,true,[0.48,0.45,0.5]);
  const budgetPct=p.plannedCost>0?p.actualCost/p.plannedCost:0;
  const start=p.startDate?new Date(`${p.startDate}T12:00:00Z`).getTime():0,due=p.dueDate?new Date(`${p.dueDate}T12:00:00Z`).getTime():0,now=Date.now();
  const timePct=start&&due>start?(now-start)/(due-start):0;
  c+=text(28,113,"ORÇAMENTO CONSUMIDO",7.5,true,[0.48,0.45,0.5]);
  c+=text(180,113,p.plannedCost>0?`${Math.round(Math.max(0,budgetPct)*100)}%`:"-",8,true,[0.4,0.38,0.42]);
  c+=progressBar(28,99,159,budgetPct,budgetPct>1?[0.75,0.08,0.1]:purple);
  c+=text(28,76,"PRAZO DECORRIDO",7.5,true,[0.48,0.45,0.5]);
  c+=text(180,76,start&&due>start?`${Math.round(Math.max(0,timePct)*100)}%`:"-",8,true,[0.4,0.38,0.42]);
  c+=progressBar(28,62,159,timePct,timePct>1?[0.75,0.08,0.1]:purple);
  c+=text(28,40,`Progresso atual: ${Math.round(p.progress)}%`,8.5,false,muted);

  // Main blocks
  c+=rect(222,476,5,5,purple);c+=text(235,474,"ATIVIDADES EXECUTADAS NO PERÍODO",8,true,purple);c+=text(222,454,"O que foi entregue desde o último follow-up.",9.5,false,muted);
  c+=listBlock(222,428,270,p.executed,5);
  c+=rect(528,476,5,5,purple);c+=text(541,474,"ATIVIDADES EM ANDAMENTO",8,true,purple);c+=text(528,454,"O que está em execução agora.",9.5,false,muted);
  c+=listBlock(528,428,266,p.ongoing,5);
  c+=rect(222,257,5,5,purple);c+=text(235,255,"PRÓXIMOS PASSOS",8,true,purple);c+=text(222,235,"O que será feito até o próximo follow-up.",9.5,false,muted);
  c+=listBlock(222,210,270,p.nextSteps,5);
  c+=rect(528,257,5,5,orange);c+=text(541,255,"PONTOS DE ATENÇÃO",8,true,orange);c+=text(528,235,"Riscos, bloqueios e decisões necessárias.",9.5,false,muted);
  c+=listBlock(528,210,266,p.attention,5);
  c+=text(756,18,`${pageNo}/${totalPages}`,7.5,false,[0.55,0.53,0.55]);
  return c;
}

export function generateStatusPdf(projects:PdfProject[]){
  const safeProjects=projects.length?projects:[{projectName:"Sem projetos",directionName:"Diretoria",programName:"Programa",workspaceName:"Nexus",status:"attention" as PdfStatus,startDate:null,dueDate:null,plannedCost:0,actualCost:0,volunteers:0,progress:0,executed:[],ongoing:[],nextSteps:[],attention:[]}];
  const objects:Buffer[]=[];
  const add=(body:string|Buffer)=>{objects.push(Buffer.isBuffer(body)?body:Buffer.from(body,"latin1"));return objects.length;};
  const catalogId=add("");
  const pagesId=add("");
  const fontRegularId=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const fontBoldId=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const pageIds:number[]=[];
  safeProjects.forEach((p,i)=>{
    const content=Buffer.from(buildPage(p,i+1,safeProjects.length),"latin1");
    const contentId=add(Buffer.concat([Buffer.from(`<< /Length ${content.length} >>\nstream\n`,"latin1"),content,Buffer.from("endstream","latin1")]));
    const pageId=add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  objects[catalogId-1]=Buffer.from(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`,`latin1`);
  objects[pagesId-1]=Buffer.from(`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`,`latin1`);
  const header=Buffer.from("%PDF-1.4\n%âãÏÓ\n","latin1");
  const chunks:Buffer[]=[header];
  const offsets:number[]=[0];
  let cursor=header.length;
  objects.forEach((obj,i)=>{
    const prefix=Buffer.from(`${i+1} 0 obj\n`,`latin1`),suffix=Buffer.from("\nendobj\n","latin1");
    offsets[i+1]=cursor;chunks.push(prefix,obj,suffix);cursor+=prefix.length+obj.length+suffix.length;
  });
  const xrefOffset=cursor;
  let xref=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(let i=1;i<=objects.length;i++)xref+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;
  const trailer=`trailer\n<< /Size ${objects.length+1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(Buffer.from(xref+trailer,"latin1"));
  return Buffer.concat(chunks);
}

export type { PdfProject, PdfStatus };
