type PdfStatus = "on_track" | "attention" | "off_track";

type PdfBranding={displayName?:string|null;logoUrl?:string|null;primaryColor?:string|null;secondaryColor?:string|null;accentColor?:string|null};
type PdfProject = {projectName:string;directionName:string;programName:string;workspaceName:string;status:PdfStatus;startDate:string|null;dueDate:string|null;plannedCost:number;actualCost:number;volunteers:number;progress:number;executed:string[];ongoing:string[];nextSteps:string[];attention:string[]};

type LogoInfo={width:number;height:number};

const W=842,H=595;
function clean(v:unknown){return String(v??"").replace(/[–—]/g,"-").replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/…/g,"...").replace(/•/g,"-").replace(/[^\u0000-\u00ff]/g,"");}
function hex(v:unknown){return Buffer.from(clean(v),"latin1").toString("hex");}
function n(v:number){return Number(v.toFixed(2));}
function text(x:number,y:number,v:unknown,size=10,bold=false,color=[0.08,0.12,0.2]){const[r,g,b]=color;return`BT /${bold?"F2":"F1"} ${size} Tf ${r} ${g} ${b} rg 1 0 0 1 ${n(x)} ${n(y)} Tm <${hex(v)}> Tj ET\n`;}
function line(x1:number,y1:number,x2:number,y2:number,width=.7,color=[.87,.89,.92]){const[r,g,b]=color;return`${r} ${g} ${b} RG ${width} w ${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S\n`;}
function rect(x:number,y:number,w:number,h:number,fill?:number[],stroke?:number[],width=.7){let out="";if(fill)out+=`${fill[0]} ${fill[1]} ${fill[2]} rg `;if(stroke)out+=`${stroke[0]} ${stroke[1]} ${stroke[2]} RG ${width} w `;out+=`${n(x)} ${n(y)} ${n(w)} ${n(h)} re `;out+=fill&&stroke?"B\n":fill?"f\n":"S\n";return out;}
function wrap(v:unknown,maxWidth:number,size:number){const words=clean(v).split(/\s+/).filter(Boolean),maxChars=Math.max(8,Math.floor(maxWidth/(size*.52))),lines:string[]=[];let cur="";for(const word of words){if(!cur){cur=word;continue;}if((cur+" "+word).length<=maxChars)cur+=" "+word;else{lines.push(cur);cur=word;}}if(cur)lines.push(cur);return lines;}
function multiText(x:number,y:number,v:unknown,maxWidth:number,size=10,maxLines=4,bold=false,color=[.32,.36,.43]){const all=wrap(v,maxWidth,size),ls=all.slice(0,maxLines);let out="";ls.forEach((ln,i)=>{let t=ln;if(i===maxLines-1&&all.length>maxLines)t=t.replace(/[.,;:]?$/,"...");out+=text(x,y-i*(size+4),t,size,bold,color);});return out;}
function formatDate(v:string|null){if(!v)return"-";const[y,m,d]=String(v).slice(0,10).split("-");return y&&m&&d?`${d}/${m}/${y}`:"-";}
function money(v:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(Number(v||0));}
function monthYear(){return new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric",timeZone:"America/Sao_Paulo"}).format(new Date()).toUpperCase();}
function rgb(hexColor:string|undefined|null,fallback:number[]){const h=String(hexColor||"").replace("#","");if(!/^[0-9a-fA-F]{6}$/.test(h))return fallback;return[parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255];}
function statusLabel(s:PdfStatus){return s==="off_track"?"OFF TRACKING":s==="attention"?"ATENÇÃO":"ON TRACKING";}
function statusColor(s:PdfStatus){return s==="off_track"?[.78,.12,.18]:s==="attention"?[.91,.55,.08]:[.06,.55,.35];}
function pill(x:number,y:number,w:number,h:number,label:string,fill:number[]){return rect(x,y,w,h,fill)+text(x+10,y+7,label,8.2,true,[1,1,1]);}
function progressBar(x:number,y:number,w:number,pct:number,color:number[]){const p=Math.max(0,Math.min(1,pct));return rect(x,y,w,5,[.92,.94,.97])+rect(x,y,w*p,5,color);}
function listBlock(x:number,y:number,w:number,items:string[],bullet:number[],maxItems=5){let out="",cursor=y;const safe=items.filter(Boolean).slice(0,maxItems);if(!safe.length)return multiText(x,cursor,"Sem registros no período.",w,9,2,false,[.52,.56,.63]);for(const item of safe){out+=rect(x,cursor+3,4,4,bullet);const ls=wrap(item,w-14,9).slice(0,3);ls.forEach((ln,i)=>out+=text(x+11,cursor-i*12.5,ln,9,false,[.28,.32,.39]));cursor-=Math.max(23,ls.length*12.5+7);if(cursor<75)break;}return out;}

function jpegSize(buf:Buffer):LogoInfo|null{
  if(buf.length<4||buf[0]!==0xff||buf[1]!==0xd8)return null;
  let i=2;
  while(i+9<buf.length){
    if(buf[i]!==0xff){i++;continue;}
    const marker=buf[i+1];i+=2;
    if(marker===0xd8||marker===0xd9)continue;
    if(i+2>buf.length)break;
    const len=buf.readUInt16BE(i);
    if(len<2||i+len>buf.length)break;
    if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
      const height=buf.readUInt16BE(i+3),width=buf.readUInt16BE(i+5);
      return width&&height?{width,height}:null;
    }
    i+=len;
  }
  return null;
}

