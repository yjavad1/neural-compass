import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { z } from 'https://esm.sh/zod@3.22.4';

// Import core utilities
const PHASES = [
  "Foundations & Core",
  "Specialization Deep-Dive", 
  "Practical Application",
  "Advanced & Research",
] as const;

type PhaseName = typeof PHASES[number];

function normalizePhase(name: string): PhaseName {
  const n = (name || "").toLowerCase();
  if (/foundation|core/.test(n)) return "Foundations & Core";
  if (/special|deep/.test(n)) return "Specialization Deep-Dive";
  if (/practical|apply|portfolio|project/.test(n)) return "Practical Application";
  return "Advanced & Research";
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Updated data contracts for resource ID-based approach
const ProjectSchema = z.object({
  title: z.string(),
  size: z.enum(["S", "M", "L"]),
  brief: z.string(),
});

const PhaseWithIdsSchema = z.object({
  name: z.string(),
  weeks: z.number(),
  skills: z.array(z.string()).min(1),
  projects: z.array(ProjectSchema).min(1),
  resource_ids: z.array(z.string()).min(2),
});

const RoadmapWithIdsSchema = z.object({
  role: z.string(),
  timeline_weeks: z.object({
    low: z.number(),
    mid: z.number(),
    high: z.number(),
  }),
  weekly_hours: z.number(),
  phases: z.array(PhaseWithIdsSchema).min(3).max(4),
});

// Resource selection schemas
const ResourceCandidateSchema = z.object({
  id: z.string(),
  topics: z.array(z.string()),
  level: z.string(),
  cost: z.string(),
});

const ResourceSelectionSchema = z.object({
  resource_ids: z.array(z.string()).min(2),
});

// Final output schemas (for UI)
const ResourceSchema = z.object({
  title: z.string(),
  type: z.string(),
  provider: z.string(),
  url: z.string().url(),
  estimatedTime: z.string(),
  cost: z.string(),
  difficulty: z.string(),
  whyRecommended: z.string(),
});

const FinalPhaseSchema = z.object({
  name: z.string(),
  duration: z.string(),
  objective: z.string(),
  skills: z.array(z.string()),
  projects: z.array(ProjectSchema),
  resources: z.array(ResourceSchema),
});

const RoadmapSchema = z.object({
  role: z.string(),
  difficulty: z.string(),
  timeline: z.string(),
  hiringOutlook: z.string(),
  justification: z.object({
    whyThisPath: z.string(),
    strengths: z.array(z.string()),
    alternativePaths: z.array(z.string()),
    whyNotAlternatives: z.string(),
  }),
  salary: z.object({
    entry: z.string(),
    mid: z.string(),
    senior: z.string(),
  }),
  phases: z.array(FinalPhaseSchema),
  nextSteps: z.array(z.string()),
});

// Get resource candidates for AI selection (minimal data)
async function getCandidatesByPhase(phase: string, userLevel: string, limit: number = 6): Promise<any[]> {
  try {
    console.log(`Getting resource candidates for phase: ${phase}, level: ${userLevel}`);
    
    // Get phase ID first
    const { data: phases, error: phaseError } = await supabase
      .from('learning_phases')
      .select('id')
      .eq('name', phase)
      .single();

    if (phaseError || !phases) {
      console.log('Phase not found, using foundational resources');
      const { data: resources, error } = await supabase
        .from('resources')
        .select('id, type, tags, difficulty_level, cost_type')
        .eq('is_core_foundational', true)
        .order('quality_score', { ascending: false })
        .limit(limit);
      
      return resources?.map(r => ({
        id: r.id,
        topics: r.tags || [],
        level: r.difficulty_level,
        cost: r.cost_type
      })) || [];
    }

    const { data: resources, error } = await supabase
      .from('resources')
      .select(`
        id, type, tags, difficulty_level, cost_type,
        resource_phase_mappings!inner(relevance_score)
      `)
      .eq('resource_phase_mappings.phase_id', phases.id)
      .in('difficulty_level', userLevel === 'beginner' ? ['beginner'] : ['beginner', 'intermediate', 'advanced'])
      .order('quality_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }

    return resources?.map(r => ({
      id: r.id,
      topics: r.tags || [],
      level: r.difficulty_level,
      cost: r.cost_type
    })) || [];
  } catch (error) {
    console.error('Exception in getCandidatesByPhase:', error);
    return [];
  }
}

// Get full resource objects by IDs
async function getResourcesByIds(ids: string[]): Promise<Record<string, any>> {
  try {
    const { data: resources, error } = await supabase
      .from('resources')
      .select('*')
      .in('id', ids);

    if (error) {
      console.error('Error fetching resources by IDs:', error);
      return {};
    }

    const catalog: Record<string, any> = {};
    resources?.forEach(r => {
      catalog[r.id] = r;
    });

    return catalog;
  } catch (error) {
    console.error('Exception in getResourcesByIds:', error);
    return {};
  }
}

// Get curated resources as fallback for phases using normalized names
async function getCuratedFallbackByPhase(userLevel: string): Promise<Record<PhaseName, any[]>> {
  const fallback: Record<PhaseName, any[]> = {} as Record<PhaseName, any[]>;
  
  for (const phase of PHASES) {
    const resources = await getCuratedResources(phase, userLevel, 6);
    fallback[phase] = resources;
  }
  
  return fallback;
}

// Legacy function for existing compatibility
async function getCuratedResources(phase: string, userLevel: string, limit: number = 8) {
  try {
    console.log(`Querying curated resources for phase: ${phase}, level: ${userLevel}`);
    
    const { data: phases, error: phaseError } = await supabase
      .from('learning_phases')
      .select('id')
      .eq('name', phase)
      .single();

    if (phaseError || !phases) {
      console.error('Error fetching phase:', phaseError);
      const { data: resources, error } = await supabase
        .from('resources')
        .select('*')
        .eq('is_core_foundational', true)
        .order('quality_score', { ascending: false })
        .limit(limit);
      
      console.log(`Found ${resources?.length || 0} foundational resources (fallback)`);
      return resources || [];
    }

    const { data: resources, error } = await supabase
      .from('resources')
      .select(`
        *,
        resource_phase_mappings!inner(relevance_score)
      `)
      .eq('resource_phase_mappings.phase_id', phases.id)
      .in('difficulty_level', userLevel === 'beginner' ? ['beginner'] : ['beginner', 'intermediate', 'advanced'])
      .order('quality_score', { ascending: false })
      .order('resource_phase_mappings.relevance_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching curated resources:', error);
      return [];
    }

    console.log(`Found ${resources?.length || 0} curated resources`);
    return resources || [];
  } catch (error) {
    console.error('Exception in getCuratedResources:', error);
    return [];
  }
}

// Enhanced phase matching for better resource filtering
function approxMatchesPhase(resource: any, phase: PhaseName): boolean {
  const t = (resource.tags || []).join(",").toLowerCase();
  if (phase === "Foundations & Core") return /ai-basics|ml-basics|python|prompt|intro|foundation/.test(t);
  if (phase === "Specialization Deep-Dive") return /nlp|vision|transformer|ethics|recsys|deep|neural/.test(t);
  if (phase === "Practical Application") return /project|deployment|portfolio|case|eval|mlops|production/.test(t);
  return /paper|research|advanced|theory|state-of-art/.test(t);
}

// Resource materialization with enhanced fallback and phase matching
function materializeResources(
  roadmap: any,
  catalogById: Record<string, any>,
  curatedFallbackByPhase: Record<PhaseName, any[]>
): any {
  console.log('Materializing resources for roadmap phases...');
  const MIN_PER_PHASE = 3;
  
  const phases = roadmap.phases.map((ph: any) => {
    const name = normalizePhase(ph.name);
    const ids = ph.resource_ids || [];
    const selected = ids.map((id: string) => catalogById[id]).filter(Boolean);

    // Top-up to MIN_PER_PHASE with smart filtering
    if (selected.length < MIN_PER_PHASE) {
      console.log(`Phase ${name} needs ${MIN_PER_PHASE - selected.length} more resources, using fallback`);
      const extras = (curatedFallbackByPhase[name] || [])
        .filter((r: any) => !ids.includes(r.id))
        .filter((r: any) => approxMatchesPhase(r, name))
        .slice(0, MIN_PER_PHASE - selected.length);
      selected.push(...extras);
    }

    const resources = selected.map(convertDbResourceToRoadmapResource);

    return {
      name,
      duration: `${ph.weeks} weeks`,
      objective: `Complete ${name} phase learning objectives`,
      skills: ph.skills,
      projects: ph.projects,
      resources
    };
  });

  return { ...roadmap, phases };
}

// Function to convert database resource to roadmap resource format
function convertDbResourceToRoadmapResource(dbResource: any): any {
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

// Batch resource selector for all phases at once (PERFORMANCE OPTIMIZATION)
async function selectAllResourcesBatch(phases: any[], personaJson: any, openAIApiKey: string, timeout = 8000): Promise<Record<string, string[]>> {
  console.log('🚀 Batching resource selection for all phases...');
  
  const timeoutPromise = new Promise<Record<string, string[]>>((_, reject) =>
    setTimeout(() => reject(new Error('Resource selection timeout')), timeout)
  );
  
  const selectionPromise = async (): Promise<Record<string, string[]>> => {
    try {
      const userLevel = personaJson.coding === 'none' ? 'beginner' : 
                       personaJson.coding === 'advanced' ? 'intermediate' : 'beginner';
      
      // Pre-fetch candidates for all phases in parallel
      const candidatePromises = phases.map(async (phase) => ({
        phase: phase.name,
        candidates: await getCandidatesByPhase(phase.name, userLevel, 4) // Reduced from 8 to 4
      }));
      
      const allCandidates = await Promise.all(candidatePromises);
      
      // Build single batch payload
      const batchPayload = {
        persona: personaJson,
        phases: allCandidates.map(({ phase, candidates }) => ({
          name: phase,
          skills: phases.find(p => p.name === phase)?.skills || [],
          candidates: candidates
        }))
      };
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 800, // Increased for batch response
          temperature: 0.1, // Lower for faster processing
          messages: [
            { 
              role: "system", 
              content: `Return ONLY JSON with this exact format: {"phases": {"Phase Name": ["id1","id2"], "Phase Name 2": ["id3","id4"]}}.
Select 2-3 best resource IDs for each phase based on skills and candidates provided.
Never invent IDs - only use IDs from the candidates array.`
            },
            { role: "user", content: JSON.stringify(batchPayload) }
          ],
        }),
      });

      if (!response.ok) {
        console.warn('Batch selection failed, falling back to individual selection');
        throw new Error('Batch failed');
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content ?? "{}";
      const result = JSON.parse(text);
      
      return result.phases || {};
    } catch (e) {
      console.warn('Batch resource selection failed, using fallback strategy');
      // Fallback: return empty object to trigger curated resources
      return {};
    }
  };
  
  try {
    return await Promise.race([selectionPromise(), timeoutPromise]);
  } catch (e) {
    console.warn('Resource selection timed out or failed, using curated fallback');
    return {};
  }
}

