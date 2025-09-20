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

async function generateRoadmapWithRetry(personaJson: any, selectedRole: string, openAIApiKey: string, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Roadmap generation attempt ${attempt}/${maxRetries}`);
    
    try {
      const roadmapPrompt = `You are an expert AI learning advisor creating a comprehensive, personalized roadmap.

USER PERSONA:
${JSON.stringify(personaJson, null, 2)}

SELECTED PATH: ${selectedRole}

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
      "name": "Phase name",
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
        {
          "title": "Resource name",
          "type": "course/tutorial/book/tool/certification",
          "provider": "Platform/author",
          "url": "https://realurl.com",
          "estimatedTime": "X hours",
          "cost": "Free/Paid/Freemium",
          "difficulty": "Beginner/Intermediate/Advanced",
          "whyRecommended": "Why this specific resource fits their learning style and background"
        }
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
- 4-5 phases, each building logically on the previous
- Use REAL courses from Coursera, edX, Udacity, YouTube, etc. with actual URLs
- Include mix of free/paid resources based on budget constraints
- Consider their ${personaJson.hours_per_week} hours/week availability
- Match their timeline of ${personaJson.timeline_months} months
- Factor in constraints: ${personaJson.constraints?.join(', ') || 'none'}

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
          max_tokens: 2500,
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

    // Generate roadmap with retry logic and validation
    const roadmapData = await generateRoadmapWithRetry(personaJson, selectedRole, openAIApiKey);

    console.log('Successfully generated and validated roadmap');

    return new Response(JSON.stringify({ roadmap: roadmapData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-roadmap-generator function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});