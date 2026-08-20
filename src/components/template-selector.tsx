"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WORKSPACE_TEMPLATES, type WorkspaceTemplateKey } from "@/lib/workspace-templates";

type Props = {
  organizationId: string;
  initialTemplate?: string | null;
  initialModuleConfig?: Record<string, unknown> | null;
};

export function TemplateSelector({ organizationId, initialTemplate, initialModuleConfig }: Props) {
  const initial = (initialTemplate && initialTemplate in WORKSPACE_TEMPLATES ? initialTemplate : "company") as WorkspaceTemplateKey;
  const [selected, setSelected] = useState<WorkspaceTemplateKey>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function applyTemplate(key: WorkspaceTemplateKey) {
    setSelected(key);
    setSaving(true);
    setMessage("");
    const supabase = createClient();
    const template = WORKSPACE_TEMPLATES[key];
    const moduleConfig = { ...(initialModuleConfig || {}), workspace_template: key };
    const { error } = await supabase
      .from("organization_settings")
      .update({ labels: template.labels, module_config: moduleConfig, updated_at: new Date().toISOString() })
      .eq("organization_id", organizationId);
    setSaving(false);
    if (error) setMessage(error.message);
    else {
      setMessage(`Template ${template.name} aplicado.`);
      window.setTimeout(() => window.location.reload(), 450);
    }
  }

  return <section className="card">
    <div className="section-title"><h2>Template do workspace</h2></div>
    <p className="muted">O template muda nomenclatura e experiência, mas mantém o mesmo núcleo de estratégia, portfólio, pessoas, calendário e resultados.</p>
    <div className="grid" style={{ gap: 10 }}>
      {(Object.values(WORKSPACE_TEMPLATES)).map(template => {
        const active = selected === template.key;
        return <button
          type="button"
          key={template.key}
          onClick={() => applyTemplate(template.key)}
          disabled={saving}
          className={active ? "btn btn-primary" : "btn"}
          style={{ textAlign: "left", justifyContent: "flex-start", padding: 14, height: "auto" }}
        >
          <span><strong>{template.name}</strong><br/><small>{template.description}</small></span>
        </button>;
      })}
    </div>
    {message && <div className={message.includes("aplicado") ? "success" : "error"} style={{ marginTop: 10 }}>{message}</div>}
  </section>;
}
