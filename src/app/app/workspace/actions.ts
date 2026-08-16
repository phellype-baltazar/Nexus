"use server";

import {createClient} from "@/lib/supabase/server";

export async function deleteWorkspaceAction(organizationId:string,confirmName:string){
  const s=await createClient();
  const{data:claims}=await s.auth.getClaims();
  const userId=String(claims?.claims?.sub||"");
  if(!userId)return{ok:false,error:"Sua sessão expirou. Entre novamente."};

  const{data,error}=await s.rpc("rpc_delete_workspace",{
    p_organization_id:organizationId,
    p_confirm_name:confirmName,
  });

  if(error)return{ok:false,error:error.message};
  if(data!==true)return{ok:false,error:"O workspace não foi excluído."};
  return{ok:true};
}
