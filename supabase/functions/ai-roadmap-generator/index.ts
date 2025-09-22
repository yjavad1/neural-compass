import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://esm.sh/zod@3.22.4';
import { 
  processBackground, 
  processInterests, 
  generateJustification, 
  calculatePersonalizedTimeline,
  generatePersonalizedStrengths 
} from './personalizationUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple validation schemas
const ProjectSchema = z.object({
  title: z.string(),
  size: z.enum(["S", "M", "L"]),
  brief: z.string(),
});

const ResourceSchema = z.object({
  title: z.string(),
  type: z.string(),
  provider: z.string(),
  url: z.string().url(),
  estimatedTime: z.string(),
  cost: z.string(),
  difficulty: z.string(),
  whyRecommended: z.string(),
});

const FinalPhaseSchema = z.object({
  name: z.string(),
  duration: z.string(),
  objective: z.string(),
  skills: z.array(z.string()),
  projects: z.array(ProjectSchema),
  resources: z.array(ResourceSchema),
});

const RoadmapSchema = z.object({
  role: z.string(),
  difficulty: z.string(),
  timeline: z.string(),
  hiringOutlook: z.string(),
  justification: z.object({
    whyThisPath: z.string(),
    strengths: z.array(z.string()),
    alternativePaths: z.array(z.string()),
    whyNotAlternatives: z.string(),
  }),
  salary: z.object({
    entry: z.string(),
    mid: z.string(),
    senior: z.string(),
  }),
  phases: z.array(FinalPhaseSchema),
  nextSteps: z.array(z.string()),
});

