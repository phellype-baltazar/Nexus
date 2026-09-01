"use client";

import {useEffect,useRef} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

export function RoleSync({organizationId,userId,role}:{organizationId:string;userId:string;role:string}){
  const router=useRouter();
  const refreshing=useRef(false);

  useEffect(()=>{
    let active=true;
    const s=createClient();

    async function check(){
      if(!active||refreshing.current||!organizationId||!userId)return;
      const {data}=await s.from("organization_members")
        .select("role,status,updated_at")
        .eq("organization_id",organizationId)
        .eq("user_id",userId)
        .maybeSingle();
      if(!active||!data)return;
      const liveRole=String(data.role||"");
      if(data.status==="active"&&liveRole&&liveRole!==role){
        refreshing.current=true;
        router.refresh();
        setTimeout(()=>{refreshing.current=false},800);
      }
    }

    check();
    const onVisible=()=>{if(document.visibilityState==="visible")check()};
    const onFocus=()=>check();
    document.addEventListener("visibilitychange",onVisible);
    window.addEventListener("focus",onFocus);
    const timer=window.setInterval(check,15000);

    return ()=>{
      active=false;
      document.removeEventListener("visibilitychange",onVisible);
      window.removeEventListener("focus",onFocus);
      window.clearInterval(timer);
    };
  },[organizationId,userId,role,router]);

  return null;
}
