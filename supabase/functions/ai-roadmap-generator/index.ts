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

// Zod schema for roadmap validation
const ProjectSchema = z.object({
  title: z.string(),
  description: z.string(),
  keySkills: z.array(z.string()),
  portfolioValue: z.string(),
});

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

const PhaseSchema = z.object({
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
  phases: z.array(PhaseSchema),
  nextSteps: z.array(z.string()),
});

// Function to get curated resources from database
async function getCuratedResources(phase: string, userLevel: string, limit: number = 8) {
  try {
    console.log(`Querying curated resources for phase: ${phase}, level: ${userLevel}`);
    
    // Get phase ID first
    const { data: phases, error: phaseError } = await supabase
      .from('learning_phases')
      .select('id')
      .eq('name', phase)
      .single();

    if (phaseError || !phases) {
      console.error('Error fetching phase:', phaseError);
      // Fall back to getting foundational resources if phase not found
      const { data: resources, error } = await supabase
        .from('resources')
        .select('*')
        .eq('is_core_foundational', true)
        .order('quality_score', { ascending: false })
        .limit(limit);
      
      console.log(`Found ${resources?.length || 0} foundational resources (fallback)`);
      return resources || [];
    }

    // Query resources through the mapping table - remove core foundational filter for non-foundation phases
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

// Function to get curated resources for all phases
async function getAllPhaseCuratedResources(userLevel: string) {
  const phases = ['Foundations & Core', 'Specialization Deep-Dive', 'Practical Application', 'Advanced & Research'];
  const allResources = {};
  
  for (const phase of phases) {
    const resources = await getCuratedResources(phase, userLevel, 6);
    allResources[phase] = resources.map(convertDbResourceToRoadmapResource);
  }
  
  return allResources;
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

async function generateRoadmapWithCuratedResources(personaJson: any, selectedRole: string, openAIApiKey: string, maxRetries = 3): Promise<any> {
  // Get curated resources for all phases
  const userLevel = personaJson.coding === 'none' ? 'beginner' : 
                   personaJson.coding === 'basic' ? 'intermediate' : 'advanced';
  
  const allPhaseResources = await getAllPhaseCuratedResources(userLevel);
  
  console.log(`Using curated resources for all phases:`, Object.keys(allPhaseResources).map(phase => 
    `${phase}: ${allPhaseResources[phase].length} resources`
  ).join(', '));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Roadmap generation attempt ${attempt}/${maxRetries}`);
    
    try {
      const roadmapPrompt = `You are an expert AI learning advisor creating a comprehensive, personalized roadmap.

USER PERSONA:
${JSON.stringify(personaJson, null, 2)}

SELECTED PATH: ${selectedRole}

CURATED RESOURCES FOR ALL PHASES (use these resources only):
${JSON.stringify(allPhaseResources, null, 2)}

CRITICAL: Analyze the selected path to determine the roadmap type:
- If path contains "Learning Path", "Explorer", "Track" → Create EDUCATIONAL roadmap (knowledge-focused)
- If path contains "Engineer", "Scientist", "Developer" → Create CAREER roadmap (job-focused)
- If path contains "for [Profession]", "Tools", "Automation" → Create SKILL ENHANCEMENT roadmap
- If path contains "in [Industry]" → Create INDUSTRY APPLICATION roadmap

Generate a roadmap with this EXACT JSON structure (must be valid JSON):

{
  "role": "${selectedRole}",
  "difficulty": "Beginner/Intermediate/Advanced", 
  "timeline": "X months",
  "hiringOutlook": "Strong/Good/Competitive",
  "justification": {
    "whyThisPath": "2-3 sentences explaining why this career path is perfect for them based on their background, interests, and goals",
    "strengths": ["strength 1 they have", "strength 2 they have", "strength 3 they have"],
    "alternativePaths": ["Alternative role 1", "Alternative role 2"],
    "whyNotAlternatives": "Brief explanation of why the chosen path is better than alternatives for this specific person"
  },
  "salary": {
    "entry": "$XX,000 - $XX,000",
    "mid": "$XX,000 - $XX,000", 
    "senior": "$XX,000 - $XX,000"
  },
  "phases": [
    {
      "name": "Foundations & Core",
      "duration": "X weeks",
      "objective": "What they'll achieve in this phase",
      "skills": ["skill1", "skill2", "skill3", "skill4"],
      "projects": [
        {
          "title": "Project name",
          "description": "What they'll build and why it's important",
          "keySkills": ["skills this project teaches"],
          "portfolioValue": "Why this project will impress employers"
        }
      ],
      "resources": [
        CRITICAL: Use ONLY the curated "Foundations & Core" resources provided above.
        Each resource MUST be a JSON object with this EXACT format:
        {
          "title": "string",
          "type": "string", 
          "provider": "string",
          "url": "string",
          "estimatedTime": "string",
          "cost": "string",
          "difficulty": "string",
          "whyRecommended": "string"
        }
        DO NOT return resources as strings. Return as objects only.
        Select 5-8 most relevant resources from the curated "Foundations & Core" list.
      ]
    },
    {
      "name": "Specialization Deep-Dive",
      "duration": "X weeks", 
      "objective": "Advanced concepts in chosen AI domain",
      "skills": ["skill1", "skill2", "skill3"],
      "projects": [PROJECT FOR THIS PHASE],
      "resources": [
        CRITICAL: Use ONLY the curated "Specialization Deep-Dive" resources provided above.
        If no curated resources exist for this phase, use the "Foundations & Core" resources.
        Each resource MUST be a JSON object with this EXACT format:
        {
          "title": "Course/Resource Name",
          "type": "course|tutorial|book|tool",
          "provider": "Provider Name", 
          "url": "verified URL from curated list",
          "estimatedTime": "X hours|weeks",
          "cost": "Free|Paid|Freemium",
          "difficulty": "Beginner|Intermediate|Advanced",
          "whyRecommended": "Brief explanation"
        }
        Select 3-5 most relevant resources from the curated lists only.
      ]
    },
    {
      "name": "Practical Application",
      "duration": "X weeks",
      "objective": "Hands-on projects and real-world implementation", 
      "skills": ["skill1", "skill2", "skill3"],
      "projects": [PROJECT FOR THIS PHASE],
      "resources": [
        CRITICAL: Use ONLY the curated "Practical Application" resources provided above.
        If no curated resources exist for this phase, use the "Foundations & Core" resources.
        Each resource MUST be a JSON object with this EXACT format:
        {
          "title": "Course/Resource Name",
          "type": "course|tutorial|book|tool", 
          "provider": "Provider Name",
          "url": "verified URL from curated list",
          "estimatedTime": "X hours|weeks",
          "cost": "Free|Paid|Freemium",
          "difficulty": "Beginner|Intermediate|Advanced",
          "whyRecommended": "Brief explanation"
        }
        Select 3-5 most relevant resources from the curated lists only.
      ]
    },
    {
      "name": "Advanced & Research", 
      "duration": "X weeks",
      "objective": "Cutting-edge topics and research-oriented learning",
      "skills": ["skill1", "skill2", "skill3"],
      "projects": [PROJECT FOR THIS PHASE],
      "resources": [
        CRITICAL: Use ONLY the curated "Advanced & Research" resources provided above.
        If no curated resources exist for this phase, use the "Foundations & Core" resources.
        Each resource MUST be a JSON object with this EXACT format:
        {
          "title": "Course/Resource Name",
          "type": "course|tutorial|book|tool",
          "provider": "Provider Name", 
          "url": "verified URL from curated list",
          "estimatedTime": "X hours|weeks",
          "cost": "Free|Paid|Freemium",
          "difficulty": "Beginner|Intermediate|Advanced",
          "whyRecommended": "Brief explanation"
        }
        Select 3-5 most relevant resources from the curated lists only.
      ]
    }
  ],
  "nextSteps": [
    "Immediate action 1 (this week)",
    "Setup action 2 (this month)",
    "Long-term goal 3 (first 3 months)"
  ]
}

REQUIREMENTS:
- Build roadmap specifically for ${selectedRole}
- Consider their coding level (${personaJson.coding}) and math skills (${personaJson.math})
- CRITICAL: ONLY use the provided curated resources for ALL phases - DO NOT generate new URLs
- Use resources from the curated lists above - never create new URLs or resources
- If a phase has no curated resources, use resources from "Foundations & Core" phase
- Include mix of free/paid resources based on budget constraints
- Consider their ${personaJson.hours_per_week} hours/week availability
- Match their timeline of ${personaJson.timeline_months} months
- Factor in constraints: ${personaJson.constraints?.join(', ') || 'none'}
- NEVER GENERATE FAKE URLs - only use the URLs provided in the curated resource lists

ROADMAP FOCUS GUIDELINES:
- **EDUCATIONAL roadmaps**: Focus on understanding concepts, theory, and broad knowledge. Projects are exploratory. Salary info can be "Knowledge-focused path" or focus on potential applications.
- **CAREER roadmaps**: Focus on job-ready skills, portfolio building, and employment. Include realistic salary ranges and hiring advice.
- **SKILL ENHANCEMENT roadmaps**: Focus on practical tools and applications within their current role. Projects enhance their existing work.
- **INDUSTRY APPLICATION roadmaps**: Focus on AI applications specific to their industry. Projects solve real industry problems.

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
            { role: 'system', content: roadmapPrompt }
          ],
          max_tokens: 3000,
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('OpenAI API error:', data);
        throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
      }

      let content = data.choices[0].message.content.trim();
      console.log(`Attempt ${attempt} - Raw AI response:`, content);

      // Handle markdown-wrapped JSON
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          content = jsonMatch[1];
        }
      } else if (content.includes('```')) {
        const jsonMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          content = jsonMatch[1];
        }
      }

      // Parse JSON
      let roadmapData;
      try {
        roadmapData = JSON.parse(content.trim());
      } catch (parseError) {
        console.error(`Attempt ${attempt} - JSON parse failed:`, parseError);
        if (attempt === maxRetries) {
          throw new Error('Failed to get valid JSON after all retries');
        }
        continue;
      }

      // Validate with Zod
      try {
        const validatedRoadmap = RoadmapSchema.parse(roadmapData);
        console.log(`Attempt ${attempt} - Validation successful`);
        return validatedRoadmap;
      } catch (validationError) {
        console.error(`Attempt ${attempt} - Validation failed:`, validationError);
        if (attempt === maxRetries) {
          throw new Error('Failed to get valid roadmap schema after all retries');
        }
        continue;
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
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