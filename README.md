# Nexus v0.3

Plataforma SaaS mobile-first para gestão contextual de organizações, grupos, programas, projetos e atividades.

## v0.3 — Contextual Portfolio Management
- criação integrada Grupo → Programa → Projeto → Atividades
- páginas contextuais para Grupo, Programa e Projeto
- atividades com início/fim, responsável, prioridade, status e esforço
- KPIs, riscos e financeiro por Empresa, Grupo, Programa ou Projeto
- visão direta ou consolidada abaixo
- roadmap, objetivos estratégicos, capacidade e priorização de portfólio
- status reports e arquivamento preservando histórico
- autenticação Supabase com RLS como camada de autorização

## Segurança
Nunca use `service_role` no frontend. O cliente usa somente URL pública e publishable key.
