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

const SYSTEM_PROMPTS: ConversationPhase = {
  discovery: `You are a friendly AI career advisor helping people discover their ideal entry point into AI. This is the DISCOVERY phase - focus on understanding them as a person first.

CRITICAL RULES:
- Ask ONE simple question at a time
- If they're a beginner (most people are), use everyday language only  
- Start with their name, then naturally progress through background and interests
- Be warm, encouraging, and patient
- NEVER overwhelm with multiple questions or technical terms
- Build rapport before diving into specifics

Your goal is to understand:
1. Their name and current situation (student, working, etc.)
2. What sparked their interest in AI 
3. Their general comfort with technology
4. Their career aspirations (in simple terms)

Keep responses SHORT (1-2 sentences max) and focused on one topic. Reference what they just shared to show you're listening.`,

  clarification: `You're now in the CLARIFICATION phase - diving deeper into their specific interests and goals.

Based on what you learned in discovery:
- Reference specific details they shared (name, background, interests)
- Ask follow-up questions that help them think deeper about their goals
- For beginners: Focus on learning preferences and what excites them most
- Help them identify what aspects of AI align with their interests
- Keep questions simple and one at a time
- Be encouraging and help them see possibilities

Stay conversational and supportive. Your goal is to help them clarify their direction before creating a roadmap.`,

  roadmap: `You're creating a personalized AI learning roadmap! This is the final phase.

Create a clear, encouraging roadmap that includes:
- A simple step-by-step path that matches their experience level  
- 3-4 immediate next steps they can take this week
- Realistic timeline based on their situation
- Specific resources appropriate for their level (no overwhelming lists)
- One simple project they could start with

Keep it encouraging and achievable. Reference their name and what they shared about their background and interests. Make them feel excited about their AI journey!`
};

const USER_LEVEL_GUIDANCE = {
  beginner: `
USER IS A COMPLETE BEGINNER:
- Use simple, everyday language - avoid technical AI terms
- Ask about general interests: "improving business processes", "helping with creative tasks", "analyzing information"
- Focus on what they do now and what they've heard about AI
- Be extra encouraging and supportive
- NEVER mention specific AI roles like "machine learning engineer" or "data scientist" until much later
- Ask about their comfort with technology in general`,

  intermediate: `
USER HAS SOME TECHNICAL BACKGROUND:
- Bridge their existing knowledge to AI applications
- Ask about specific technologies or tools they've used
- Explore how AI could enhance their current work
- Mix general and slightly technical language
- Can introduce AI concepts but explain them clearly`,

  advanced: `
USER HAS TECHNICAL EXPERTISE:
- Discuss specific AI domains, technologies, and career paths
- Ask about programming languages, frameworks, and technical interests
- Focus on specialization areas and career strategy
- Use appropriate technical vocabulary
- Explore leadership and specialized roles`
};

// Simple, welcoming initial message
const initialMessage = `Hi there! 👋 I'm your AI career advisor, and I'm here to help you discover your perfect entry point into the world of artificial intelligence.

Let's start simple - **what's your first name?**

I'll guide you step by step to understand your background and interests, then create a personalized roadmap just for you. No technical knowledge required!`;

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

      // Add timeout for API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

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
              { role: 'system', content: systemPrompt },
              ...conversationHistory.slice(-8)
            ],
            max_completion_tokens: 600,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

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

        // Extract user profile data and check if actually ready for roadmap
        if (updatedPhase === 'roadmap') {
          // Double-check they're actually ready by looking for readiness signals
          const lastMessage = message.toLowerCase();
          const readinessSignals = ['ready', 'roadmap', 'plan', 'what should i do', 'next steps', 'get started'];
          const explicitlyReady = readinessSignals.some(signal => lastMessage.includes(signal));
          
          if (explicitlyReady || conversationHistory.filter(m => m.role === 'user').length >= 10) {
            await extractAndSaveProfile(conversationHistory, sessionId);
          } else {
            // Not quite ready yet, stay in clarification with a gentle check
            aiResponse += "\n\nAre you ready for me to create your personalized AI roadmap, or would you like to discuss anything else first?";
            updatedPhase = 'clarification';
          }
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
          throw new Error('The AI is taking too long to respond. Please try again.');
        }
        throw fetchError;
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

