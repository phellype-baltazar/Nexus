export function SummaryCards({items}:{items:{label:string;value:string|number}[]}){
  return <section style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginTop:14,width:"100%",maxWidth:"100%",overflow:"hidden"}}>
    {items.map((item)=><div className="card" key={item.label} style={{height:122,minWidth:0,maxWidth:"100%",marginTop:0,padding:20,display:"grid",gridTemplateRows:"38px 1fr",alignContent:"start",boxSizing:"border-box"}}>
      <div className="eyebrow" style={{margin:0,lineHeight:1.22,alignSelf:"start",minWidth:0}}>{item.label}</div>
      <div style={{margin:0,alignSelf:"start",fontSize:typeof item.value==="string"&&item.value.length>12?24:31,lineHeight:1,fontWeight:900,minWidth:0,overflowWrap:"anywhere"}}>{item.value}</div>
    </div>)}
  </section>;
}
