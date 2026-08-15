function valueStyle(value:string|number){
  const text=String(value??"—");
  const isDate=/^\d{2}\/\d{2}\/\d{4}$/.test(text);
  const isMoney=/^R\$/.test(text);
  const len=text.length;

  let fontSize=30;
  if(isDate) fontSize=22;
  else if(isMoney&&len>12) fontSize=20;
  else if(len>24) fontSize=16;
  else if(len>18) fontSize=18;
  else if(len>12) fontSize=20;
  else if(len>9) fontSize=23;

  return {
    width:"100%",
    maxWidth:"100%",
    margin:0,
    fontSize,
    lineHeight:1.12,
    fontWeight:900,
    textAlign:"center" as const,
    alignSelf:"center",
    justifySelf:"center",
    overflowWrap:"break-word" as const,
    wordBreak:"normal" as const,
    whiteSpace:isDate?"nowrap" as const:"normal" as const,
    hyphens:"auto" as const,
  };
}

export function SummaryCards({items}:{items:{label:string;value:string|number}[]}){
  return <section style={{
    display:"grid",
    gridTemplateColumns:"repeat(2,minmax(0,1fr))",
    gap:12,
    marginTop:14,
    width:"100%",
    maxWidth:"100%",
    overflow:"hidden",
  }}>
    {items.map((item)=><div
      className="card"
      key={item.label}
      style={{
        minHeight:122,
        height:122,
        minWidth:0,
        maxWidth:"100%",
        marginTop:0,
        padding:"16px 14px",
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        justifyContent:"center",
        gap:10,
        boxSizing:"border-box",
        overflow:"hidden",
        textAlign:"center",
      }}
    >
      <div className="eyebrow" style={{
        width:"100%",
        maxWidth:"100%",
        margin:0,
        lineHeight:1.15,
        textAlign:"center",
        overflowWrap:"break-word",
      }}>
        {item.label}
      </div>
      <div style={valueStyle(item.value)}>{item.value}</div>
    </div>)}
  </section>;
}
