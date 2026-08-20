export type WorkspaceTemplateKey = "company" | "ngo" | "pmi_chapter";

export type WorkspaceTemplate = {
  key: WorkspaceTemplateKey;
  name: string;
  description: string;
  labels: { group: string; program: string; project: string; activity: string };
  strategyLabel: string;
  frameworkLabel: string;
};

export const WORKSPACE_TEMPLATES: Record<WorkspaceTemplateKey, WorkspaceTemplate> = {
  company: {
    key: "company",
    name: "Empresa",
    description: "Gestão estratégica e execução para empresas, áreas e times.",
    labels: { group: "Área", program: "Programa", project: "Projeto", activity: "Ação" },
    strategyLabel: "Plano Estratégico",
    frameworkLabel: "Referenciais",
  },
  ngo: {
    key: "ngo",
    name: "ONG",
    description: "Gestão de impacto, programas, projetos e resultados para organizações sociais.",
    labels: { group: "Frente", program: "Programa", project: "Projeto", activity: "Atividade" },
    strategyLabel: "Plano Estratégico",
    frameworkLabel: "Referenciais de Impacto",
  },
  pmi_chapter: {
    key: "pmi_chapter",
    name: "PMI · Chapter",
    description: "Planejamento e execução para capítulos PMI, sem alterar o núcleo genérico do Nexus.",
    labels: { group: "Diretoria", program: "Programa", project: "Projeto", activity: "Atividade" },
    strategyLabel: "Plano Estratégico / Annual Plan",
    frameworkLabel: "Referenciais PMI",
  },
};

export function getWorkspaceTemplate(value?: string | null) {
  if (value && value in WORKSPACE_TEMPLATES) return WORKSPACE_TEMPLATES[value as WorkspaceTemplateKey];
  return WORKSPACE_TEMPLATES.company;
}
