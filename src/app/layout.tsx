import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
export const metadata: Metadata={title:{default:"Nexus",template:"%s · Nexus"},description:"Gestão de projetos, programas e portfólios.",applicationName:"Nexus"};
export const viewport: Viewport={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:"#1F5BC4"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><PwaRegister/>{children}</body></html>}