function logoDraw(info:LogoInfo){
  const maxW=150,maxH=42,scale=Math.min(maxW/info.width,maxH/info.height),w=info.width*scale,h=info.height*scale,x=28,y=538+(42-h)/2;
  return`q ${n(w)} 0 0 ${n(h)} ${n(x)} ${n(y)} cm /Logo Do Q\n`;
}

function buildPage(p:PdfProject,pageNo:number,totalPages:number,branding:PdfBranding,logo?:LogoInfo|null){
  let c="";const primary=rgb(branding.primaryColor,[.12,.36,.77]),secondary=rgb(branding.secondaryColor,[.93,.96,.99]),accent=rgb(branding.accentColor,primary),ink=[.07,.11,.18],muted=[.42,.46,.53],danger=[.78,.12,.18];
  c+=rect(0,0,W,H,[.985,.99,1]);c+=rect(0,H-8,W,8,primary);
  if(logo){c+=logoDraw(logo);c+=text(190,566,(branding.displayName||p.workspaceName).toUpperCase(),8,true,muted);c+=text(190,548,p.directionName,10,true,ink);}else{c+=rect(28,538,42,42,primary);c+=text(43,551,(branding.displayName||p.workspaceName||"N").trim().charAt(0).toUpperCase(),18,true,[1,1,1]);c+=text(82,566,(branding.displayName||p.workspaceName).toUpperCase(),8,true,muted);c+=text(82,548,p.directionName,10,true,ink);}
  c+=text(677,566,monthYear(),7.5,true,muted);
  c+=multiText(28,506,p.projectName,500,23,2,true,ink);
  c+=pill(565,498,130,23,clean(p.programName).toUpperCase().slice(0,22),primary);
  c+=pill(704,498,110,23,statusLabel(p.status),statusColor(p.status));
  c+=line(28,475,814,475,1,[.86,.89,.93]);
  c+=rect(28,48,178,410,[1,1,1],[.88,.9,.94],.8);
  const side=(label:string,value:string,y:number)=>{c+=text(44,y,label,7.5,true,muted);c+=text(44,y-20,value,13,true,ink);c+=line(44,y-31,190,y-31,.6,[.9,.91,.94]);};
  side("INÍCIO",formatDate(p.startDate),435);side("TÉRMINO",formatDate(p.dueDate),374);side("CUSTO PLANEJADO",money(p.plannedCost),313);side("CUSTO REALIZADO",money(p.actualCost),252);
  c+=text(44,188,"PESSOAS ENVOLVIDAS",7.5,true,muted);c+=text(44,165,String(p.volunteers),20,true,ink);
  const budgetPct=p.plannedCost>0?p.actualCost/p.plannedCost:0,start=p.startDate?new Date(`${p.startDate}T12:00:00Z`).getTime():0,due=p.dueDate?new Date(`${p.dueDate}T12:00:00Z`).getTime():0,now=Date.now(),timePct=start&&due>start?(now-start)/(due-start):0;
  c+=text(44,126,"ORÇAMENTO CONSUMIDO",7.2,true,muted);c+=text(178,126,p.plannedCost>0?`${Math.round(Math.max(0,budgetPct)*100)}%`:"-",7.5,true,ink);c+=progressBar(44,113,146,budgetPct,budgetPct>1?danger:primary);
  c+=text(44,88,"PRAZO DECORRIDO",7.2,true,muted);c+=text(178,88,start&&due>start?`${Math.round(Math.max(0,timePct)*100)}%`:"-",7.5,true,ink);c+=progressBar(44,75,146,timePct,timePct>1?danger:accent);c+=text(44,57,`Progresso: ${Math.round(p.progress)}%`,8.5,true,ink);
  const card=(x:number,y:number,w:number,h:number,title:string,subtitle:string,items:string[],color:number[])=>{c+=rect(x,y,w,h,[1,1,1],[.88,.9,.94],.8);c+=rect(x+16,y+h-25,5,5,color);c+=text(x+29,y+h-27,title,8,true,color);c+=text(x+16,y+h-48,subtitle,8.7,false,muted);c+=listBlock(x+16,y+h-74,w-32,items,color,5);};
  card(222,273,286,185,"ATIVIDADES EXECUTADAS","Entregas desde o último follow-up.",p.executed,primary);
  card(520,273,294,185,"ATIVIDADES EM ANDAMENTO","O que está em execução agora.",p.ongoing,primary);
  card(222,48,286,213,"PRÓXIMOS PASSOS","O que será feito até o próximo follow-up.",p.nextSteps,accent);
  card(520,48,294,213,"PONTOS DE ATENÇÃO","Riscos, bloqueios e decisões necessárias.",p.attention,[.94,.36,.04]);
  c+=text(768,25,`${pageNo}/${totalPages}`,7.5,false,muted);return c;
}