// Legacy single resource selector (kept for backward compatibility)
async function selectResourceIds(payload: any, openAIApiKey: string, attempt = 1): Promise<string[]> {
  // For single calls, use fast timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        max_tokens: 200, // Reduced for faster response
        messages: [
          { 
            role: "system", 
            content: `Return ONLY JSON: {"resource_ids":["id1","id2"]}.
Pick 2 best IDs from CANDIDATES. Never invent IDs.`
          },
          { role: "user", content: JSON.stringify(payload) }
        ],
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('API error');
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content ?? "{}";
    const out = JSON.parse(text);
    return Array.isArray(out.resource_ids) ? out.resource_ids : [];
  } catch (e: any) {
    clearTimeout(timeoutId);
    console.warn('Single resource selection failed, returning empty array');
    return [];
  }
}

// Stage A: Generate roadmap structure using exact phase names
async function generateRoadmapStructure(personaJson: any, selectedRole: string, openAIApiKey: string, maxRetries = 2): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Roadmap structure generation attempt ${attempt}/${maxRetries}`);
    
    try {
      const structurePrompt = `You are an expert AI learning advisor creating a personalized roadmap structure.

USER PERSONA:
${JSON.stringify(personaJson, null, 2)}

SELECTED PATH: ${selectedRole}

