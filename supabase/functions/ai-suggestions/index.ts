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
    const { sessionId, aiQuestion, conversationHistory } = await req.json();

    if (!sessionId || !aiQuestion) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for cached suggestions first
    const { data: cachedSuggestions } = await supabase
      .from('conversation_suggestions')
      .select('suggestions')
      .eq('session_id', sessionId)
      .eq('message_context', aiQuestion)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cachedSuggestions) {
      return new Response(JSON.stringify({ 
        suggestions: cachedSuggestions.suggestions 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate new suggestions using GPT-5 mini
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const suggestionsPrompt = `Based on the conversation history and the AI's current question, generate 3-4 contextual response suggestions for the user.

REQUIREMENTS:
- Each suggestion should be natural, conversational, and authentic
- Vary the response types: some detailed, some brief, some specific, some general
- Make suggestions that would lead to productive conversation
- Consider the user's background and interests mentioned so far
- Ensure suggestions are relevant to the AI's question

Return ONLY a JSON array of strings, nothing else:
["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]

CONVERSATION CONTEXT:
${conversationHistory ? conversationHistory.slice(-6).map((m: any) => `${m.role}: ${m.content}`).join('\n') : 'No previous context'}

AI'S CURRENT QUESTION: ${aiQuestion}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: suggestionsPrompt }
        ],
        max_completion_tokens: 300,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const suggestions = JSON.parse(data.choices[0].message.content);

    // Cache the suggestions
    await supabase
      .from('conversation_suggestions')
      .insert({
        session_id: sessionId,
        message_context: aiQuestion,
        suggestions: suggestions
      });

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-suggestions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestions: [
        "I'd like to share more about my background...",
        "Let me think about that...",
        "Can you give me some examples?",
        "I'm not sure, could you clarify?"
      ]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});