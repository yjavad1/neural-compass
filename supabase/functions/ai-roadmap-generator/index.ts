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

    // Enhanced roadmap generation with career justification
    const roadmapPrompt = `You are an expert AI career advisor creating a comprehensive, personalized learning roadmap with detailed career path justification.

USER PROFILE:
${JSON.stringify(profileData, null, 2)}

Generate a roadmap with this EXACT JSON structure:

{
  "role": "Specific AI role title",
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
- Choose role based on their specific interests, background, and constraints
- Create detailed justification showing deep understanding of their profile
- Include realistic salary expectations 
- 4-5 phases, each building logically on the previous
- Use REAL courses from Coursera, edX, Udacity, YouTube, etc. with actual URLs when possible
- Include mix of free and paid resources based on their budget indication
- Projects should build a cohesive portfolio
- Consider their time availability for realistic timelines
- Make resources match their technical comfort level
- Include specific tools they'll master (Python, TensorFlow, etc.)

Create a roadmap that feels uniquely crafted for this specific person.`;

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