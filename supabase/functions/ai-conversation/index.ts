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
  discovery: `You are an AI career advisor specializing in helping people enter the AI field. You're having a friendly, natural conversation to understand their background, interests, and goals.

CRITICAL: Pay close attention to the user's experience level indicated in their responses:
- If they say "no idea", "beginner", "new to AI", etc. → Ask BASIC questions about their general interests, background, and what they've heard about AI
- If they show technical knowledge → You can ask more specific questions about AI areas
- NEVER ask technical questions to someone who has indicated they're a complete beginner

Your goal in this phase is to:
- Learn about their current experience level and background
- Understand their general interests and what attracts them to AI
- Discover their career goals and motivations  
- Assess their technical background (if any)
- Find out their current situation (student, working professional, career changer)

IMPORTANT: Match your language and questions to their stated experience level. For beginners, focus on broad interests, motivations, and general background rather than specific AI domains.

Ask ONE thoughtful follow-up question at a time. Be conversational, encouraging, and reference their previous answers. Keep responses concise (2-3 sentences max).`,

  clarification: `You are continuing the conversation to clarify and deepen understanding of the person's AI career interests.

Based on the conversation history and their experience level, you should:
- Reference specific details they've mentioned previously
- Ask targeted follow-up questions appropriate to their knowledge level
- For beginners: Focus on learning preferences, time availability, and comfort with technology
- For intermediate/advanced: Dig deeper into specific AI interests and technical goals
- Understand their learning style, timeline, and constraints better
- Explore potential challenges, concerns, or obstacles they foresee

Be empathetic, supportive, and show you remember what they've shared. Adjust your language complexity to match their experience level.`,

  roadmap: `You are creating a comprehensive, personalized AI learning roadmap based on all the information gathered in the conversation.

Generate a detailed, actionable roadmap that includes:
- A clear, step-by-step learning path tailored to their background and goals
- Specific online courses, resources, and tools appropriate for their level
- Realistic timeline based on their available time and current skill level
- Practical projects they can work on to build their portfolio
- Key skills they need to develop in order of priority
- Industry insights and career progression pathways
- Immediate next steps they should take this week

CRITICAL: Ensure the roadmap matches their experience level - don't overwhelm beginners with advanced concepts, and don't oversimplify for experienced users.

Make it encouraging, achievable, and highly specific to their situation. Reference their background, interests, and constraints mentioned in the conversation.`
};

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

      // Send initial AI message
      const initialMessage = "Hi! I'm excited to help you explore career opportunities in AI. Let's start with the basics - what's your current background, and what draws you to the field of artificial intelligence?";
      
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
      await supabase
        .from('conversation_messages')
        .insert({ session_id: sessionId, role: 'user', content: message });

      // Prepare conversation context for AI
      const conversationHistory = messages?.map(msg => ({
        role: msg.role,
        content: msg.content
      })) || [];

      conversationHistory.push({ role: 'user', content: message });

      // Intelligent phase detection based on content completeness
      let currentPhase = session?.phase || 'discovery';
      const userMessages = conversationHistory.filter(m => m.role === 'user');
      const messageCount = userMessages.length;
      
      // Detect user experience level for context-aware responses
      const userLevel = detectUserExperienceLevel(conversationHistory);
      
      // Enhanced phase transition logic based on content and user level
      if (currentPhase === 'discovery' && messageCount >= 2) {
        const hasBasicInfo = userMessages.some(m => {
          const content = m.content.toLowerCase();
          return content.includes('work') || content.includes('study') || 
                 content.includes('background') || content.includes('experience') ||
                 content.includes('currently') || content.includes('job');
        });
        
        const hasInterestInfo = userMessages.some(m => {
          const content = m.content.toLowerCase();
          return content.includes('interested') || content.includes('want') ||
                 content.includes('goal') || content.includes('ai') ||
                 content.includes('learn') || content.includes('career');
        });
        
        if (hasBasicInfo && hasInterestInfo) {
          currentPhase = 'clarification';
        }
      } else if (currentPhase === 'clarification' && messageCount >= 4) {
        // For beginners, we might need more clarification before roadmap
        const minMessages = userLevel === 'beginner' ? 5 : 4;
        if (messageCount >= minMessages) {
          currentPhase = 'roadmap';
        }
      }

      // Update session phase if changed
      if (currentPhase !== session?.phase) {
        await supabase
          .from('conversation_sessions')
          .update({ phase: currentPhase })
          .eq('id', sessionId);
      }

      // Enhanced context-aware system prompt with user level
      const enhancedSystemPrompt = `${SYSTEM_PROMPTS[currentPhase as keyof ConversationPhase]}

USER EXPERIENCE LEVEL DETECTED: ${userLevel}
- Adjust your language and questions accordingly
- For beginners: Use simple terms, focus on broad concepts, be extra encouraging
- For intermediate: Bridge existing knowledge to AI concepts
- For advanced: Discuss specific technical paths and career strategy

RECENT CONVERSATION CONTEXT:
${conversationHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')}

Remember to reference their previous responses and build on the conversation naturally. Always consider their stated experience level when framing your response.`;

      // Call OpenAI API with GPT-5 mini
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      // Add timeout for API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

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
              { role: 'system', content: enhancedSystemPrompt },
              ...conversationHistory.slice(-8) // Include more context for better understanding
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

        const aiResponse = data.choices[0].message.content;

        // Save AI response
        await supabase
          .from('conversation_messages')
          .insert({ session_id: sessionId, role: 'assistant', content: aiResponse });

        // Extract user profile data if we have enough information
        if (currentPhase === 'roadmap') {
          await extractAndSaveProfile(conversationHistory, sessionId);
        }

        return new Response(JSON.stringify({ 
          message: aiResponse,
          phase: currentPhase,
          isComplete: currentPhase === 'roadmap'
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

async function extractAndSaveProfile(conversationHistory: any[], sessionId: string) {
  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const extractionPrompt = `Based on this comprehensive conversation, extract the following user profile information and return it as a JSON object:

{
  "name": "extracted name if mentioned",
  "experience_level": "beginner/intermediate/advanced",
  "role_current": "current job title/role",
  "ai_interests": ["array", "of", "specific", "ai", "interests"],
  "learning_goals": ["array", "of", "specific", "learning", "goals"],
  "preferred_learning_style": "hands-on/theoretical/mixed/project-based",
  "available_time_per_week": number_of_hours,
  "career_goals": "detailed description of career goals",
  "technical_background": "comprehensive description of technical background and skills"
}

Be thorough and extract as much relevant information as possible. Use null for missing data.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: extractionPrompt },
          { role: 'user', content: `Full conversation history: ${JSON.stringify(conversationHistory)}` }
        ],
        max_completion_tokens: 500,
      }),
    });

    const data = await response.json();
    const profileData = JSON.parse(data.choices[0].message.content);

    // Create user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .insert(profileData)
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
    console.error('Error extracting profile:', error);
  }
}