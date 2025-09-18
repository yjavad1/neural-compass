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

// Rule-based suggestion generator - deterministic and contextual
function generateContextualSuggestions(
  userLevel: 'beginner' | 'intermediate' | 'advanced',
  phase: 'discovery' | 'clarification' | 'roadmap',
  aiQuestion: string,
  personalInfo: any = {}
): string[] {
  const lowerQuestion = aiQuestion.toLowerCase();
  
  // Discovery phase suggestions
  if (phase === 'discovery') {
    if (lowerQuestion.includes('name')) {
      return [
        "Hi! I'm Alex",
        "My name is Sarah",
        "You can call me Mike",
        "I'm Jessica"
      ];
    }
    
    if (lowerQuestion.includes('student') || lowerQuestion.includes('working') || lowerQuestion.includes('career')) {
      return [
        "I'm currently a student",
        "I'm working but looking to switch careers",
        "I'm working and want to add AI skills",
        "I'm between jobs right now"
      ];
    }
    
    if (lowerQuestion.includes('interest') || lowerQuestion.includes('curious') || lowerQuestion.includes('sparked')) {
      return [
        "I keep hearing about AI everywhere",
        "My friend got a job using AI",
        "I saw some cool AI apps and got curious",
        "I want to future-proof my career"
      ];
    }
    
    // Generic discovery fallbacks
    return [
      "Tell me more about that",
      "That sounds interesting",
      "I'd like to learn more",
      "Can you explain further?"
    ];
  }
  
  // Clarification phase suggestions
  if (phase === 'clarification') {
    if (lowerQuestion.includes('creating') || lowerQuestion.includes('analyzing') || lowerQuestion.includes('type')) {
      return [
        "I'm more interested in creating things",
        "Analyzing data sounds fascinating",
        "Working with images and videos appeals to me",
        "I'm not sure yet, what are the options?"
      ];
    }
    
    if (lowerQuestion.includes('app') || lowerQuestion.includes('website') || lowerQuestion.includes('build')) {
      return [
        "Building apps sounds exciting",
        "I'd love to create websites with AI",
        "Making tools that help people",
        "I'm more interested in data analysis"
      ];
    }
    
    if (lowerQuestion.includes('learn') || lowerQuestion.includes('prefer')) {
      return [
        "I like hands-on learning",
        "I prefer reading and tutorials",
        "Video courses work best for me",
        "I learn by doing projects"
      ];
    }
    
    // Generic clarification fallbacks
    return [
      "I'd like to explore that option",
      "That sounds like something I'd enjoy",
      "I'm interested in learning more",
      "Can you tell me about other options?"
    ];
  }
  
  // Roadmap phase suggestions
  if (phase === 'roadmap') {
    if (lowerQuestion.includes('roadmap') || lowerQuestion.includes('generate') || lowerQuestion.includes('create')) {
      return [
        "Yes, please create my roadmap!",
        "That would be great, let's do it",
        "I'm ready for my personalized plan",
        "Let me think about it for a moment"
      ];
    }
    
    // Generic roadmap fallbacks
    return [
      "Yes, I'm ready!",
      "Let's create the roadmap",
      "I'd love to see my plan",
      "What would the roadmap include?"
    ];
  }
  
  // Ultimate fallbacks
  return [
    "That's interesting",
    "Tell me more",
    "I'd like to know more about that",
    "Can you elaborate?"
  ];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, aiQuestion, conversationHistory } = await req.json();
    
    if (!sessionId || !aiQuestion) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
          ai_question: aiQuestion,
          suggestions: suggestions,
          user_level: userLevel,
          conversation_phase: phase
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
  
  if (userMessages <= 2) return 'discovery';
  if (userMessages <= 4) return 'clarification';
  return 'roadmap';
}