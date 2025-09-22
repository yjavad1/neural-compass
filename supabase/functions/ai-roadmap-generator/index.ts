import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { z } from 'https://esm.sh/zod@3.22.4';

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

// Get curated resources as fallback for phases
async function getCuratedFallbackByPhase(userLevel: string): Promise<Record<string, any[]>> {
  const phases = ['Foundations & Core', 'Specialization Deep-Dive', 'Practical Application', 'Advanced & Research'];
  const fallback: Record<string, any[]> = {};
  
  for (const phase of phases) {
    const resources = await getCuratedResources(phase, userLevel, 4);
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

// Resource materialization with fallback
function materializeResources(
  roadmap: any,
  catalogById: Record<string, any>,
  curatedFallbackByPhase: Record<string, any[]>
): any {
  console.log('Materializing resources for roadmap phases...');
  
  const phases = roadmap.phases.map((ph: any) => {
    const selected = (ph.resource_ids || [])
      .map((id: string) => catalogById[id])
      .filter(Boolean)
      .map(convertDbResourceToRoadmapResource);

    const need = Math.max(0, 2 - selected.length);
    if (need > 0) {
      console.log(`Phase ${ph.name} needs ${need} more resources, using fallback`);
      const extras = (curatedFallbackByPhase[ph.name] || [])
        .filter((r: any) => !ph.resource_ids?.includes(r.id))
        .slice(0, need)
        .map(convertDbResourceToRoadmapResource);
      selected.push(...extras);
    }

    // Convert to final UI format
    return {
      name: ph.name,
      duration: `${ph.weeks} weeks`,
      objective: `Complete ${ph.name} phase learning objectives`,
      skills: ph.skills,
      projects: ph.projects,
      resources: selected
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

// Stage A: Generate roadmap structure (no resources)
async function generateRoadmapStructure(personaJson: any, selectedRole: string, openAIApiKey: string, maxRetries = 2): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Roadmap structure generation attempt ${attempt}/${maxRetries}`);
    
    try {
      const structurePrompt = `You are an expert AI learning advisor creating a personalized roadmap structure.

USER PERSONA:
${JSON.stringify(personaJson, null, 2)}

SELECTED PATH: ${selectedRole}

Generate a roadmap structure with this EXACT JSON format:

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

// Stage B: Select resource IDs for each phase
async function selectResourcesForPhase(
  phase: any,
  personaJson: any,
  candidates: any[],
  openAIApiKey: string
): Promise<string[]> {
  try {
    console.log(`Selecting resources for phase: ${phase.name} from ${candidates.length} candidates`);
    
    const selectionPrompt = `You must return ONLY JSON that selects resource IDs from CANDIDATES.
For this PHASE, choose 2-4 resource_ids that best match the persona and phase skills.
Never invent IDs. If uncertain, pick the closest 2.
Output:
{ "resource_ids": ["id1","id2", "..."] }`;

    const userPrompt = JSON.stringify({
      persona: personaJson,
      phase: phase.name,
      skills: phase.skills,
      candidates: candidates,
      example: { resource_ids: candidates.slice(0, 2).map(c => c.id) }
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: selectionPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 450,
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Resource selection API error:', data);
      // Fallback to first 2 candidates
      return candidates.slice(0, 2).map(c => c.id);
    }

    const content = data.choices[0].message.content.trim();
    const selection = JSON.parse(content);
    const validatedSelection = ResourceSelectionSchema.parse(selection);
    
    console.log(`Selected ${validatedSelection.resource_ids.length} resources for ${phase.name}`);
    return validatedSelection.resource_ids;
    
  } catch (error) {
    console.error(`Resource selection failed for ${phase.name}:`, error);
    // Fallback to first 2 candidates
    return candidates.slice(0, 2).map(c => c.id);
  }
}

// Main generation function with two-stage approach
async function generateRoadmapWithCuratedResources(personaJson: any, selectedRole: string, openAIApiKey: string): Promise<any> {
  const userLevel = personaJson.coding === 'none' ? 'beginner' : 
                   personaJson.coding === 'basic' ? 'intermediate' : 'advanced';
  
  console.log('Starting two-stage roadmap generation...');
  
  // Stage A: Generate roadmap structure
  const roadmapStructure = await generateRoadmapStructure(personaJson, selectedRole, openAIApiKey);
  console.log('Generated roadmap structure:', roadmapStructure);
  
  // Stage B: Select resources for each phase
  const phases = [];
  const allSelectedIds = [];
  
  for (const phase of roadmapStructure.phases) {
    const candidates = await getCandidatesByPhase(phase.name, userLevel, 6);
    const selectedIds = await selectResourcesForPhase(phase, personaJson, candidates, openAIApiKey);
    
    phases.push({
      ...phase,
      resource_ids: selectedIds
    });
    
    allSelectedIds.push(...selectedIds);
  }
  
  const roadmapWithIds = { ...roadmapStructure, phases };
  
  // Get all resource objects and fallback resources
  const [catalogById, curatedFallbackByPhase] = await Promise.all([
    getResourcesByIds(allSelectedIds),
    getCuratedFallbackByPhase(userLevel)
  ]);
  
  // Materialize resources with fallback
  const finalRoadmap = materializeResources(roadmapWithIds, catalogById, curatedFallbackByPhase);
  
  // Add missing fields for backward compatibility
  const completeRoadmap = {
    ...finalRoadmap,
    difficulty: userLevel === 'beginner' ? 'Beginner' : userLevel === 'intermediate' ? 'Intermediate' : 'Advanced',
    timeline: `${finalRoadmap.timeline_weeks.mid} weeks`,
    hiringOutlook: 'Good',
    justification: {
      whyThisPath: `This ${selectedRole} path aligns perfectly with your background and goals.`,
      strengths: ['Quick learner', 'Technical aptitude', 'Growth mindset'],
      alternativePaths: ['Data Scientist', 'Software Engineer'],
      whyNotAlternatives: 'Your specific interests and skills make this path the best fit.'
    },
    salary: {
      entry: '$70,000 - $90,000',
      mid: '$90,000 - $130,000',
      senior: '$130,000 - $180,000'
    },
    nextSteps: [
      'Start with the first resource in Phase 1',
      'Set up a development environment',
      'Join relevant AI communities and forums'
    ]
  };
  
  console.log('Two-stage generation completed successfully');
  return completeRoadmap;
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