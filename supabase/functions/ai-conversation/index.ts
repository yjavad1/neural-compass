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

interface ConversationPhase {
  discovery: string;
  clarification: string;
  roadmap: string;
}

// Helper function to detect user experience level from conversation
function detectUserExperienceLevel(conversationHistory: any[]): 'beginner' | 'intermediate' | 'advanced' {
  const userMessages = conversationHistory
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  const beginnerIndicators = [
    'no idea', 'not sure', 'beginner', 'new to', 'never', 'just starting',
    'don\'t know', 'confused', 'basic', 'simple', 'help me understand',
    'no experience', 'complete beginner', 'start from scratch'
  ];
  
  const advancedIndicators = [
    'tensorflow', 'pytorch', 'neural network', 'deep learning', 'algorithm',
    'python', 'statistics', 'data science', 'machine learning', 'api', 'model',
    'programming', 'software engineer', 'data analyst', 'computer science'
  ];

  const beginnerScore = beginnerIndicators.filter(indicator => userMessages.includes(indicator)).length;
  const advancedScore = advancedIndicators.filter(indicator => userMessages.includes(indicator)).length;

  if (beginnerScore > 0 && beginnerScore >= advancedScore) return 'beginner';
  if (advancedScore > 2) return 'advanced';
  return 'intermediate';
}

// STRUCTURED PROMPT TEMPLATES - Concise & Effective
const SYSTEM_PROMPTS: ConversationPhase = {
  discovery: `You are an AI career advisor specializing in helping users enter the artificial intelligence industry.
Always respond in under 90 words, using simple language and a supportive tone.
Format all lists as bullet points, ask one question at a time, and always end with a clear call to action or next question.

Ask the user ONE multiple-choice question to understand their background or goals for an AI career.
The question must be between 15 and 25 words.
Provide exactly three options (A, B, C, max 6 words each).
Do not explain the options or add extra text.
End with: 'Please choose A, B, or C.'`,

  clarification: `You are an AI career advisor specializing in helping users enter the artificial intelligence industry.
Always respond in under 90 words, using simple language and a supportive tone.
Format all lists as bullet points, ask one question at a time, and always end with a clear call to action or next question.

Ask the user ONE multiple-choice question to understand their interests and technical background.
The question must be between 15 and 25 words.
Provide exactly three options (A, B, C, max 6 words each).
Do not explain the options or add extra text.
End with: 'Please choose A, B, or C.'`,

  roadmap: `Create a structured 12–24 week learning path for their AI role, based on their pace/time.
Split into three phases: Foundations, Core, Specialization.
Each phase: 2 action steps, each action step ≤12 words.
End with: 'Would you like resources for Phase 1?'
Keep the entire response under 200 words total.`
};

// CONCISE USER LEVEL TEMPLATES
const USER_LEVEL_GUIDANCE = {
  beginner: `Sample questions:
"Which best describes your highest education completed? A) High school B) Bachelor's degree C) Postgraduate degree"
"How comfortable are you with computer programming? A) No experience B) Basic familiarity C) Confident with code"`,

  intermediate: `Sample questions:
"What interests you most about AI applications? A) Business automation B) Creative tools C) Data analysis"
"How much time can you dedicate weekly? A) 2-4 hours B) 5-8 hours C) 10+ hours"`,

  advanced: `Sample questions:
"Which AI domain excites you most? A) Machine learning B) Computer vision C) Natural language"
"What's your programming background? A) Python/R expert B) Multiple languages C) Other languages"`
};

