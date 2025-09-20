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

    const rolePrompt = `You are an expert AI learning advisor analyzing a user's profile to suggest the best AI learning paths and opportunities.

USER PERSONA:
${JSON.stringify(personaJson, null, 2)}

CRITICAL ANALYSIS: First, determine their PRIMARY INTENT from their goal and background:

1. **KNOWLEDGE SEEKER**: Goal is "knowledge" or "learning" - they want to understand AI concepts, not necessarily change careers
2. **CAREER CHANGER**: Goal is "career" or "job" - they want to transition into an AI career
3. **SKILL ENHANCER**: Goal is to add AI skills to their current profession
4. **INDUSTRY APPLIER**: They want to apply AI within their current industry/job

Based on their background, coding experience, math skills, interests, goals, time constraints, and timeline, suggest 2-3 ranked AI paths that match their TRUE INTENT.

Return EXACTLY this JSON structure:
{
  "recommendations": [
    {
      "role": "Specific path title (Learning Path/Career Path/Skill Enhancement/Industry Application)",
      "fitScore": 95,
      "reasoning": "2-3 sentences explaining why this path matches their profile and TRUE INTENT perfectly",
      "timeToEntry": "3-6 months",
      "difficulty": "Beginner/Intermediate/Advanced"
    },
    {
      "role": "Second best path",
      "fitScore": 85,
      "reasoning": "Why this is second choice",
      "timeToEntry": "6-9 months", 
      "difficulty": "Intermediate"
    },
    {
      "role": "Third option path",
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
- CRITICALLY analyze their goal: ${personaJson.goal}
- Consider time availability: ${personaJson.hours_per_week} hours/week
- Respect constraints: ${personaJson.constraints?.join(', ') || 'none'}
- Timeline expectation: ${personaJson.timeline_months} months

PATH TYPES TO CONSIDER:
- **Knowledge/Learning Paths**: "AI Fundamentals Learning Path", "Deep Learning Explorer", "AI Ethics & Philosophy Track"
- **Career Transition Paths**: "AI Engineer", "Data Scientist", "ML Engineer" 
- **Skill Enhancement Paths**: "AI for [Current Profession]", "AI Tools Mastery", "AI Automation Specialist"
- **Industry Application Paths**: "AI in Healthcare", "AI for Business", "AI in Creative Industries"

Match the path type to their TRUE INTENT, not just assume they want a career change.`;

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
      let content = data.choices[0].message.content;
      console.log('Raw AI response:', content);
      
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
      
      roleRecommendations = JSON.parse(content.trim());
      console.log('Role classification result:', roleRecommendations);
    } catch (parseError) {
      console.error('Failed to parse role recommendations:', data.choices[0].message.content);
      console.error('Parse error:', parseError.message);
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