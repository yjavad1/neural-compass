import type { RoadmapWithIds } from "./schemas";
import { normalizePhase, PHASES, type PhaseName } from "./phases";

const MIN_PER_PHASE = 3;

export function approxMatchesPhase(resource: any, phase: PhaseName): boolean {
  const t = (resource.tags || []).join(",").toLowerCase();
  if (phase === "Foundations & Core") return /ai-basics|ml-basics|python|prompt|intro|foundation/.test(t);
  if (phase === "Specialization Deep-Dive") return /nlp|vision|transformer|ethics|recsys|deep|neural/.test(t);
  if (phase === "Practical Application") return /project|deployment|portfolio|case|eval|mlops|production/.test(t);
  return /paper|research|advanced|theory|state-of-art/.test(t);
}

export function convertDbResourceToRoadmapResource(dbResource: any): any {
  return {
    title: dbResource.title,
    type: dbResource.type,
    provider: dbResource.provider,
    url: dbResource.url,
    estimatedTime: dbResource.duration_hours ? `${dbResource.duration_hours} hours` : 'Self-paced',
    cost: dbResource.cost_type === 'free' ? 'Free' : 
          dbResource.cost_type === 'paid' ? 'Paid' :
          dbResource.cost_type === 'freemium' ? 'Freemium' : 'Subscription',
    difficulty: dbResource.difficulty_level.charAt(0).toUpperCase() + dbResource.difficulty_level.slice(1),
    whyRecommended: dbResource.description || `High-quality ${dbResource.type} from ${dbResource.provider}`
  };
}

export function materializeResources(
  roadmap: RoadmapWithIds,
  catalogById: Record<string, any>,
  curatedFallbackByPhase: Record<PhaseName, any[]>
) {
  console.log('Materializing resources for roadmap phases...');
  
  const phases = roadmap.phases.map(ph0 => {
    const name = normalizePhase(ph0.name);
    const ids = ph0.resource_ids || [];
    const selected = ids.map(id => catalogById[id]).filter(Boolean);

    // Top-up to MIN_PER_PHASE
    if (selected.length < MIN_PER_PHASE) {
      console.log(`Phase ${name} needs ${MIN_PER_PHASE - selected.length} more resources, using fallback`);
      const extras = (curatedFallbackByPhase[name] || [])
        .filter(r => !ids.includes(r.id))
        .filter(r => approxMatchesPhase(r, name))
        .slice(0, MIN_PER_PHASE - selected.length);
      selected.push(...extras);
    }

    const resources = selected.map(convertDbResourceToRoadmapResource);

    return {
      name,
      duration: `${ph0.weeks} weeks`,
      objective: `Complete ${name} phase learning objectives`,
      skills: ph0.skills,
      projects: ph0.projects,
      resources
    };
  });

  // Return UI-ready roadmap (drop resource_ids)
  return { ...roadmap, phases };
}