// FAST, FOCUSED INITIAL MESSAGE
const initialMessage = `Hi! I'm your AI career advisor. Let's find your perfect AI path in just a few quick questions.

What's your first name so I can personalize our conversation?
A) I'll share my name
B) Let's skip to questions  
C) Tell me more first

Please choose A, B, or C.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, action } = await req.json();
    
    if (action === 'start') {
      // Create new conversation session
      const { data: session, error: sessionError } = await supabase
        .from('conversation_sessions')
        .insert({ phase: 'discovery' })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Send initial AI message with personalization request
      await supabase
        .from('conversation_messages')
        .insert([
          { session_id: session.id, role: 'assistant', content: initialMessage }
        ]);

      return new Response(JSON.stringify({ 
        sessionId: session.id, 
        message: initialMessage,
        phase: 'discovery'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send' && message && sessionId) {
      // Get current session and conversation history
      const { data: session } = await supabase
        .from('conversation_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      const { data: messages } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      // Save user message
      const { error: messageError } = await supabase
        .from('conversation_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: message
        });

      if (messageError) {
        console.error('Error saving user message:', messageError);
      }

      // Extract and store name/DOB incrementally
      await extractAndStorePersonalInfo(message, sessionId);

      // Prepare conversation context for AI
      const conversationHistory = messages?.map(msg => ({
        role: msg.role,
        content: msg.content
      })) || [];

      conversationHistory.push({ role: 'user', content: message });

      // Detect user experience level for context-aware responses
      const userLevel = detectUserExperienceLevel(conversationHistory);

      // Get stored session data for personalization
      const { data: sessionData } = await supabase
        .from('conversation_sessions')
        .select('session_data')
        .eq('id', sessionId)
        .single();

      const personalInfo = sessionData?.session_data || {};

      // Determine current phase and user experience level
      const currentPhase = determinePhase(conversationHistory, userLevel);
      const updatedPhase = updatePhaseBasedOnProgress(conversationHistory, currentPhase, userLevel);

      console.log(`Phase: ${currentPhase} -> ${updatedPhase}, User Level: ${userLevel}, PersonalInfo:`, personalInfo);

      // Create enhanced system prompt with conversation context and personalization
      const systemPrompt = createEnhancedSystemPrompt(updatedPhase, userLevel, conversationHistory, personalInfo);

      // Update session phase if changed
      if (updatedPhase !== session?.phase) {
        await supabase
          .from('conversation_sessions')
          .update({ phase: updatedPhase })
          .eq('id', sessionId);
      }

      // Call OpenAI API with GPT-5 mini
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      // Add timeout for API call - optimized for speed
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const startedAt = Date.now();

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
        model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationHistory.slice(-4)
            ],
            max_tokens: 200,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('OpenAI chat completion status', response.status);
        console.log('OpenAI latency ms:', Date.now() - startedAt);

        const data = await response.json();
        
        if (!response.ok) {
          console.error('OpenAI API error:', data);
          throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
        }

        let aiResponse = data.choices[0].message.content;
        
        // Guarantee non-empty AI replies with fallback
        if (!aiResponse || aiResponse.trim().length === 0) {
          console.warn('OpenAI returned empty response, using fallback');
          aiResponse = generateFallbackResponse(userLevel, updatedPhase, personalInfo);
        }

        // Save AI response
        await supabase
          .from('conversation_messages')
          .insert({ session_id: sessionId, role: 'assistant', content: aiResponse });

        // Extract user profile data when reaching roadmap phase
        if (updatedPhase === 'roadmap') {
          extractAndSaveProfile(conversationHistory, sessionId).catch((e) => console.error('Profile extraction error:', e));
        }

        return new Response(JSON.stringify({ 
          message: aiResponse,
          phase: updatedPhase,
          isComplete: updatedPhase === 'roadmap'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('OpenAI request timed out for session:', sessionId);
          
          // Provide fallback response instead of crashing
          const fallbackMessage = "I'm having trouble processing that right now. Let me ask you a simple question instead: What's your current education level? A) High school B) Bachelor's degree C) Advanced degree. Please choose A, B, or C.";
          
          // Save fallback message to database
          await supabase.from('conversation_messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: fallbackMessage,
            metadata: { fallback: true, timeout: true }
          });
          
          return new Response(JSON.stringify({ 
            message: fallbackMessage,
            phase: currentPhase,
            isComplete: false 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        console.error('OpenAI request failed for session:', sessionId, fetchError);
        const fallbackMessage = "Let's keep going while I sort that out. Which area of AI interests you most? A) Business automation B) Creative tools C) Data analysis. Please choose A, B, or C.";
        await supabase.from('conversation_messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: fallbackMessage,
          metadata: { fallback: true, error: true }
        });
        return new Response(JSON.stringify({
          message: fallbackMessage,
          phase: currentPhase,
          isComplete: false
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-conversation function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// OPTIMIZED SYSTEM PROMPT - Concise & Fast
function createEnhancedSystemPrompt(
  phase: string,
  userLevel: 'beginner' | 'intermediate' | 'advanced',
  conversationHistory: any[],
  personalInfo: any = {}
): string {
  const basePrompt = SYSTEM_PROMPTS[phase as keyof ConversationPhase];
  const userLevelGuidance = USER_LEVEL_GUIDANCE[userLevel];
  
  const userName = personalInfo.name || '';
  const nameContext = userName ? `User's name: ${userName}. ` : '';

  return `${basePrompt}

${userLevelGuidance}

${nameContext}Message count: ${conversationHistory.filter(m => m.role === 'user').length}/6 max

Keep responses under 90 words. Use multiple choice format with exactly 3 options (A, B, C).`;
}

// STREAMLINED PHASE LOGIC - Fast Progression  
function determinePhase(conversationHistory: any[], userLevel: string): 'discovery' | 'clarification' | 'roadmap' {
  const userMessages = conversationHistory.filter(m => m.role === 'user');
  const messageCount = userMessages.length;
  
  // Phase 1: Name + education level (2 questions max)
  if (messageCount <= 2) return 'discovery';
  // Phase 2: Current situation + AI interest (2 questions max) 
  if (messageCount <= 4) return 'clarification';
  // Phase 3: Experience level + goals (2 questions max)
  // Phase 4: Generate roadmap (automatic after 6 quality responses)
  return 'roadmap';
}

