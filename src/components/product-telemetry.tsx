"use client";

import {useEffect,useRef} from "react";
import {usePathname} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

export function ProductTelemetry({organizationId,userId}:{organizationId:string|null;userId:string}){
  const pathname=usePathname();
  const entered=useRef<number>(Date.now());
  const previous=useRef<string>(pathname);

  useEffect(()=>{
    const s=createClient();
    const now=Date.now();
    const prev=previous.current;
    const duration=Math.max(0,now-entered.current);
    if(prev&&prev!==pathname){
      void s.from("product_events").insert({organization_id:organizationId,user_id:userId,event_name:"page_leave",path:prev,duration_ms:duration,metadata:{next_path:pathname}});
    }
    void s.from("product_events").insert({organization_id:organizationId,user_id:userId,event_name:"page_view",path:pathname,metadata:{source:"web_app"}});
    previous.current=pathname;
    entered.current=now;
  },[pathname,organizationId,userId]);

  return null;
}
