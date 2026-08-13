import type { MetadataRoute } from "next";
export default function manifest():MetadataRoute.Manifest{return {name:"Nexus",short_name:"Nexus",description:"Gestão de projetos, programas e portfólios.",start_url:"/",display:"standalone",background_color:"#f5f7fb",theme_color:"#1F5BC4",orientation:"portrait",icons:[{src:"/icon.svg",sizes:"any",type:"image/svg+xml"}]}}