function updatePhaseBasedOnProgress(conversationHistory: any[], currentPhase: string, userLevel: string): 'discovery' | 'clarification' | 'roadmap' {
  const userMessages = conversationHistory.filter(m => m.role === 'user');
  const messageCount = userMessages.length;
  
  // Structured 4-phase flow - 6 total questions max
  if (currentPhase === 'discovery' && messageCount >= 2) {
    return 'clarification';
  } else if (currentPhase === 'clarification' && messageCount >= 4) {
    return 'roadmap';
  }
  
  return currentPhase as 'discovery' | 'clarification' | 'roadmap';
}

async function extractAndSaveProfile(conversationHistory: any[], sessionId: string) {
  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const prompt = `Based on this conversation history, extract a comprehensive user profile in JSON format:

${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n\n')}

Extract the following information and return as valid JSON:
{
  "name": "user's first name if mentioned",
  "email": "email if provided", 
  "experience_level": "beginner|intermediate|advanced based on responses",
  "role_current": "current job/role if mentioned",
  "ai_interests": ["list", "of", "ai", "areas", "mentioned"],
  "learning_goals": ["specific", "goals", "mentioned"],
  "preferred_learning_style": "learning preference if mentioned",
  "career_goals": "career aspirations mentioned", 
  "technical_background": "technical skills/background mentioned",
  "available_time_per_week": "number of hours if mentioned",
  "date_of_birth": "YYYY-MM-DD format if birth month/day mentioned (use current year or null)"
}`;

    const profileController = new AbortController();
    const profileTimeout = setTimeout(() => profileController.abort(), 15000);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt }
        ],
        max_tokens: 500,
      }),
      signal: profileController.signal
    });
    clearTimeout(profileTimeout);

    const data = await response.json();
    const profileData = JSON.parse(data.choices[0].message.content);

    // Create user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .insert({
        ...profileData,
        name: profileData.name,
        date_of_birth: profileData.date_of_birth
      })
      .select()
      .single();

    // Link session to profile
    await supabase
      .from('conversation_sessions')
      .update({ 
        user_profile_id: profile.id,
        roadmap_generated: true 
      })
      .eq('id', sessionId);

  } catch (error) {
    console.error('Error in extractAndSaveProfile:', error);
  }
}

// Extract and store personal info incrementally
async function extractAndStorePersonalInfo(message: string, sessionId: string) {
  try {
    const lowerMessage = message.toLowerCase();
    let updates: any = {};
    
    // Extract name patterns
    const namePatterns = [
      /(?:my name is|i'm|i am|call me)\s+([a-zA-Z]+)/i,
      /(?:name[:'s]*)\s*([a-zA-Z]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const nameMatch = message.match(pattern);
      if (nameMatch && nameMatch[1] && nameMatch[1].length > 1) {
        updates.name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
        break;
      }
    }
    
    // Extract DOB patterns (month/day)
    const dobPatterns = [
      /(?:born|birthday|dob|birth)\s*(?:on|is)?\s*(\d{1,2})[\/\-](\d{1,2})/i,
      /(\d{1,2})[\/\-](\d{1,2})(?:\s*(?:birth|birthday|dob))/i
    ];
    
    for (const pattern of dobPatterns) {
      const dobMatch = message.match(pattern);
      if (dobMatch) {
        const month = parseInt(dobMatch[1]);
        const day = parseInt(dobMatch[2]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          updates.date_of_birth = `2024-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
        break;
      }
    }
    
    // Update session_data if we found personal info
    if (Object.keys(updates).length > 0) {
      const { data: currentSession } = await supabase
        .from('conversation_sessions')
        .select('session_data')
        .eq('id', sessionId)
        .single();
      
      const currentData = currentSession?.session_data || {};
      const updatedData = { ...currentData, ...updates };
      
      await supabase
        .from('conversation_sessions')
        .update({ session_data: updatedData })
        .eq('id', sessionId);
        
      console.log('Updated personal info:', updates);
    }
  } catch (error) {
    console.error('Error extracting personal info:', error);
  }
}

// Generate fallback response when OpenAI returns empty
function generateFallbackResponse(userLevel: string, phase: string, personalInfo: any = {}): string {
  const name = personalInfo.name ? `, ${personalInfo.name}` : '';
  
  if (userLevel === 'beginner') {
    if (phase === 'discovery') {
      return `Thanks for sharing${name}! Before we go deeper into AI possibilities, I'd love to understand your background better. What kind of work do you do currently, and what originally sparked your curiosity about AI?`;
    } else if (phase === 'clarification') {
      return `That's really helpful context${name}! Now I'm curious - when you think about applying AI, are you more interested in improving how you work day-to-day, or exploring entirely new career directions?`;
    } else {
      return `Perfect${name}! Based on everything you've shared, I have a good sense of your goals. Let me create a personalized roadmap that matches your background and interests.`;
    }
  } else if (userLevel === 'intermediate') {
    return `Thanks for that insight${name}! Could you tell me more about any specific AI tools or technologies you've already encountered, and what areas you'd like to explore further?`;
  } else {
    return `That's valuable context${name}! Given your technical background, which specific AI domains or applications are you most interested in diving deeper into?`;
  }
}