export function generateStatusPdf(projects:PdfProject[],branding:PdfBranding={},logoJpeg?:Buffer|null){
  const safe=projects.length?projects:[{projectName:"Sem projetos",directionName:"Diretoria",programName:"Programa",workspaceName:branding.displayName||"Nexus",status:"attention" as PdfStatus,startDate:null,dueDate:null,plannedCost:0,actualCost:0,volunteers:0,progress:0,executed:[],ongoing:[],nextSteps:[],attention:[]}];
  const objects:Buffer[]=[],add=(body:string|Buffer)=>{objects.push(Buffer.isBuffer(body)?body:Buffer.from(body,"latin1"));return objects.length;},catalogId=add(""),pagesId=add(""),fontRegularId=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),fontBoldId=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const logoInfo=logoJpeg?jpegSize(logoJpeg):null;
  const logoImageId=logoInfo&&logoJpeg?add(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${logoInfo.width} /Height ${logoInfo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoJpeg.length} >>\nstream\n`,`latin1`),logoJpeg,Buffer.from("\nendstream","latin1")])):null;
  const pageIds:number[]=[];
  safe.forEach((p,i)=>{const content=Buffer.from(buildPage(p,i+1,safe.length,branding,logoInfo),"latin1"),contentId=add(Buffer.concat([Buffer.from(`<< /Length ${content.length} >>\nstream\n`,`latin1`),content,Buffer.from("endstream","latin1")])),xobj=logoImageId?` /XObject << /Logo ${logoImageId} 0 R >>`:"",pageId=add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >>${xobj} >> /Contents ${contentId} 0 R >>`);pageIds.push(pageId);});
  objects[catalogId-1]=Buffer.from(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`,`latin1`);objects[pagesId-1]=Buffer.from(`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`,`latin1`);
  const header=Buffer.from("%PDF-1.4\n%âãÏÓ\n","latin1"),chunks:Buffer[]=[header],offsets:number[]=[0];let cursor=header.length;objects.forEach((obj,i)=>{const prefix=Buffer.from(`${i+1} 0 obj\n`,`latin1`),suffix=Buffer.from("\nendobj\n","latin1");offsets[i+1]=cursor;chunks.push(prefix,obj,suffix);cursor+=prefix.length+obj.length+suffix.length;});const xrefOffset=cursor;let xref=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<=objects.length;i++)xref+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;chunks.push(Buffer.from(xref+`trailer\n<< /Size ${objects.length+1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,`latin1`));return Buffer.concat(chunks);
}

export type{PdfProject,PdfStatus,PdfBranding};
