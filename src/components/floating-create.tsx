"use client";

import {ReactNode,useState} from "react";

export function FloatingCreate({title,children,disabled=false}:{title:string;children:ReactNode;disabled?:boolean}){
  const [open,setOpen]=useState(false);
  if(disabled)return <>{children}</>;
  return <>
    <button
      type="button"
      aria-label={title}
      title={title}
      onClick={()=>setOpen(true)}
      style={{position:"fixed",right:20,bottom:"calc(86px + env(safe-area-inset-bottom, 0px))",zIndex:70,width:60,height:60,borderRadius:"50%",border:0,background:"var(--primary)",color:"white",fontSize:38,fontWeight:300,lineHeight:1,display:"grid",placeItems:"center",boxShadow:"0 10px 28px rgba(37,99,235,.34)",cursor:"pointer"}}
    >+</button>
    {open&&<div role="dialog" aria-modal="true" aria-label={title} onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(15,23,42,.42)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:620,maxHeight:"92dvh",overflowY:"auto",background:"var(--background, #f8fafc)",borderRadius:"26px 26px 0 0",padding:"10px 16px calc(24px + env(safe-area-inset-bottom, 0px))",boxShadow:"0 -18px 50px rgba(15,23,42,.18)"}}>
        <div style={{width:44,height:5,borderRadius:999,background:"#cbd5e1",margin:"2px auto 14px"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:10}}>
          <h2 style={{margin:0}}>{title}</h2>
          <button type="button" aria-label="Fechar" onClick={()=>setOpen(false)} style={{width:40,height:40,borderRadius:"50%",border:"1px solid var(--line)",background:"white",fontSize:24,lineHeight:1,cursor:"pointer"}}>×</button>
        </div>
        {children}
      </div>
    </div>}
  </>;
}
