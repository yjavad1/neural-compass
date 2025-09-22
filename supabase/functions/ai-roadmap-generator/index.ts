import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://esm.sh/zod@3.22.4';

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

// Generate complete roadmap with LLM
async function generateCompleteRoadmap(personaJson: any, selectedRole: string, openAIApiKey: string): Promise<any> {
  console.log(`🚀 Generating complete roadmap for ${selectedRole} using LLM-first approach`);
  
  const detailedPrompt = `You are an expert AI career advisor creating a personalized learning roadmap.

USER PERSONA:
${JSON.stringify(personaJson, null, 2)}

SELECTED CAREER PATH: ${selectedRole}

Create a comprehensive, personalized roadmap that addresses this specific person's background, goals, and constraints.

ANALYZE THE PERSONA:
- Background: ${personaJson.background?.join(', ') || 'Not specified'}
- Coding Experience: ${personaJson.coding || 'none'}
- Math Background: ${personaJson.math || 'low'}
- Primary Goal: ${personaJson.goal || 'skills'}
- Interests: ${personaJson.interests?.join(', ') || 'Not specified'}
- Available Hours/Week: ${personaJson.hours_per_week || 10}
- Timeline Preference: ${personaJson.timeline_months || 6} months
- Constraints: ${personaJson.constraints?.join(', ') || 'None'}

Return this EXACT JSON format (no markdown, no backticks):

{
  "role": "${selectedRole}",
  "difficulty": "[Beginner/Intermediate/Advanced based on their background]",
  "timeline": "[X-Y months based on their timeline preference and hours]",
  "hiringOutlook": "[Current market outlook for this role]",
  "justification": {
    "whyThisPath": "[Personalized explanation based on their background and goals]",
    "strengths": ["[strength1 from their background]", "[strength2]", "[strength3]"],
    "alternativePaths": ["[alternative career 1]", "[alternative career 2]"],
    "whyNotAlternatives": "[Why this path is better for them specifically]"
  },
  "salary": {
    "entry": "$XX,000 - $XX,000",
    "mid": "$XX,000 - $XX,000", 
    "senior": "$XX,000 - $XX,000"
  },
  "phases": [
    {
      "name": "Foundations & Core",
      "duration": "[X weeks]",
      "objective": "[Specific objective for this person]",
      "skills": ["[skill1]", "[skill2]", "[skill3]", "[skill4]"],
      "projects": [
        {
          "title": "[Project name relevant to their interests]",
          "size": "S",
          "brief": "[What they'll build and why it's useful]"
        }
      ],
      "resources": [
        {
          "title": "[Actual course/resource name]",
          "type": "Course",
          "provider": "[Real provider like Coursera, Udemy, etc.]",
          "url": "https://example.com",
          "estimatedTime": "[X hours]",
          "cost": "Free/Paid",
          "difficulty": "Beginner",
          "whyRecommended": "[Personalized reason based on their background]"
        },
        {
          "title": "[Another resource]",
          "type": "Tutorial",
          "provider": "[Provider]",
          "url": "https://example.com",
          "estimatedTime": "[X hours]",
          "cost": "Free",
          "difficulty": "Beginner",
          "whyRecommended": "[Why this fits their learning style/constraints]"
        }
      ]
    },
    {
      "name": "Specialization Deep-Dive",
      "duration": "[X weeks]",
      "objective": "[Specific objective]",
      "skills": ["[skill1]", "[skill2]", "[skill3]"],
      "projects": [
        {
          "title": "[Project related to their interests]",
          "size": "M",
          "brief": "[Description]"
        }
      ],
      "resources": [
        {
          "title": "[Relevant advanced course]",
          "type": "Course",
          "provider": "[Provider]",
          "url": "https://example.com",
          "estimatedTime": "[X hours]",
          "cost": "Paid",
          "difficulty": "Intermediate",
          "whyRecommended": "[Personalized reasoning]"
        }
      ]
    },
    {
      "name": "Practical Application",
      "duration": "[X weeks]",
      "objective": "[Portfolio building objective]",
      "skills": ["[skill1]", "[skill2]", "[skill3]"],
      "projects": [
        {
          "title": "[Substantial project for portfolio]",
          "size": "L",
          "brief": "[What they'll build for their portfolio]"
        }
      ],
      "resources": [
        {
          "title": "[Practical resource/tutorial]",
          "type": "Tutorial",
          "provider": "[Provider]",
          "url": "https://example.com",
          "estimatedTime": "[X hours]",
          "cost": "Free",
          "difficulty": "Intermediate",
          "whyRecommended": "[Why this helps with practical skills]"
        }
      ]
    },
    {
      "name": "Advanced & Research",
      "duration": "[X weeks]",
      "objective": "[Advanced learning objective]",
      "skills": ["[skill1]", "[skill2]", "[skill3]"],
      "projects": [
        {
          "title": "[Advanced capstone project]",
          "size": "L",
          "brief": "[Complex project description]"
        }
      ],
      "resources": [
        {
          "title": "[Advanced resource/paper]",
          "type": "Research",
          "provider": "[Provider/Journal]",
          "url": "https://example.com",
          "estimatedTime": "[X hours]",
          "cost": "Free",
          "difficulty": "Advanced",
          "whyRecommended": "[Why this advances their expertise]"
        }
      ]
    }
  ],
  "nextSteps": [
    "[Immediate action item 1]",
    "[Action item 2]",
    "[Action item 3]"
  ]
}

CRITICAL REQUIREMENTS:
1. Make it HIGHLY PERSONALIZED based on their specific background and constraints
2. Use REAL learning resources (courses, books, tutorials) that actually exist
3. Consider their budget constraints if mentioned
4. Adjust difficulty based on their coding/math background
5. Make project suggestions relevant to their stated interests
6. Provide specific, actionable next steps
7. Give realistic timeline estimates based on their available hours`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini", // Use faster model
        max_tokens: 2500, // Reduced token limit
        temperature: 0.3,
        messages: [
          { role: "user", content: detailedPrompt }
        ],
      }),
    });
    
    clearTimeout(timeoutId);

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
    
    // Parse and validate the JSON response
    const roadmap = JSON.parse(content);
    
    // Basic validation
    const validatedRoadmap = RoadmapSchema.parse(roadmap);
    
    console.log(`✅ Successfully generated and validated complete roadmap for ${selectedRole}`);
    
    return validatedRoadmap;
    
  } catch (error) {
    console.error(`❌ Failed to generate complete roadmap:`, error);
    
    // Simple fallback roadmap
    return generateFallbackRoadmap(selectedRole, personaJson);
  }
}

// Simple fallback roadmap generator
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
    
    // Use simple fallback
    console.log(`🔄 Using fallback roadmap generation`);
    return generateFallbackRoadmap(selectedRole, personaJson);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { personaJson, selectedRole } = await req.json();
    
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