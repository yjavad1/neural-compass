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

// INTELLIGENT SUGGESTION GENERATOR - Question-Type Detection
function generateContextualSuggestions(
  userLevel: 'beginner' | 'intermediate' | 'advanced',
  phase: 'discovery' | 'clarification' | 'roadmap',
  aiQuestion: string,
  personalInfo: any = {}
): string[] {
  const lowerQuestion = aiQuestion.toLowerCase();
  
  // MULTIPLE CHOICE DETECTION - Return exact A/B/C options
  if (/please choose\s*a,\s*b,\s*or\s*c/i.test(aiQuestion) || /please choose/i.test(aiQuestion)) {
    const a = aiQuestion.match(/A\)\s*([\s\S]*?)\s*B\)/i);
    const b = aiQuestion.match(/B\)\s*([\s\S]*?)\s*C\)/i);
    const c = aiQuestion.match(/C\)\s*([\s\S]*?)(?:\n|\r|Please choose|$)/i);
    
    if (a && b && c) {
      return [
        `A) ${a[1].trim()}`,
        `B) ${b[1].trim()}`,
        `C) ${c[1].trim()}`
      ];
    }
  }
  
  // EDUCATION LEVEL QUESTIONS
  if (lowerQuestion.includes('education') || lowerQuestion.includes('degree') || lowerQuestion.includes('school')) {
    return [
      "A) High school",
      "B) Bachelor's degree", 
      "C) Postgraduate degree"
    ];
  }
  
  // PROGRAMMING EXPERIENCE QUESTIONS
  if (lowerQuestion.includes('programming') || lowerQuestion.includes('coding') || lowerQuestion.includes('computer')) {
    return [
      "A) No experience",
      "B) Basic familiarity",
      "C) Confident with code"
    ];
  }
  
  // TIME AVAILABILITY QUESTIONS
  if (lowerQuestion.includes('time') || lowerQuestion.includes('hours') || lowerQuestion.includes('weekly')) {
    return [
      "A) 2-4 hours",
      "B) 5-8 hours", 
      "C) 10+ hours"
    ];
  }
  
  // AI INTEREST/DOMAIN QUESTIONS
  if (lowerQuestion.includes('ai') || lowerQuestion.includes('domain') || lowerQuestion.includes('interest')) {
    return [
      "A) Business automation",
      "B) Creative tools",
      "C) Data analysis"
    ];
  }
  
  // CURRENT SITUATION QUESTIONS
  if (lowerQuestion.includes('working') || lowerQuestion.includes('student') || lowerQuestion.includes('situation')) {
    return [
      "A) I'm a student",
      "B) Working professional",
      "C) Career switching"
    ];
  }
  
  // NAME/INTRODUCTION QUESTIONS
  if (lowerQuestion.includes('name') || lowerQuestion.includes('call')) {
    return [
      "A) I'll share my name",
      "B) Let's skip to questions",
      "C) Tell me more first"
    ];
  }
  
  // ROADMAP READINESS
  if (phase === 'roadmap' || lowerQuestion.includes('roadmap') || lowerQuestion.includes('ready')) {
    return [
      "A) Yes, create my roadmap!",
      "B) I need more clarification",
      "C) What does it include?"
    ];
  }
  
  // FALLBACK - Generic helpful responses
  return [
    "A) That sounds good",
    "B) Tell me more options", 
    "C) I need more information"
  ];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, aiQuestion, conversationHistory, sessionToken } = await req.json();
    
    if (!sessionId || !aiQuestion) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate session token for security
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Session token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set session token for RLS context
    await supabase.sql`SET app.session_token = ${sessionToken}`;

    // Detect user level and phase
    const userLevel = detectUserLevel(conversationHistory || []);
    const phase = getPhaseFromMessages(conversationHistory || []);
    
    console.log(`Generating rule-based suggestions for ${userLevel} user in ${phase} phase, context: ${aiQuestion}`);

    // Get session data for personalization
    const { data: sessionData } = await supabase
      .from('conversation_sessions')
      .select('session_data')
      .eq('id', sessionId)
      .single();

    const personalInfo = sessionData?.session_data || {};

    // Generate contextual suggestions using rules instead of AI
    const suggestions = generateContextualSuggestions(userLevel, phase, aiQuestion, personalInfo);

    // Cache suggestions in database (optional for analytics)
    try {
      await supabase
        .from('conversation_suggestions')
        .insert({
          session_id: sessionId,
          message_context: aiQuestion,
          suggestions: suggestions
        });
    } catch (error) {
      console.warn('Failed to cache suggestions (non-critical):', error);
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    
    // Always return working fallback suggestions
    const fallbackSuggestions = [
      "That sounds interesting",
      "I'd like to learn more about that",
      "Can you tell me more?",
      "What would you recommend?"
    ];

    return new Response(JSON.stringify({ suggestions: fallbackSuggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
function detectUserLevel(conversationHistory: any[]): 'beginner' | 'intermediate' | 'advanced' {
  const allText = conversationHistory
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content.toLowerCase())
    .join(' ');

  const advancedTerms = ['programming', 'python', 'javascript', 'machine learning', 'neural network', 'tensorflow', 'pytorch', 'algorithm', 'data science', 'api', 'framework'];
  const intermediateTerms = ['computer', 'software', 'technology', 'coding', 'technical', 'digital', 'online course'];

  const advancedCount = advancedTerms.filter(term => allText.includes(term)).length;
  const intermediateCount = intermediateTerms.filter(term => allText.includes(term)).length;

  if (advancedCount >= 2) return 'advanced';
  if (intermediateCount >= 1 || advancedCount >= 1) return 'intermediate';
  return 'beginner';
}

function getPhaseFromMessages(conversationHistory: any[]): 'discovery' | 'clarification' | 'roadmap' {
  const userMessages = conversationHistory.filter(msg => msg.role === 'user').length;
  
  // Matches new fast-progression logic
  if (userMessages <= 2) return 'discovery';
  if (userMessages <= 4) return 'clarification'; 
  return 'roadmap';
}