import {EntityPage} from "@/components/entity-page";
export default async function Page({params}:{params:Promise<{id:string}>}){const{id}=await params;return <EntityPage type="program" id={id}/>}