// Generate complete roadmap with LLM (with retry logic)
async function generateCompleteRoadmap(personaJson: any, selectedRole: string, openAIApiKey: string): Promise<any> {
  console.log(`🚀 Generating complete roadmap for ${selectedRole} using optimized LLM approach`);
  
  // Streamlined, more focused prompt
  const optimizedPrompt = `Create a personalized ${selectedRole} learning roadmap for this specific user:

BACKGROUND: ${personaJson.background?.join(', ') || 'General'}
CODING: ${personaJson.coding || 'none'} 
GOALS: ${personaJson.goal || 'career change'}
INTERESTS: ${personaJson.interests?.join(', ') || 'AI/ML'}
TIME: ${personaJson.hours_per_week || 10}hrs/week, ${personaJson.timeline_months || 6} months
CONSTRAINTS: ${personaJson.constraints?.join(', ') || 'None'}

CRITICAL REQUIREMENTS:
- Generate 4 phases with realistic timelines  
- Each resource MUST have working URLs to SPECIFIC courses/content
- Include 2-4 resources per phase from real educational platforms

RESOURCE SELECTION APPROACH:
🎯 FOCUS: Describe the learning resource you want, not the URL
✅ SPECIFY: Course title, preferred platform (Coursera/edX/Udemy/Khan Academy), duration, difficulty
🤖 SYSTEM: Will automatically match to verified course URLs from our curated database

PREFERRED PLATFORMS (in order):
1. Coursera - Professional certificates and university courses
2. edX - MIT, Harvard, and other top university content  
3. Udemy - Practical, hands-on bootcamp-style courses
4. Khan Academy - Interactive, beginner-friendly tutorials

RESOURCE DESCRIPTION FORMAT:
Instead of URLs, describe what you want:
- "Machine Learning course from Coursera, 8-10 weeks, beginner-friendly"
- "Python programming tutorial from Khan Academy, interactive, self-paced"
- "Data Science bootcamp from Udemy, practical projects, 20+ hours"

PERSONALIZATION GUIDELINES:
- Use first-person language: "As a [background], you have..." not "your [raw input] background"
- Connect their specific background to the AI role meaningfully
- Explain WHY this path makes sense for THEIR situation specifically
- Be conversational and insightful, not templated

Generate PERSONALIZED content based on their specific background. Return valid JSON only:

{
  "role": "${selectedRole}",
  "difficulty": "PERSONALIZED_DIFFICULTY",
  "timeline": "BASED_ON_THEIR_HOURS_AND_TIMELINE",
  "hiringOutlook": "CURRENT_MARKET_OUTLOOK",
  "justification": {
    "whyThisPath": "As a [background], you bring [specific skills/insights]. This AI path leverages [how their background helps] while [what they'll gain]. Your interest in [interests] aligns perfectly because [specific connection].",
    "strengths": ["Specific strength from their background", "Another relevant strength", "Third meaningful strength"],
    "alternativePaths": ["Alternative path 1", "Alternative path 2"],
    "whyNotAlternatives": "While these are good options, your specific combination of [background] and [interests] makes this path more direct because [specific reason]."
  },
  "salary": {
    "entry": "$X,000 - $Y,000",
    "mid": "$X,000 - $Y,000", 
    "senior": "$X,000 - $Y,000"
  },
  "phases": [
    {
      "name": "Foundations & Core",
      "duration": "X weeks",
      "objective": "SPECIFIC_TO_THEIR_LEVEL",
      "skills": ["SKILL_1", "SKILL_2", "SKILL_3", "SKILL_4"],
      "projects": [{"title": "PROJECT_FOR_THEIR_INTERESTS", "size": "S", "brief": "WHAT_THEYLL_BUILD"}],
      "resources": [
        {"title": "Machine Learning Crash Course", "type": "course", "provider": "Google", "url": "https://developers.google.com/machine-learning/crash-course", "estimatedTime": "15 hours", "cost": "Free", "difficulty": "Beginner", "whyRecommended": "Google's free ML course with TensorFlow"},
        {"title": "Introduction to Python for Data Science", "type": "course", "provider": "Coursera", "url": "https://www.coursera.org/learn/python-data-analysis", "estimatedTime": "25 hours", "cost": "Free", "difficulty": "Beginner", "whyRecommended": "Essential Python skills for AI development"}
      ]
    },
    {
      "name": "Specialization Deep-Dive",
      "duration": "X weeks",
      "objective": "INTERMEDIATE_GOAL",
      "skills": ["ADV_SKILL_1", "ADV_SKILL_2", "ADV_SKILL_3"],
      "projects": [{"title": "INTERMEDIATE_PROJECT", "size": "M", "brief": "DESCRIPTION"}],
      "resources": [{"title": "Deep Learning Specialization", "type": "course", "provider": "Coursera", "url": "https://www.coursera.org/specializations/deep-learning", "estimatedTime": "120 hours", "cost": "Paid", "difficulty": "Intermediate", "whyRecommended": "Comprehensive deep learning by Andrew Ng"}]
    },
    {
      "name": "Practical Application",
      "duration": "X weeks",
      "objective": "PORTFOLIO_BUILDING",
      "skills": ["PRACTICAL_1", "PRACTICAL_2", "PRACTICAL_3"],
      "projects": [{"title": "PORTFOLIO_PROJECT", "size": "L", "brief": "SUBSTANTIAL_PROJECT"}],
      "resources": [{"title": "Kaggle Learn", "type": "tutorial", "provider": "Kaggle", "url": "https://www.kaggle.com/learn", "estimatedTime": "40 hours", "cost": "Free", "difficulty": "Intermediate", "whyRecommended": "Hands-on data science competitions and projects"}]
    },
    {
      "name": "Advanced & Research",
      "duration": "X weeks",
      "objective": "ADVANCED_EXPERTISE",
      "skills": ["EXPERT_1", "EXPERT_2", "EXPERT_3"],
      "projects": [{"title": "CAPSTONE_PROJECT", "size": "L", "brief": "COMPLEX_PROJECT"}],
      "resources": [{"title": "Papers With Code", "type": "tutorial", "provider": "Papers With Code", "url": "https://paperswithcode.com/", "estimatedTime": "Self-paced", "cost": "Free", "difficulty": "Advanced", "whyRecommended": "Latest AI research with implementation code"}]
    }
  ],
  "nextSteps": ["ACTION_1", "ACTION_2", "ACTION_3"]
}`;

  // Retry logic with different models
  const models = ["gpt-4o", "gpt-4o-mini"];
  
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      console.log(`⏰ Starting LLM generation attempt ${attempt + 1}...`);
      const startTime = Date.now();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // Increased to 35 seconds
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: models[attempt], // Try different models
          max_tokens: 2500, // Increased for complete responses
          temperature: 0.2, // Lower for more consistent output
          messages: [
            { role: "system", content: "You are an expert AI career advisor. Return only valid JSON with personalized content based on the user's specific background and constraints." },
            { role: "user", content: optimizedPrompt }
          ],
        }),
      });
      
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ LLM call completed in ${duration}ms with ${models[attempt]}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      console.log(`📝 Generated roadmap content (${content.length} chars)`);
      
      // Clean and parse JSON
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const roadmap = JSON.parse(cleanContent);
      
      // Validate structure
      const validatedRoadmap = RoadmapSchema.parse(roadmap);
      
      console.log(`✅ Successfully generated and validated personalized roadmap for ${selectedRole}`);
      
      return validatedRoadmap;
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt + 1} failed:`, error);
      
      if (attempt === 1) { // Last attempt
        console.error(`❌ All attempts failed. Falling back to dynamic fallback`);
        return generateDynamicFallback(selectedRole, personaJson);
      }
    }
  }
}

// Enhanced fallback that's more personalized
function generateDynamicFallback(selectedRole: string, personaJson: any): any {
  console.log(`🚨 Generating dynamic personalized fallback for ${selectedRole}`);
  
  try {
    const codingLevel = personaJson.coding || 'none';
    
    // Personalize difficulty based on actual background
    let difficulty = 'Beginner';
    const background = personaJson.background?.[0]?.toLowerCase() || '';
    if (codingLevel === 'advanced' || background.includes('computer science') || background.includes('engineering')) {
      difficulty = 'Advanced';
    } else if (codingLevel === 'some' || codingLevel === 'intermediate') {
      difficulty = 'Intermediate';
    }
    
    // Use the new personalization utilities
    const timeline = calculatePersonalizedTimeline(personaJson);
    const justification = generateJustification(personaJson, selectedRole);
  
  return {
    role: selectedRole,
    difficulty: difficulty,
    timeline: timeline,
    hiringOutlook: 'Strong demand in AI field with growing opportunities',
    justification: justification,
    salary: {
      entry: '$75,000 - $95,000',
      mid: '$95,000 - $130,000',
      senior: '$130,000 - $180,000'
    },
    phases: [
      {
        name: 'Foundations & Core',
        duration: `${Math.ceil(parseInt(timeline.split('-')[0]) * 0.3)} weeks`,
        objective: codingLevel === 'none' ? 'Build programming fundamentals and AI basics' : 'Strengthen AI foundations building on existing skills',
        skills: codingLevel === 'none' ? 
          ['Python Programming', 'AI Fundamentals', 'Data Analysis', 'Basic ML'] :
          ['Advanced Python', 'AI Theory', 'Machine Learning', 'Data Science'],
        projects: [
          {
            title: interests.includes('NLP') ? 'Text Analysis Tool' : 
                   interests.includes('Computer Vision') ? 'Image Recognition App' : 
                   'AI-Powered Recommendation System',
            size: 'S',
            brief: `Build a ${interests.toLowerCase()}-focused project that demonstrates core AI concepts`
          }
        ],
        resources: [
          {
            title: codingLevel === 'none' ? 'Python for Everybody' : 'Advanced Python for Data Science',
            type: 'Course',
            provider: 'Coursera',
            url: 'https://coursera.org/specializations/python',
            estimatedTime: codingLevel === 'none' ? '50 hours' : '30 hours',
            cost: 'Free',
            difficulty: difficulty,
            whyRecommended: `Tailored to your ${codingLevel} coding level and ${background} background`
          }
        ]
      },
      {
        name: 'Specialization Deep-Dive',
        duration: `${Math.ceil(parseInt(timeline.split('-')[0]) * 0.35)} weeks`,
        objective: `Develop specialized ${selectedRole} skills aligned with your interests`,
        skills: ['Deep Learning', 'Neural Networks', interests.includes('NLP') ? 'Natural Language Processing' : 'Computer Vision', 'Model Training'],
        projects: [
          {
            title: `${interests} Specialization Project`,
            size: 'M',
            brief: `Create an advanced application in your area of interest: ${interests}`
          }
        ],
        resources: [
          {
            title: 'Deep Learning Specialization',
            type: 'Course',
            provider: 'Coursera',
            url: 'https://coursera.org/specializations/deep-learning',
            estimatedTime: '80 hours',
            cost: 'Paid',
            difficulty: 'Intermediate',
            whyRecommended: `Perfect progression from your ${difficulty.toLowerCase()} foundation, focuses on practical applications`
          }
        ]
      },
      {
        name: 'Practical Application',
        duration: `${Math.ceil(parseInt(timeline.split('-')[0]) * 0.25)} weeks`,
        objective: 'Build portfolio demonstrating real-world AI applications',
        skills: ['Model Deployment', 'API Development', 'Cloud Platforms', 'Portfolio Building'],
        projects: [
          {
            title: `End-to-End ${selectedRole} Application`,
            size: 'L',
            brief: 'Deploy a complete AI solution that showcases your specialized skills for potential employers'
          }
        ],
        resources: [
          {
            title: 'MLOps and Model Deployment',
            type: 'Course',
            provider: 'AWS/Google Cloud',
            url: 'https://cloud.google.com/training',
            estimatedTime: '40 hours',
            cost: 'Free tier available',
            difficulty: 'Intermediate',
            whyRecommended: 'Essential for demonstrating production-ready skills to employers'
          }
        ]
      },
      {
        name: 'Advanced & Research',
        duration: `${Math.ceil(parseInt(timeline.split('-')[0]) * 0.1)} weeks`,
        objective: 'Stay current with cutting-edge developments in AI',
        skills: ['Research Methods', 'Latest AI Trends', 'Continuous Learning', 'Professional Networking'],
        projects: [
          {
            title: 'Cutting-Edge Research Implementation',
            size: 'L',
            brief: 'Implement and improve upon recent research in your specialization area'
          }
        ],
        resources: [
          {
            title: 'Papers With Code',
            type: 'Platform',
            provider: 'Papers With Code',
            url: 'https://paperswithcode.com',
            estimatedTime: 'Ongoing',
            cost: 'Free',
            difficulty: 'Advanced',
            whyRecommended: 'Keep up with latest research and implementations in your field'
          }
        ]
      }
    ],
    nextSteps: [
      codingLevel === 'none' ? 'Start with Python programming basics immediately' : 'Review and strengthen your existing Python skills',
      `Set up your development environment for AI applications`,
      `Join ${selectedRole} communities and start networking`,
      `Begin your first project this week`
    ]
  };
  } catch (error) {
    console.error('Error in generateDynamicFallback:', error);
    return generateFallbackRoadmap(selectedRole, personaJson);
  }
}

// Legacy fallback - kept for compatibility
function generateFallbackRoadmap(selectedRole: string, personaJson: any): any {
  console.log(`🚨 Generating simple fallback roadmap for ${selectedRole}`);
  
  const baseTimeline = personaJson.timeline_months || 6;
  const hours = personaJson.hours_per_week || 10;
  
  return {
    role: selectedRole,
    difficulty: personaJson.coding === 'none' ? 'Beginner' : 'Intermediate',
    timeline: `${baseTimeline}-${baseTimeline + 2} months`,
    hiringOutlook: 'Strong demand in AI field',
    justification: {
      whyThisPath: `This path aligns with your background and goals in AI technology.`,
      strengths: ['Strong learning motivation', 'Clear goals', 'Dedicated time commitment'],
      alternativePaths: ['Data Science', 'Machine Learning Engineering'],
      whyNotAlternatives: 'This path offers the most direct route to your stated interests.'
    },
    salary: {
      entry: '$70,000 - $90,000',
      mid: '$90,000 - $120,000',
      senior: '$120,000 - $160,000'
    },
    phases: [
      {
        name: 'Foundations & Core',
        duration: `${Math.ceil(baseTimeline * 0.3)} weeks`,
        objective: 'Build fundamental AI and programming skills',
        skills: ['Python Programming', 'AI Basics', 'Data Analysis', 'Prompt Engineering'],
        projects: [
          {
            title: 'AI Chatbot Project',
            size: 'S',
            brief: 'Build a simple AI-powered chatbot using OpenAI API'
          }
        ],
        resources: [
          {
            title: 'Python for Everybody Specialization',
            type: 'Course',
            provider: 'Coursera',
            url: 'https://coursera.org/specializations/python',
            estimatedTime: '40 hours',
            cost: 'Free',
            difficulty: 'Beginner',
            whyRecommended: 'Comprehensive Python foundation perfect for AI development'
          },
          {
            title: 'Introduction to Artificial Intelligence',
            type: 'Course',
            provider: 'edX',
            url: 'https://edx.org/course/artificial-intelligence',
            estimatedTime: '30 hours',
            cost: 'Free',
            difficulty: 'Beginner',
            whyRecommended: 'Solid theoretical foundation in AI concepts'
          }
        ]
      },
      {
        name: 'Specialization Deep-Dive',
        duration: `${Math.ceil(baseTimeline * 0.35)} weeks`,
        objective: 'Develop specialized AI skills',
        skills: ['Machine Learning', 'Neural Networks', 'NLP', 'Computer Vision'],
        projects: [
          {
            title: 'Image Classification App',
            size: 'M',
            brief: 'Create an app that classifies images using deep learning'
          }
        ],
        resources: [
          {
            title: 'Machine Learning Specialization',
            type: 'Course',
            provider: 'Coursera',
            url: 'https://coursera.org/specializations/machine-learning-introduction',
            estimatedTime: '60 hours',
            cost: 'Paid',
            difficulty: 'Intermediate',
            whyRecommended: 'Andrew Ng\'s comprehensive ML course, industry standard'
          }
        ]
      },
      {
        name: 'Practical Application',
        duration: `${Math.ceil(baseTimeline * 0.25)} weeks`,
        objective: 'Build portfolio projects and real-world applications',
        skills: ['Project Development', 'Model Deployment', 'API Integration', 'Portfolio Building'],
        projects: [
          {
            title: 'End-to-End AI Application',
            size: 'L',
            brief: 'Deploy a complete AI application with frontend and backend'
          }
        ],
        resources: [
          {
            title: 'Full Stack Deep Learning',
            type: 'Course',
            provider: 'UC Berkeley',
            url: 'https://fullstackdeeplearning.com',
            estimatedTime: '50 hours',
            cost: 'Free',
            difficulty: 'Intermediate',
            whyRecommended: 'Practical focus on deploying ML models to production'
          }
        ]
      },
      {
        name: 'Advanced & Research',
        duration: `${Math.ceil(baseTimeline * 0.1)} weeks`,
        objective: 'Stay current with latest AI developments',
        skills: ['Research Skills', 'Advanced Techniques', 'Industry Trends', 'Continuous Learning'],
        projects: [
          {
            title: 'Research Implementation',
            size: 'L',
            brief: 'Implement and improve upon a recent AI research paper'
          }
        ],
        resources: [
          {
            title: 'Papers With Code',
            type: 'Platform',
            provider: 'Papers With Code',
            url: 'https://paperswithcode.com',
            estimatedTime: 'Ongoing',
            cost: 'Free',
            difficulty: 'Advanced',
            whyRecommended: 'Stay current with latest AI research and implementations'
          }
        ]
      }
    ],
    nextSteps: [
      'Start with Python programming fundamentals',
      'Set up development environment with necessary AI tools',
      'Join AI communities and follow industry news',
      'Begin working on your first AI project'
    ]
  };
}

// Main function that orchestrates the entire roadmap generation
async function generateRoadmap(personaJson: any, selectedRole: string): Promise<any> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log(`🎯 Starting simplified roadmap generation for ${selectedRole}`);
  console.log(`👤 User level: ${personaJson.coding || 'none'}, Timeline: ${personaJson.timeline_months || 6} months`);

  try {
    // Generate complete roadmap with single LLM call
    const roadmap = await generateCompleteRoadmap(personaJson, selectedRole, openAIApiKey);
    
    console.log(`✅ Successfully generated personalized roadmap`);
    return roadmap;
    
  } catch (error) {
    console.error(`❌ Roadmap generation failed:`, error);
    
    // Use dynamic fallback
    console.log(`🔄 Using enhanced fallback roadmap generation`);
    return generateDynamicFallback(selectedRole, personaJson);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Backward-compatible payload parsing
    const personaJson = requestBody.personaJson || requestBody.profileData || requestBody.persona;
    const selectedRole = requestBody.selectedRole || requestBody.role;
    
    if (!personaJson || !selectedRole) {
      throw new Error('Missing required fields: personaJson and selectedRole');
    }
    
    console.log("🚀 Starting LLM-first roadmap generation");
    console.log("Role:", selectedRole);
    console.log("Persona:", JSON.stringify(personaJson, null, 2));

    // Generate the roadmap using simplified approach
    const roadmap = await generateRoadmap(personaJson, selectedRole);

    return new Response(JSON.stringify(roadmap), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("❌ Error in ai-roadmap-generator:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate roadmap',
        fallback: true 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});