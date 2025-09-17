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

// Helper function to detect user experience level
function detectUserLevel(conversationHistory: any[]): 'beginner' | 'intermediate' | 'advanced' {
  const userMessages = conversationHistory
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  const beginnerIndicators = [
    'no idea', 'not sure', 'beginner', 'new to', 'never', 'just starting',
    'don\'t know', 'confused', 'basic', 'simple', 'help me understand'
  ];
  
  const advancedIndicators = [
    'tensorflow', 'pytorch', 'neural network', 'deep learning', 'algorithm',
    'python', 'statistics', 'data science', 'machine learning', 'api', 'model'
  ];

  const beginnerScore = beginnerIndicators.filter(indicator => userMessages.includes(indicator)).length;
  const advancedScore = advancedIndicators.filter(indicator => userMessages.includes(indicator)).length;

  if (beginnerScore > advancedScore && beginnerScore > 0) return 'beginner';
  if (advancedScore > 2) return 'advanced';
  return 'intermediate';
}

// Helper function to get conversation phase
function getPhaseFromMessages(conversationHistory: any[]): 'discovery' | 'clarification' | 'roadmap' {
  const messageCount = conversationHistory.filter(m => m.role === 'user').length;
  if (messageCount <= 2) return 'discovery';
  if (messageCount <= 5) return 'clarification';
  return 'roadmap';
}

