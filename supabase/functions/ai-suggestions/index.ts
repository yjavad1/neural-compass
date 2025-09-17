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

// Helper function to create fallback suggestions based on context
function createContextualFallbacks(userLevel: string, phase: string, aiQuestion: string): string[] {
  const beginnerSuggestions = [
    "I'm completely new to AI and would like to start with the basics",
    "Could you explain that in simpler terms?", 
    "What would you recommend for someone just starting out?",
    "I'm not familiar with those terms, can you help me understand?"
  ];

  const intermediateSuggestions = [
    "I have some technical background but want to learn more about AI specifically",
    "Can you give me some concrete examples?",
    "What are the practical steps I should take?",
    "How does this relate to real-world applications?"
  ];

  const advancedSuggestions = [
    "I'm familiar with the technical concepts, tell me about career paths",
    "What specific skills should I focus on developing?",
    "How can I transition my current experience into AI?",
    "What are the industry trends I should be aware of?"
  ];

  if (userLevel === 'beginner') return beginnerSuggestions;
  if (userLevel === 'advanced') return advancedSuggestions;
  return intermediateSuggestions;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, aiQuestion, conversationHistory } = await req.json();

    if (!sessionId || !aiQuestion) {
      console.error('Missing parameters:', { sessionId: !!sessionId, aiQuestion: !!aiQuestion });
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters',
        suggestions: createContextualFallbacks('beginner', 'discovery', aiQuestion)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Detect user level and phase for contextual suggestions
    const userLevel = detectUserLevel(conversationHistory || []);
    const phase = getPhaseFromMessages(conversationHistory || []);
    
    console.log('Generating suggestions for:', { userLevel, phase, sessionId });

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

    // Enhanced prompt based on user level and context
    const levelGuidance = {
      beginner: "The user is a complete beginner to AI. Create simple, encouraging suggestions that don't use technical jargon. Focus on basic concepts and learning approaches.",
      intermediate: "The user has some technical background. Create suggestions that bridge their existing knowledge to AI concepts. Mix basic and slightly technical responses.",
      advanced: "The user has strong technical knowledge. Create suggestions that dive into specifics, career strategy, and advanced concepts."
    };

    const phaseGuidance = {
      discovery: "Focus on understanding their background, interests, and current situation. Ask about experience, motivations, and what draws them to AI.",
      clarification: "Dig deeper into their specific interests and goals. Clarify ambiguities and understand their constraints and preferences.",
      roadmap: "Focus on actionable next steps, specific learning paths, and concrete recommendations for their AI journey."
    };

    const suggestionsPrompt = `You are generating response suggestions for a user in an AI career conversation.

USER CONTEXT:
- Experience Level: ${userLevel}
- Conversation Phase: ${phase}
- ${levelGuidance[userLevel]}
- ${phaseGuidance[phase]}

REQUIREMENTS:
- Generate exactly 4 contextual response suggestions
- Make each suggestion authentic and natural (not robotic)
- Vary the response styles: detailed/brief, specific/general, question/statement
- Ensure suggestions help move the conversation forward productively
- Reference their background when relevant
- NO technical jargon for beginners

CRITICAL: Return ONLY a valid JSON array of exactly 4 strings, nothing else:
["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"]

RECENT CONVERSATION:
${conversationHistory ? conversationHistory.slice(-4).map((m: any) => `${m.role}: ${m.content}`).join('\n') : 'Starting conversation'}

AI'S CURRENT MESSAGE: ${aiQuestion}`;

    // Add timeout for API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
            { role: 'system', content: suggestionsPrompt }
          ],
          max_completion_tokens: 400,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      
      if (!response.ok) {
        console.error('OpenAI API error:', data);
        throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
      }

      const messageContent = data.choices[0].message.content.trim();
      console.log('Raw OpenAI response:', messageContent);

      // Robust JSON parsing with validation
      let suggestions;
      try {
        suggestions = JSON.parse(messageContent);
        
        // Validate the suggestions array
        if (!Array.isArray(suggestions) || suggestions.length !== 4) {
          throw new Error('Invalid suggestions format');
        }
        
        // Ensure all suggestions are strings
        suggestions = suggestions.map(s => String(s).trim()).filter(s => s.length > 0);
        
        if (suggestions.length < 3) {
          throw new Error('Insufficient valid suggestions');
        }
        
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError, 'Content:', messageContent);
        suggestions = createContextualFallbacks(userLevel, phase, aiQuestion);
      }

      // Cache the suggestions
      try {
        await supabase
          .from('conversation_suggestions')
          .insert({
            session_id: sessionId,
            message_context: aiQuestion,
            suggestions: suggestions
          });
      } catch (cacheError) {
        console.error('Failed to cache suggestions:', cacheError);
        // Continue anyway - caching failure shouldn't break the response
      }

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('OpenAI request timed out');
        throw new Error('AI response timed out. Please try again.');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Error in ai-suggestions function:', error);
    
    // Provide contextual fallback suggestions based on what we know
    const { conversationHistory } = await req.json().catch(() => ({}));
    const userLevel = detectUserLevel(conversationHistory || []);
    const phase = getPhaseFromMessages(conversationHistory || []);
    const fallbackSuggestions = createContextualFallbacks(userLevel, phase, '');
    
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestions: fallbackSuggestions
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});