Generate a roadmap structure with these EXACT phase names: "Foundations & Core", "Specialization Deep-Dive", "Practical Application", "Advanced & Research".

Return this EXACT JSON format:

{
  "role": "${selectedRole}",
  "timeline_weeks": {
    "low": [number for fast track],
    "mid": [number for typical track], 
    "high": [number for thorough track]
  },
  "weekly_hours": [recommended hours per week based on their availability],
  "phases": [
    {
      "name": "Foundations & Core",
      "weeks": [number of weeks for this phase],
      "skills": ["skill1", "skill2", "skill3", "skill4"],
      "projects": [
        {
          "title": "Project name",
          "size": "S|M|L",
          "brief": "Brief description of what they'll build"
        }
      ],
      "resource_ids": []
    },
    {
      "name": "Specialization Deep-Dive", 
      "weeks": [number of weeks],
      "skills": ["skill1", "skill2", "skill3"],
      "projects": [
        {
          "title": "Project name",
          "size": "S|M|L", 
          "brief": "Brief description"
        }
      ],
      "resource_ids": []
    },
    {
      "name": "Practical Application",
      "weeks": [number of weeks],
      "skills": ["skill1", "skill2", "skill3"],
      "projects": [
        {
          "title": "Project name",
          "size": "S|M|L",
          "brief": "Brief description"
        }
      ],
      "resource_ids": []
    },
    {
      "name": "Advanced & Research",
      "weeks": [number of weeks], 
      "skills": ["skill1", "skill2", "skill3"],
      "projects": [
        {
          "title": "Project name",
          "size": "S|M|L",
          "brief": "Brief description"
        }
      ],
      "resource_ids": []
    }
  ]
}

