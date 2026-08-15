export const pct = (v: unknown) => `${Math.round(Number(v || 0))}%`;
export const dateBR = (v: unknown) => v ? new Date(String(v)).toLocaleDateString("pt-BR") : "—";
export const money = (v: unknown, c = "BRL") => new Intl.NumberFormat("pt-BR",{style:"currency",currency:c,maximumFractionDigits:0}).format(Number(v||0));
export const healthLabel = (v: unknown) => v === "on_track" ? "On track" : v === "attention" ? "Attention" : v === "off_track" ? "Off tracking" : "—";