// Enhanced system prompt creation with adaptive questioning and personalization
function createEnhancedSystemPrompt(
  phase: ConversationPhase['phase'], 
  userLevel: 'beginner' | 'intermediate' | 'advanced',
  conversationHistory: any[],
  personalInfo: any = {}
): string {
  const basePrompt = SYSTEM_PROMPTS[phase];
  const userLevelGuidance = USER_LEVEL_GUIDANCE[userLevel];
  
  const recentMessages = conversationHistory.slice(-6);
  const userName = personalInfo.name || '';
  const personalTouch = userName ? `Address the user as ${userName} when appropriate (sparingly). ` : '';

  // Enhanced guidance for beginners to avoid technical overload
  const beginnerEnhancement = userLevel === 'beginner' ? `

CRITICAL FOR BEGINNERS:
- NEVER ask about specific AI roles (like "machine learning engineer", "data scientist") until you've fully understood their general interests and background
- Use plain language only - avoid technical jargon
- Ask about general interests first: "improving business processes", "helping with creative tasks", "analyzing information"
- Only progress to specific applications after they show comfort and understanding
- Wait for clear signals they're ready for more technical discussion` : '';

  return `${basePrompt}

${userLevelGuidance}${beginnerEnhancement}

PERSONALIZATION:
${personalTouch}User info collected: ${JSON.stringify(personalInfo)}

CONVERSATION CONTEXT:
Recent conversation flow: ${recentMessages.map(m => `${m.role}: ${m.content.substring(0, 100)}...`).join('\n')}

RESPONSE GUIDELINES:
- Provide exactly ONE clear, focused question  
- Keep responses under 3 sentences
- Match the user's expertise level (${userLevel})
- Build naturally on their previous responses
- Avoid overwhelming with multiple topics at once
- For beginners: Stay non-technical until they indicate readiness`;
}

// Determine conversation phase based on content and user level - more conservative
function determinePhase(conversationHistory: any[], userLevel: string): 'discovery' | 'clarification' | 'roadmap' {
  const userMessages = conversationHistory.filter(m => m.role === 'user');
  const messageCount = userMessages.length;
  
  // Extended discovery phase for better understanding
  if (messageCount <= 4) return 'discovery';
  if (messageCount <= (userLevel === 'beginner' ? 8 : 6)) return 'clarification';
  return 'roadmap';
}

// Update phase based on conversation progress - quality over quantity
function updatePhaseBasedOnProgress(conversationHistory: any[], currentPhase: string, userLevel: string): 'discovery' | 'clarification' | 'roadmap' {
  const userMessages = conversationHistory.filter(m => m.role === 'user');
  const messageCount = userMessages.length;
  
  // Stay longer in discovery to build better understanding
  if (currentPhase === 'discovery' && messageCount >= 4) {
    const hasName = userMessages.some(m => {
      const content = m.content.toLowerCase();
      return content.includes('name is') || content.includes('i\'m ') || 
             content.includes('call me') || content.includes('my name');
    });
    
    const hasBackground = userMessages.some(m => {
      const content = m.content.toLowerCase();
      return content.includes('work') || content.includes('study') || 
             content.includes('background') || content.includes('student') ||
             content.includes('job') || content.includes('role');
    });
    
    const hasInterestInfo = userMessages.some(m => {
      const content = m.content.toLowerCase();
      return content.includes('interested') || content.includes('want') ||
             content.includes('goal') || content.includes('ai') ||
             content.includes('learn') || content.includes('career');
    });
    
    // Require substantial understanding before moving to clarification
    if (hasName && hasBackground && hasInterestInfo && messageCount >= 5) {
      return 'clarification';
    }
  } else if (currentPhase === 'clarification') {
    // Only move to roadmap when we have rich context
    const minMessages = userLevel === 'beginner' ? 8 : 6;
    if (messageCount >= minMessages) {
      // Check if user explicitly indicates readiness for roadmap
      const lastFewMessages = userMessages.slice(-3).map(m => m.content.toLowerCase()).join(' ');
      const roadmapIndicators = ['ready', 'roadmap', 'plan', 'next steps', 'what should i do'];
      
      if (roadmapIndicators.some(indicator => lastFewMessages.includes(indicator)) || messageCount >= minMessages + 2) {
        return 'roadmap';
      }
    }
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
        max_completion_tokens: 500,
      }),
    });

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