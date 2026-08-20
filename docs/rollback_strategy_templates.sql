-- Nexus Strategy / Templates rollback
-- Created for deployment based on backup branch: backup/pre-strategy-templates-2026-08-20
-- IMPORTANT: run only if reverting this deployment.

begin;

-- PMI-SC main workspace was intentionally empty before this deployment.
-- Removing the created groups cascades the seeded programs/projects/activities.
delete from public.groups
where organization_id='eca91165-4875-44b7-83ca-e8ceff206c73';

delete from public.events
where organization_id='eca91165-4875-44b7-83ca-e8ceff206c73';
delete from public.objective_links
where organization_id='eca91165-4875-44b7-83ca-e8ceff206c73';
delete from public.strategic_links
where organization_id='eca91165-4875-44b7-83ca-e8ceff206c73';
delete from public.kpis
where organization_id='eca91165-4875-44b7-83ca-e8ceff206c73';
delete from public.strategic_objectives
where organization_id='eca91165-4875-44b7-83ca-e8ceff206c73';
delete from public.strategic_frameworks
where organization_id='eca91165-4875-44b7-83ca-e8ceff206c73';
delete from public.strategic_plans
where organization_id='eca91165-4875-44b7-83ca-e8ceff206c73';

update public.organization_settings
set labels='{"group":"Grupo","program":"Programa","project":"Projeto","activity":"Atividade"}'::jsonb,
    module_config=coalesce(module_config,'{}'::jsonb)-'workspace_template',
    updated_at=now()
where organization_id='eca91165-4875-44b7-83ca-e8ceff206c73';

-- Engineering: preserve its pre-existing five groups and remove only the strategic layer added here.
delete from public.strategic_links
where organization_id='c2b7d475-ad94-4292-880b-f932aaa9da8a';
delete from public.objective_links
where organization_id='c2b7d475-ad94-4292-880b-f932aaa9da8a';
delete from public.kpis
where organization_id='c2b7d475-ad94-4292-880b-f932aaa9da8a';
delete from public.strategic_objectives
where organization_id='c2b7d475-ad94-4292-880b-f932aaa9da8a';
delete from public.strategic_frameworks
where organization_id='c2b7d475-ad94-4292-880b-f932aaa9da8a';
delete from public.strategic_plans
where organization_id='c2b7d475-ad94-4292-880b-f932aaa9da8a';

update public.organization_settings
set labels='{"group":"Grupo","program":"Programa","project":"Projeto","activity":"Atividade"}'::jsonb,
    module_config=coalesce(module_config,'{}'::jsonb)-'workspace_template',
    updated_at=now()
where organization_id='c2b7d475-ad94-4292-880b-f932aaa9da8a';

commit;

-- Code rollback: redeploy branch backup/pre-strategy-templates-2026-08-20 or commit b9a025320b50257785db5b0594cfacfc48a71aca.
-- The new strategic_* tables may safely remain; the previous app does not depend on them.
