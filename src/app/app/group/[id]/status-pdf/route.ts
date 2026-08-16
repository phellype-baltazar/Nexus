import {createClient} from "@/lib/supabase/server";
import {getCurrentWorkspace} from "@/lib/workspace";
import {generateStatusPdf,type PdfProject,type PdfStatus,type PdfBranding} from "@/lib/status-pdf";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function n(v:unknown){const x=Number(v??0);return Number.isFinite(x)?x:0;}
function isoDate(v:unknown){return v?String(v).slice(0,10):null;}
function isOpen(status:unknown){return !["done","completed","closed","cancelled","canceled","resolved"].includes(String(status||"").toLowerCase());}
function normalizeStatus(value:unknown):PdfStatus{const v=String(value||"").toLowerCase().replace(/[-\s]+/g,"_");if(["off_track","off_tracking","red","critical"].includes(v))return"off_track";if(["attention","at_risk","warning","yellow"].includes(v))return"attention";return"on_track";}
function splitText(value:unknown){return String(value||"").split(/\n|;|•/g).map(x=>x.replace(/^[-–—\s]+/,"").trim()).filter(Boolean);}
function fileSafe(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"").toLowerCase()||"diretoria";}

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  const{id}=await params;const s=await createClient();const w=await getCurrentWorkspace();if(!w)return new Response("Workspace não encontrado.",{status:404});
  const[{data:group},{data:brandRow}]=await Promise.all([
    s.from("groups").select("id,name").eq("id",id).eq("organization_id",w.id).is("deleted_at",null).maybeSingle(),
    s.from("organization_settings").select("display_name,logo_url,primary_color,secondary_color,accent_color").eq("organization_id",w.id).maybeSingle(),
  ]);
  if(!group)return new Response("Diretoria não encontrada ou sem permissão.",{status:404});
  const branding:PdfBranding={displayName:brandRow?.display_name||w.name,logoUrl:brandRow?.logo_url,primaryColor:brandRow?.primary_color,secondaryColor:brandRow?.secondary_color,accentColor:brandRow?.accent_color};

  const{data:programRows}=await s.from("programs").select("id,name,group_id").eq("organization_id",w.id).eq("group_id",id).is("deleted_at",null).is("archived_at",null);const programs=programRows||[],programIds=programs.map((p:any)=>p.id),programMap=new Map(programs.map((p:any)=>[p.id,p.name]));
  if(!programIds.length){const pdf=generateStatusPdf([],branding);return new Response(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="status-${fileSafe(group.name)}.pdf"`,"Cache-Control":"no-store"}});}
  const{data:projectRows}=await s.from("projects").select("id,name,program_id,start_date,due_date,progress,health,status").eq("organization_id",w.id).in("program_id",programIds).is("deleted_at",null).is("archived_at",null).order("name");const projects=projectRows||[],projectIds=projects.map((p:any)=>p.id);
  if(!projectIds.length){const pdf=generateStatusPdf([],branding);return new Response(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="status-${fileSafe(group.name)}.pdf"`,"Cache-Control":"no-store"}});}

  const[{data:activityRows},{data:riskRows},{data:budgetRows},{data:reportRows}]=await Promise.all([
    s.from("activities").select("id,project_id,title,status,progress,due_date,completed_at,primary_owner_id,external_owner_name").eq("organization_id",w.id).in("project_id",projectIds).is("deleted_at",null).order("due_date",{ascending:true}),
    s.from("risks").select("id,project_id,title,score,status").eq("organization_id",w.id).in("project_id",projectIds).is("deleted_at",null).order("score",{ascending:false}),
    s.from("budgets").select("project_id,budget,actual,capex_budget,opex_budget,updated_at").eq("organization_id",w.id).in("project_id",projectIds).order("updated_at",{ascending:false}),
    s.from("status_reports").select("project_id,period_start,period_end,overall_status,accomplishments,next_steps,issues,decisions_needed,created_at").eq("organization_id",w.id).in("project_id",projectIds).is("deleted_at",null).order("period_end",{ascending:false}).order("created_at",{ascending:false}),
  ]);
  const activities=activityRows||[],risks=riskRows||[],budgets=budgetRows||[],reports=reportRows||[];const latestReport=new Map<string,any>();reports.forEach((r:any)=>{if(r.project_id&&!latestReport.has(r.project_id))latestReport.set(r.project_id,r);});const latestBudget=new Map<string,any>();budgets.forEach((b:any)=>{if(b.project_id&&!latestBudget.has(b.project_id))latestBudget.set(b.project_id,b);});const today=new Date().toISOString().slice(0,10);const fallbackStart=new Date();fallbackStart.setUTCDate(fallbackStart.getUTCDate()-30);const fallbackStartIso=fallbackStart.toISOString().slice(0,10);

  const pdfProjects:PdfProject[]=projects.map((p:any)=>{const pa=activities.filter((a:any)=>a.project_id===p.id),pr=risks.filter((r:any)=>r.project_id===p.id&&isOpen(r.status)),report=latestReport.get(p.id),periodStart=isoDate(report?.period_start)||fallbackStartIso,completed=pa.filter((a:any)=>!isOpen(a.status)&&isoDate(a.completed_at)&&String(a.completed_at).slice(0,10)>=periodStart!).map((a:any)=>a.title),ongoing=pa.filter((a:any)=>isOpen(a.status)).slice(0,6).map((a:any)=>`${a.title} (${Math.round(n(a.progress))}%)`),nextFallback=pa.filter((a:any)=>isOpen(a.status)&&(!a.due_date||String(a.due_date).slice(0,10)>=today)).slice(0,5).map((a:any)=>a.title),overdue=pa.filter((a:any)=>isOpen(a.status)&&a.due_date&&String(a.due_date).slice(0,10)<today).slice(0,3).map((a:any)=>`Atrasada: ${a.title}`),riskAttention=pr.filter((r:any)=>n(r.score)>=9).slice(0,4).map((r:any)=>`Risco: ${r.title}`),reportAttention=[...splitText(report?.issues),...splitText(report?.decisions_needed)],volunteerKeys=new Set<string>();pa.forEach((a:any)=>{if(a.primary_owner_id)volunteerKeys.add(`u:${a.primary_owner_id}`);else if(a.external_owner_name)volunteerKeys.add(`e:${String(a.external_owner_name).toLowerCase().trim()}`);});const b=latestBudget.get(p.id),planned=(n(b?.capex_budget)+n(b?.opex_budget))||n(b?.budget),actual=n(b?.actual);return{projectName:p.name,directionName:group.name,programName:String(programMap.get(p.program_id)||"Programa"),workspaceName:branding.displayName||w.name,status:normalizeStatus(report?.overall_status||p.health),startDate:isoDate(p.start_date),dueDate:isoDate(p.due_date),plannedCost:planned,actualCost:actual,volunteers:volunteerKeys.size,progress:n(p.progress),executed:splitText(report?.accomplishments).length?splitText(report?.accomplishments):completed,ongoing,nextSteps:splitText(report?.next_steps).length?splitText(report?.next_steps):nextFallback,attention:[...reportAttention,...riskAttention,...overdue]};});

  const pdf=generateStatusPdf(pdfProjects,branding);return new Response(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="status-${fileSafe(group.name)}.pdf"`,"Cache-Control":"no-store, max-age=0"}});
}
