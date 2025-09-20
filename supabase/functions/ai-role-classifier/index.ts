import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { personaJson } = await req.json();

    if (!personaJson) {
      return new Response(JSON.stringify({ error: 'Missing persona data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Role classification request for persona:', personaJson);

    const rolePrompt = `You are an expert AI career advisor analyzing a user's profile to suggest the best AI career paths.

USER PERSONA:
${JSON.stringify(personaJson, null, 2)}

Based on their background, coding experience, math skills, interests, goals, time constraints, and timeline, suggest 2-3 ranked AI roles that would be the best fit.

Return EXACTLY this JSON structure:
{
  "recommendations": [
    {
      "role": "Specific AI role title",
      "fitScore": 95,
      "reasoning": "2-3 sentences explaining why this role matches their profile perfectly",
      "timeToEntry": "3-6 months",
      "difficulty": "Beginner/Intermediate/Advanced"
    },
    {
      "role": "Second best role",
      "fitScore": 85,
      "reasoning": "Why this is second choice",
      "timeToEntry": "6-9 months", 
      "difficulty": "Intermediate"
    },
    {
      "role": "Third option role",
      "fitScore": 75,
      "reasoning": "Why this could work as backup",
      "timeToEntry": "9-12 months",
      "difficulty": "Advanced"
    }
  ]
}

REQUIREMENTS:
- Consider their coding level (${personaJson.coding}) and math skills (${personaJson.math})
- Match their interests: ${personaJson.interests?.join(', ') || 'general AI'}
- Factor in their goal: ${personaJson.goal}
- Consider time availability: ${personaJson.hours_per_week} hours/week
- Respect constraints: ${personaJson.constraints?.join(', ') || 'none'}
- Timeline expectation: ${personaJson.timeline_months} months

Choose realistic roles that match their skill level and interests. Focus on actionable career paths, not generic titles.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: rolePrompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    let roleRecommendations;
    try {
      roleRecommendations = JSON.parse(data.choices[0].message.content);
      console.log('Role classification result:', roleRecommendations);
    } catch (parseError) {
      console.error('Failed to parse role recommendations:', data.choices[0].message.content);
      throw new Error('Invalid JSON response from AI');
    }

    return new Response(JSON.stringify(roleRecommendations), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-role-classifier function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});