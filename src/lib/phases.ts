// lib/phases.ts - Single source of truth for phase names
export const PHASES = [
  "Foundations & Core",
  "Specialization Deep-Dive", 
  "Practical Application",
  "Advanced & Research",
] as const;

export type PhaseName = typeof PHASES[number];

export function normalizePhase(name: string): PhaseName {
  const n = (name || "").toLowerCase();
  if (/foundation|core/.test(n)) return "Foundations & Core";
  if (/special|deep/.test(n)) return "Specialization Deep-Dive";
  if (/practical|apply|portfolio|project/.test(n)) return "Practical Application";
  return "Advanced & Research";
}