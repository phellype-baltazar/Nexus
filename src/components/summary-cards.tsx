function valueStyle(value:string|number){
  const text=String(value??"—").trim();
  const isDate=/^\d{2}\/\d{2}\/\d{4}$/.test(text);
  const isMoney=/^R\$/.test(text);
  const isPercent=/^\d+(?:[.,]\d+)?%$/.test(text);
  const isShortNumber=/^\d+(?:[.,]\d+)?$/.test(text);
  const len=text.length;

  let fontSize="30px";
  let whiteSpace:"nowrap"|"normal"="normal";
  let maxLines=2;

  if(isDate){fontSize="17px";whiteSpace="nowrap";maxLines=1;}
  else if(isMoney){fontSize=len>13?"18px":"21px";whiteSpace="nowrap";maxLines=1;}
  else if(isPercent || isShortNumber){fontSize="30px";whiteSpace="nowrap";maxLines=1;}
  else if(len>22)fontSize="15px";
  else if(len>16)fontSize="17px";
  else if(len>11)fontSize="19px";
  else fontSize="24px";

  return {width:"100%",maxWidth:"100%",margin:0,padding:0,fontSize,lineHeight:1.12,fontWeight:900,textAlign:"center" as const,alignSelf:"center",justifySelf:"center",whiteSpace,overflow:"hidden",textOverflow:maxLines===1?"ellipsis":"clip",overflowWrap:"normal" as const,wordBreak:"normal" as const,display:maxLines===2?"-webkit-box":"block",WebkitLineClamp:maxLines===2?2:undefined,WebkitBoxOrient:maxLines===2?"vertical" as const:undefined};
}

function statusTone(value:string|number){
  const v=String(value||"").toLowerCase().trim();
  if(["off tracking","off_track","fora do rumo"].includes(v))return {background:"#fff1f2",border:"1px solid #fecdd3",color:"#b91c1c"};
  if(["attention","atenção"].includes(v))return {background:"#fff7ed",border:"1px solid #fed7aa",color:"#c2410c"};
  if(["on track","on_track","no rumo"].includes(v))return {background:"#ecfdf5",border:"1px solid #a7f3d0",color:"#047857"};
  return null;
}

export function SummaryCards({items}:{items:{label:string;value:string|number}[]}){
  return <section style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginTop:14,width:"100%",maxWidth:"100%",minWidth:0,overflow:"hidden"}}>
    {items.map((item)=>{const tone=statusTone(item.value);return <div className="card" key={item.label} style={{minHeight:116,height:116,minWidth:0,width:"100%",maxWidth:"100%",marginTop:0,padding:"14px 12px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,boxSizing:"border-box",overflow:"hidden",textAlign:"center",...(tone||{})}}>
      <div className="eyebrow" style={{width:"100%",maxWidth:"100%",margin:0,padding:0,fontSize:12,lineHeight:1.15,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"normal",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",color:tone?.color}}>{item.label}</div>
      <div style={{...valueStyle(item.value),color:tone?.color}} title={String(item.value)}>{item.value}</div>
    </div>})}
  </section>;
}
