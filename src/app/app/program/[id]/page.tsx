import { EntityDetail } from "@/components/entity-detail";
export default async function Page({params}:{params:Promise<{id:string}>}){const{id}=await params;return <EntityDetail type="program" id={id}/>}