// Generate solid, reliable fallback suggestions that work without AI
function createContextualFallbacks(userLevel: string, phase: string, aiQuestion: string, personalInfo: any = {}): string[] {
  // Simple, encouraging responses that work in any context
  if (phase === 'discovery') {
    return [
      "I'm new to AI - can you help me understand the basics?",
      "What does my background mean for AI opportunities?", 
      "I'm curious about AI but not sure where to start",
      "Can you tell me more about what's possible in AI?"
    ];
  } else if (phase === 'clarification') {
    return [
      "Could you give me some examples of that?",
      "What would you recommend for someone like me?", 
      "How does that work in practice?",
      "What should I focus on first?"
    ];
  } else {
    return [
      "What are my next steps?",
      "How long would that take?",
      "What resources do you recommend?",
      "How do I get started with that?"
    ];
  }

}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, aiQuestion, conversationHistory } = await req.json();

    if (!sessionId || !conversationHistory) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle empty aiQuestion by deriving from conversation
    let contextQuestion = aiQuestion;
    if (!aiQuestion || aiQuestion.trim().length === 0) {
      console.log('aiQuestion is empty, deriving from conversation history');
      const lastAssistantMessage = conversationHistory
        .filter(m => m.role === 'assistant')
        .pop();
      contextQuestion = lastAssistantMessage?.content || 'general conversation';
    }

    const userLevel = detectUserLevel(conversationHistory);
    const phase = getPhaseFromMessages(conversationHistory);

    console.log(`Generating suggestions for ${userLevel} user in ${phase} phase, context: ${contextQuestion}`);

    // Get recent suggestions to avoid repetition
    const { data: recentSuggestions } = await supabase
      .from('conversation_suggestions')
      .select('suggestions')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(3);

    const usedSuggestions = recentSuggestions
      ?.flatMap(r => r.suggestions || [])
      .filter(s => s && typeof s === 'string') || [];

    console.log(`Found ${usedSuggestions.length} recent suggestions to avoid repeating`);

    // Get session data for personalization
    const { data: sessionData } = await supabase
      .from('conversation_sessions')
      .select('session_data')
      .eq('id', sessionId)
      .single();

    const personalInfo = sessionData?.session_data || {};

    // Create a comprehensive prompt for generating varied suggestions
    const userName = personalInfo.name || '';
    const personalTouch = userName ? ` (address as ${userName} occasionally but not always)` : '';
    
    const prompt = `You are generating response suggestions for a user in an AI career conversation.

Context:
- User Level: ${userLevel}
- Conversation Phase: ${phase}
- AI Question: "${contextQuestion}"
- User Personal Info: ${JSON.stringify(personalInfo)}${personalTouch}
- Recent conversation: ${conversationHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}

AVOID REPEATING these previously used suggestions: ${JSON.stringify(usedSuggestions)}

Generate exactly 4 diverse, fresh, contextually relevant response suggestions that:
1. Match the user's experience level (${userLevel})
2. Are appropriate for the ${phase} phase
3. Help move the conversation forward naturally
4. Vary in style (some questions, some statements, some exploratory)
5. Are conversational and authentic
6. Do NOT repeat any of the avoided suggestions above
7. Show variety in length and approach

${userLevel === 'beginner' ? 'Use simple, non-technical language. Focus on general interests and comfort level. Avoid technical AI roles/terms.' : ''}
${userLevel === 'intermediate' ? 'Use moderately technical language. Balance between learning and application.' : ''}
${userLevel === 'advanced' ? 'Use technical language. Focus on specific technologies and advanced applications.' : ''}

Return ONLY a JSON array of strings, like: ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]`;

    // Generate new suggestions using GPT-5 mini
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Add shorter timeout for API call - fail fast to fallbacks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini-2025-08-07',
          messages: [
            { role: 'system', content: prompt }
          ],
          max_completion_tokens: 400,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${errorData.error?.message || `HTTP ${response.status}`}`);
      }

      const data = await response.json();

      const content = data.choices?.[0]?.message?.content || '';
      console.log('Raw OpenAI response:', content);

      if (!content || content.trim().length === 0) {
        console.warn('Empty OpenAI response, using fallbacks');
        throw new Error('Empty OpenAI response');
      }

      // Parse and validate JSON response
      let suggestions: string[];
      try {
        let parsedSuggestions = JSON.parse(content);
        if (!Array.isArray(parsedSuggestions) || parsedSuggestions.length === 0) {
          throw new Error('Invalid suggestions format');
        }
        
        // Validate that all suggestions are strings
        if (!parsedSuggestions.every(s => typeof s === 'string' && s.trim().length > 0)) {
          throw new Error('Invalid suggestion content');
        }

        // Filter out suggestions that match used ones (avoid repetition)
        const filteredSuggestions = parsedSuggestions.filter(s => 
          !usedSuggestions.some(used => 
            s.toLowerCase().includes(used.toLowerCase()) || 
            used.toLowerCase().includes(s.toLowerCase())
          )
        );

        // If we filtered out too many, top up with contextual fallbacks
        if (filteredSuggestions.length < 3) {
          const fallbacks = createContextualFallbacks(userLevel, phase, contextQuestion, personalInfo);
          const neededFallbacks = fallbacks.filter(f => 
            !usedSuggestions.some(used => 
              f.toLowerCase().includes(used.toLowerCase()) || 
              used.toLowerCase().includes(f.toLowerCase())
            )
          );
          suggestions = [...filteredSuggestions, ...neededFallbacks].slice(0, 4);
        } else {
          suggestions = filteredSuggestions.slice(0, 4);
        }

        // Shuffle for variety
        suggestions = suggestions.sort(() => Math.random() - 0.5);
        
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        console.log('Using contextual fallbacks instead');
        suggestions = createContextualFallbacks(userLevel, phase, contextQuestion, personalInfo);
      }

      // Cache the suggestions with context question
      await supabase
        .from('conversation_suggestions')
        .insert({
          session_id: sessionId,
          message_context: contextQuestion,
          suggestions
        });

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error generating suggestions:', error);
      
      // Return contextual fallbacks on any error
      const fallbackSuggestions = createContextualFallbacks(userLevel, phase, contextQuestion, personalInfo);
      
      return new Response(
        JSON.stringify({ suggestions: fallbackSuggestions }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in ai-suggestions function:', error);
    
    // Provide contextual fallback suggestions based on what we know
    const { conversationHistory } = await req.json().catch(() => ({}));
    const userLevel = detectUserLevel(conversationHistory || []);
    const phase = getPhaseFromMessages(conversationHistory || []);
    const fallbackSuggestions = createContextualFallbacks(userLevel, phase, '', {});
    
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestions: fallbackSuggestions
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});