REQUIREMENTS:
- Consider their ${personaJson.hours_per_week} hours/week availability
- Match their timeline preference of ${personaJson.timeline_months} months
- Adjust difficulty for their coding level: ${personaJson.coding}
- Project sizes: S=1-2 weeks, M=3-4 weeks, L=5+ weeks
- Total weeks should align with their timeline preference

Return ONLY valid JSON, no explanations or markdown.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: structurePrompt }
          ],
          max_tokens: 900,
          temperature: 0.2,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('OpenAI API error:', data);
        throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
      }

      let content = data.choices[0].message.content.trim();
      
      // Clean up markdown wrapping
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) content = jsonMatch[1];
      } else if (content.includes('```')) {
        const jsonMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) content = jsonMatch[1];
      }

      const roadmapData = JSON.parse(content.trim());
      const validatedRoadmap = RoadmapWithIdsSchema.parse(roadmapData);
      console.log(`Structure generation successful on attempt ${attempt}`);
      return validatedRoadmap;
      
    } catch (error) {
      console.error(`Structure attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        // Self-repair attempt
        try {
          console.log('Attempting self-repair...');
          const repairResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { 
                  role: 'system', 
                  content: 'Return ONLY JSON that passes this schema. Do not add extra keys or explanations.' 
                },
                { 
                  role: 'user', 
                  content: JSON.stringify({ 
                    error: error.message, 
                    instruction: 'Fix this JSON to match RoadmapWithIdsSchema format' 
                  }) 
                }
              ],
              max_tokens: 450,
              temperature: 0.1,
            }),
          });
          
          const repairData = await repairResponse.json();
          if (repairData.choices?.[0]?.message?.content) {
            const repairedJson = JSON.parse(repairData.choices[0].message.content.trim());
            return RoadmapWithIdsSchema.parse(repairedJson);
          }
        } catch (repairError) {
          console.error('Self-repair failed:', repairError);
        }
        throw error;
      }
    }
  }
}

// OPTIMIZED: Batch resource attachment for better performance
async function attachResourceIdsToRoadmap(
  roadmapNoResources: any,
  personaJson: any,
  openAIApiKey: string,
  curatedFallbackByPhase: Record<PhaseName, any[]>,
  catalogById: Record<string, any>
): Promise<any> {
  console.log('🚀 Starting OPTIMIZED batch resource attachment...');
  
  // Normalize phase names first
  const phases = roadmapNoResources.phases.map((p: any) => ({ 
    ...p, 
    name: normalizePhase(p.name) 
  }));

  // Try batch selection first (PERFORMANCE OPTIMIZATION)
  const batchResults = await selectAllResourcesBatch(phases, personaJson, openAIApiKey);
  
  // Build RoadmapWithIds structure
  const withIds = {
    ...roadmapNoResources,
    phases: []
  };

  for (const ph of phases) {
    const phaseName = ph.name as PhaseName;
    let ids: string[] = [];
    
    // Use batch results if available
    if (batchResults[phaseName] && batchResults[phaseName].length > 0) {
      ids = batchResults[phaseName];
      console.log(`✨ Used batch result for ${phaseName}: ${ids.length} resources`);
    } else {
      console.log(`🔄 Fallback to curated resources for ${phaseName}`);
      // Direct curated fallback (skip individual AI calls)
      ids = (curatedFallbackByPhase[phaseName] || [])
        .slice(0, 3)
        .map((r: any) => r.id);
    }

    // Ensure minimum resources with curated padding if needed
    if (ids.length < 2) {
      const pad = (curatedFallbackByPhase[phaseName] || [])
        .filter((r: any) => !ids.includes(r.id))
        .slice(0, 2 - ids.length)
        .map((r: any) => r.id);
      ids = [...ids, ...pad];
    }

    console.log(`✅ Phase ${phaseName}: ${ids.length} resources assigned`);
    withIds.phases.push({ ...ph, resource_ids: ids });
  }

  // Quick validation and materialization
  try {
    const parsed = RoadmapWithIdsSchema.parse(withIds);
    return materializeResources(parsed, catalogById, curatedFallbackByPhase);
  } catch (validationError) {
    console.warn('⚠️ Schema validation failed, using fallback materialization');
    return materializeResources(withIds, catalogById, curatedFallbackByPhase);
  }
}

// Stage B: Legacy function - now replaced by attachResourceIdsToRoadmap
async function selectResourcesForPhase(
  phase: any,
  personaJson: any,
  candidates: any[],
  openAIApiKey: string
): Promise<string[]> {
  console.log(`Legacy selectResourcesForPhase called for: ${phase.name}`);
  return selectResourceIds({
    persona: personaJson,
    phase: phase.name,
    skills: phase.skills,
    candidates: candidates,
    example: { resource_ids: candidates.slice(0, 2).map((c: any) => c.id) }
  }, openAIApiKey);
}

// PERFORMANCE OPTIMIZED: Main generation function
async function generateRoadmapWithCuratedResources(personaJson: any, selectedRole: string, openAIApiKey: string): Promise<any> {
  const startTime = Date.now();
  const userLevel = personaJson.coding === 'none' ? 'beginner' : 
                   personaJson.coding === 'advanced' ? 'intermediate' : 'beginner';
  
  console.log('⚡ Starting OPTIMIZED roadmap generation...');
  console.log(`👤 User level: ${userLevel}, Role: ${selectedRole}`);
  
  try {
    // OPTIMIZATION: Parallel execution of initial data fetching
    const [roadmapStructure, catalogSnapshot, curatedFallbackByPhase] = await Promise.all([
      // Stage A: Generate roadmap structure (timeout after 10s)
      Promise.race([
        generateRoadmapStructure(personaJson, selectedRole, openAIApiKey),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Structure generation timeout')), 10000))
      ]),
      // Pre-fetch smaller resource catalog (500 instead of 1000)
      supabase.from('resources').select('*').order('quality_score', { ascending: false }).limit(500),
      // Pre-fetch curated fallbacks
      getCuratedFallbackByPhase(userLevel)
    ]);
    
    console.log(`✅ Structure generated in ${Date.now() - startTime}ms`);
    
    // Build resource catalog efficiently
    const catalogById: Record<string, any> = {};
    catalogSnapshot.data?.forEach((r: any) => {
      catalogById[r.id] = r;
    });
    
    console.log(`📚 Pre-loaded ${Object.keys(catalogById).length} resources`);
    
    // Stage B: OPTIMIZED resource attachment with timeout
    const resourceAttachStart = Date.now();
    const finalRoadmap = await Promise.race([
      attachResourceIdsToRoadmap(
        roadmapStructure,
        personaJson,
        openAIApiKey,
        curatedFallbackByPhase,
        catalogById
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Resource attachment timeout')), 8000))
    ]);
    
    console.log(`✅ Resources attached in ${Date.now() - resourceAttachStart}ms`);
    
    // Quick metadata generation (no additional AI calls)
    const completeRoadmap = {
      ...finalRoadmap,
      difficulty: userLevel.charAt(0).toUpperCase() + userLevel.slice(1),
      timeline: `${finalRoadmap.timeline_weeks?.mid || 12} weeks`,
      hiringOutlook: 'Good',
      justification: {
        whyThisPath: `This ${selectedRole} path matches your ${personaJson.coding} coding background and ${personaJson.timeline_months}-month timeline.`,
        strengths: ['Quick learner', 'Technical aptitude', 'Growth mindset'],
        alternativePaths: ['Data Scientist', 'Software Engineer'],
        whyNotAlternatives: 'Your specific interests and skills make this path optimal.'
      },
      salary: {
        entry: '$70,000 - $90,000',
        mid: '$90,000 - $130,000', 
        senior: '$130,000 - $180,000'
      },
      nextSteps: [
        'Begin with Phase 1 foundation resources',
        'Set up development environment',
        'Join AI/ML communities for support'
      ]
    };
    
    const totalTime = Date.now() - startTime;
    console.log(`🎉 OPTIMIZED generation completed in ${totalTime}ms`);
    
    // Log performance metrics
    completeRoadmap.phases.forEach((p: any) => {
      console.log(`📊 Phase "${p.name}": ${p.resources?.length || 0} resources`);
    });
    
    return completeRoadmap;
    
  } catch (error) {
    console.error(`❌ Generation failed after ${Date.now() - startTime}ms:`, error);
    
    // FAST FALLBACK: Return basic roadmap with curated resources only
    const fallbackRoadmap = await generateFallbackRoadmap(personaJson, selectedRole, userLevel);
    console.log('🔄 Returned fallback roadmap');
    return fallbackRoadmap;
  }
}

// Emergency fallback roadmap generator
async function generateFallbackRoadmap(personaJson: any, selectedRole: string, userLevel: string): Promise<any> {
  console.log('🚨 Generating emergency fallback roadmap...');
  
  const curatedFallbackByPhase = await getCuratedFallbackByPhase(userLevel);
  
  return {
    role: selectedRole,
    difficulty: userLevel.charAt(0).toUpperCase() + userLevel.slice(1),
    timeline: `${personaJson.timeline_months * 4} weeks`,
    hiringOutlook: 'Good',
    justification: {
      whyThisPath: `${selectedRole} is a great fit for your background.`,
      strengths: ['Technical aptitude', 'Learning motivation'],
      alternativePaths: ['Related AI roles'],
      whyNotAlternatives: 'This path suits your goals best.'
    },
    salary: {
      entry: '$70,000 - $90,000',
      mid: '$90,000 - $130,000',
      senior: '$130,000 - $180,000'
    },
    phases: PHASES.map((phaseName, index) => ({
      name: phaseName,
      duration: `${Math.floor(personaJson.timeline_months)} weeks`,
      objective: `Complete ${phaseName} learning`,
      skills: [`${phaseName} Skill 1`, `${phaseName} Skill 2`],
      projects: [{
        title: `${phaseName} Project`,
        size: 'M',
        brief: `Build a project demonstrating ${phaseName} concepts`
      }],
      resources: (curatedFallbackByPhase[phaseName] || [])
        .slice(0, 3)
        .map(convertDbResourceToRoadmapResource)
    })),
    nextSteps: [
      'Start with Phase 1 resources',
      'Set up learning environment', 
      'Track progress weekly'
    ]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { personaJson, selectedRole } = await req.json();

    if (!personaJson || !selectedRole) {
      return new Response(JSON.stringify({ error: 'Missing persona data or selected role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating roadmap for role:', selectedRole);
    console.log('Persona:', personaJson);

    // Generate roadmap with curated resources
    const roadmapData = await generateRoadmapWithCuratedResources(personaJson, selectedRole, openAIApiKey);

    console.log('Successfully generated and validated roadmap with curated resources');

    return new Response(JSON.stringify({ roadmap: roadmapData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-roadmap-generator-v2 function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});