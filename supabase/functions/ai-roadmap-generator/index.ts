import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, profileData } = await req.json();

    if (!sessionId || !profileData) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Advanced roadmap generation prompt
    const roadmapPrompt = `You are an expert AI career advisor creating a comprehensive, personalized learning roadmap. Generate a detailed JSON roadmap based on the user's profile.

USER PROFILE:
${JSON.stringify(profileData, null, 2)}

Generate a roadmap with this EXACT JSON structure:

{
  "role": "Target AI role title",
  "difficulty": "Beginner/Intermediate/Advanced",
  "timeline": "X months",
  "hiringOutlook": "Market outlook description",
  "description": "Personalized description of the career path",
  "phases": [
    {
      "name": "Phase name",
      "duration": "X weeks/months",
      "description": "What they'll accomplish",
      "skills": ["skill1", "skill2", "skill3"],
      "projects": [
        {
          "title": "Project name",
          "description": "What they'll build",
          "skills": ["skills practiced"]
        }
      ],
      "resources": [
        {
          "title": "Resource name",
          "type": "course/tutorial/book/tool/certification",
          "provider": "Platform/author name",
          "url": "https://example.com",
          "estimatedTime": "X hours",
          "description": "Why this resource"
        }
      ]
    }
  ],
  "nextSteps": [
    "Immediate action 1",
    "Immediate action 2",
    "Immediate action 3"
  ]
}

REQUIREMENTS:
- Create 4-6 phases based on their timeline and goals
- Include current, real courses and resources (use your knowledge of popular platforms)
- Make timeline realistic based on their available time per week
- Include hands-on projects for portfolio building
- Consider their current experience level and technical background
- Provide specific, actionable next steps
- Include diverse resource types (courses, books, tools, certifications)
- Make it highly personalized to their interests and goals

Focus on creating a practical, achievable roadmap that leads to their career goals.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: roadmapPrompt }
        ],
        max_completion_tokens: 2000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const roadmapData = JSON.parse(data.choices[0].message.content);

    // Update session with generated roadmap
    await supabase
      .from('conversation_sessions')
      .update({ 
        session_data: roadmapData,
        roadmap_generated: true 
      })
      .eq('id', sessionId);

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