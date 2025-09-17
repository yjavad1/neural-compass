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

const SYSTEM_PROMPTS: ConversationPhase = {
  discovery: `You are an AI career advisor specializing in helping people enter the AI field. You're having a friendly, natural conversation to understand their background, interests, and goals.

Your goal in this phase is to:
- Learn about their current experience level and background
- Understand their specific interests in AI (ML, NLP, computer vision, robotics, etc.)
- Discover their career goals and motivations
- Assess their technical background and learning preferences
- Find out how much time they can dedicate to learning
- Understand their current situation (student, working professional, career changer)

Ask ONE thoughtful follow-up question at a time. Be conversational, encouraging, and reference their previous answers to show you're listening. Avoid sounding like a rigid questionnaire.

Keep responses concise (2-3 sentences max) and always end with a specific, contextual question that builds on what they've shared.`,

  clarification: `You are continuing the conversation to clarify and deepen understanding of the person's AI career interests.

Based on the conversation history, you should:
- Reference specific details they've mentioned previously
- Ask targeted follow-up questions to clarify ambiguous responses
- Dig deeper into their specific AI interests and career goals
- Understand their learning style, timeline, and constraints better
- Explore potential challenges, concerns, or obstacles they foresee
- Clarify their ideal work environment and career outcomes

Be empathetic, supportive, and show you remember what they've shared. Ask ONE specific question at a time that demonstrates contextual understanding.`,

  roadmap: `You are creating a comprehensive, personalized AI learning roadmap based on all the information gathered in the conversation.

Generate a detailed, actionable roadmap that includes:
- A clear, step-by-step learning path tailored to their background and goals
- Specific online courses, resources, and tools they should use
- Realistic timeline based on their available time and current skill level
- Practical projects they can work on to build their portfolio
- Key skills they need to develop in order of priority
- Industry insights and career progression pathways
- Immediate next steps they should take this week

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
      
      // Enhanced phase transition logic
      if (currentPhase === 'discovery' && messageCount >= 3) {
        const backgroundCovered = userMessages.some(m => 
          m.content.toLowerCase().includes('experience') || 
          m.content.toLowerCase().includes('background') ||
          m.content.toLowerCase().includes('work')
        );
        const interestsCovered = userMessages.some(m => 
          m.content.toLowerCase().includes('ai') || 
          m.content.toLowerCase().includes('machine learning') ||
          m.content.toLowerCase().includes('data')
        );
        
        if (backgroundCovered && interestsCovered) {
          currentPhase = 'clarification';
        }
      } else if (currentPhase === 'clarification' && messageCount >= 6) {
        currentPhase = 'roadmap';
      }

      // Update session phase if changed
      if (currentPhase !== session?.phase) {
        await supabase
          .from('conversation_sessions')
          .update({ phase: currentPhase })
          .eq('id', sessionId);
      }

      // Enhanced context-aware system prompt
      const enhancedSystemPrompt = `${SYSTEM_PROMPTS[currentPhase as keyof ConversationPhase]}

CONVERSATION CONTEXT:
${conversationHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')}

Remember to reference their previous responses and build on the conversation naturally.`;

      // Call OpenAI API with GPT-5 mini
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }

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
      });

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