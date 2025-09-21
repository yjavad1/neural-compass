import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { QuizSection } from "@/components/QuizSection";
import { RoleSelectionSection } from "@/components/RoleSelectionSection";
import { InteractiveRoadmap } from "@/components/InteractiveRoadmap";
import { EnhancedRoadmapSection } from "@/components/EnhancedRoadmapSection";
import { LoadingTransition } from "@/components/LoadingTransition";
import { ResourceCatalogTest } from "@/components/ResourceCatalogTest";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AppState = "hero" | "quiz" | "role-selection" | "loading" | "roadmap";
type LoadingState = "role-analysis" | "roadmap-generation" | null;

// Build compact persona JSON from quiz answers
const buildPersonaJson = (answers: Record<string, any>) => {
  console.log('Building persona from answers:', answers);
  
  return {
    name: answers.name || "User",
    background: answers.background ? [answers.background] : ["General"],
    coding: answers.coding || "none",
    math: answers.math || "low", 
    goal: answers.goal || "learning",
    interests: Array.isArray(answers.interests) ? answers.interests : ["AI"],
    hours_per_week: parseInt(answers.time) || 5,
    constraints: Array.isArray(answers.constraints) ? answers.constraints : [],
    timeline_months: parseInt(answers.timeline?.replace(/\D/g, '')) || 6
  };
};

// Mock AI-generated roadmap data with resources
const generateRoadmap = (answers: Record<string, string>) => {
  // This would be replaced with actual AI generation
  const roleMap: Record<string, string> = {
    "student": "AI Research Assistant",
    "developer": "Machine Learning Engineer", 
    "analyst": "AI Product Manager",
    "professional": "AI Solutions Consultant",
    "entrepreneur": "AI Startup Founder"
  };

  const role = roleMap[answers.background] || "AI Specialist";
  
  return {
    role,
    difficulty: answers.programming === "none" ? "Beginner" : answers.programming === "advanced" ? "Intermediate" : "Beginner-Intermediate",
    timeline: answers.timeline === "30+" ? "12-16 weeks" : answers.timeline === "16-30" ? "16-20 weeks" : "20-24 weeks",
    hiringOutlook: "High Demand",
    phases: [
      {
        name: "AI Foundations",
        duration: "4-6 weeks",
        skills: ["AI/ML Fundamentals", "Python Basics", "Data Science Concepts", "Statistics & Probability"],
        projects: ["AI Ethics Report", "Simple Data Analysis", "Basic Python Scripts"],
        resources: [
          {
            title: "Elements of AI",
            type: "course" as const,
            provider: "University of Helsinki",
            duration: "6 weeks",
            difficulty: "Beginner" as const,
            cost: "Free" as const,
            rating: 4.8,
            url: "https://elementsofai.com",
            description: "A comprehensive introduction to AI concepts and ethics, perfect for beginners."
          },
          {
            title: "Python for Everybody",
            type: "course" as const,
            provider: "Coursera",
            duration: "8 weeks",
            difficulty: "Beginner" as const,
            cost: "Freemium" as const,
            rating: 4.7,
            url: "https://coursera.org/specializations/python",
            description: "Learn Python programming from scratch with hands-on projects."
          },
          {
            title: "Kaggle Learn",
            type: "practice" as const,
            provider: "Kaggle",
            duration: "Self-paced",
            difficulty: "Beginner" as const,
            cost: "Free" as const,
            rating: 4.6,
            url: "https://kaggle.com/learn",
            description: "Free micro-courses on Python, pandas, and data visualization."
          }
        ],
        completed: false
      },
      {
        name: "Core Skills Development", 
        duration: "6-8 weeks",
        skills: ["Machine Learning Algorithms", "Deep Learning Basics", "TensorFlow/PyTorch", "Data Preprocessing"],
        projects: ["Image Classification Model", "Predictive Analytics Dashboard", "ML Pipeline Development"],
        resources: [
          {
            title: "Machine Learning Course",
            type: "course" as const,
            provider: "Stanford/Coursera",
            duration: "11 weeks",
            difficulty: "Intermediate" as const,
            cost: "Freemium" as const,
            rating: 4.9,
            url: "https://coursera.org/learn/machine-learning",
            description: "Andrew Ng's comprehensive ML course covering algorithms and implementation."
          },
          {
            title: "Deep Learning Specialization",
            type: "course" as const,
            provider: "deeplearning.ai",
            duration: "16 weeks",
            difficulty: "Intermediate" as const,
            cost: "Paid" as const,
            rating: 4.8,
            url: "https://coursera.org/specializations/deep-learning",
            description: "Master deep learning and neural networks with practical projects."
          },
          {
            title: "TensorFlow Developer Certificate",
            type: "tutorial" as const,
            provider: "TensorFlow",
            duration: "4 weeks",
            difficulty: "Intermediate" as const,
            cost: "Free" as const,
            rating: 4.5,
            url: "https://tensorflow.org/certificate",
            description: "Official TensorFlow certification program with hands-on practice."
          }
        ],
        completed: false
      },
      {
        name: "Specialization & Practice",
        duration: "4-6 weeks", 
        skills: ["Advanced ML Techniques", "MLOps", "Model Deployment", "Industry Applications"],
        projects: ["End-to-End ML Project", "Model API Development", "Production Deployment"],
        resources: [
          {
            title: "MLOps Specialization",
            type: "course" as const,
            provider: "DeepLearning.AI",
            duration: "12 weeks",
            difficulty: "Advanced" as const,
            cost: "Paid" as const,
            rating: 4.7,
            url: "https://coursera.org/specializations/machine-learning-engineering-for-production-mlops",
            description: "Learn to deploy and maintain ML systems in production environments."
          },
          {
            title: "Docker for ML",
            type: "tutorial" as const,
            provider: "Docker",
            duration: "2 weeks",
            difficulty: "Intermediate" as const,
            cost: "Free" as const,
            rating: 4.4,
            url: "https://docker.com/get-started",
            description: "Container technology essential for ML deployment and scaling."
          },
          {
            title: "MLflow Documentation",
            type: "tool" as const,
            provider: "MLflow",
            duration: "Self-paced",
            difficulty: "Intermediate" as const,
            cost: "Free" as const,
            rating: 4.3,
            url: "https://mlflow.org/docs",
            description: "Open source platform for managing ML lifecycle and experiments."
          }
        ],
        completed: false
      },
      {
        name: "Portfolio & Launch",
        duration: "4-6 weeks",
        skills: ["Portfolio Development", "Technical Communication", "Networking", "Job Search Strategy"],
        projects: ["GitHub Portfolio", "Technical Blog Posts", "Interview Preparation", "Capstone Project"],
        resources: [
          {
            title: "Building ML Portfolios",
            type: "tutorial" as const,
            provider: "Towards Data Science",
            duration: "1 week",
            difficulty: "Beginner" as const,
            cost: "Free" as const,
            rating: 4.5,
            url: "https://towardsdatascience.com",
            description: "Complete guide to building an impressive ML portfolio on GitHub."
          },
          {
            title: "ML Interview Preparation",
            type: "book" as const,
            provider: "O'Reilly",
            duration: "3 weeks",
            difficulty: "Intermediate" as const,
            cost: "Paid" as const,
            rating: 4.6,
            url: "https://oreilly.com/library",
            description: "Comprehensive guide covering technical and behavioral ML interviews."
          },
          {
            title: "r/MachineLearning",
            type: "community" as const,
            provider: "Reddit",
            duration: "Ongoing",
            difficulty: "Beginner" as const,
            cost: "Free" as const,
            rating: 4.2,
            url: "https://reddit.com/r/MachineLearning",
            description: "Active community for ML discussions, papers, and career advice."
          }
        ],
        completed: false
      }
    ],
    nextSteps: [
      "Set up your development environment (Python, Jupyter, Git)",
      "Complete the 'Elements of AI' free course by University of Helsinki",
      "Join AI communities (Reddit r/MachineLearning, Discord servers)",
      "Start your first project: Build a simple recommendation system",
      "Document your learning journey on LinkedIn or a personal blog"
    ]
  };
};

const Index = () => {
  const { toast } = useToast();
  const [appState, setAppState] = useState<AppState>("hero");
  const [loadingState, setLoadingState] = useState<LoadingState>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [personaJson, setPersonaJson] = useState<any>(null);
  const [roleOptions, setRoleOptions] = useState<any>(null);

  const handleStartQuiz = () => {
    setAppState("quiz");
  };

  const handleQuizComplete = async (answers: Record<string, string>) => {
    console.log('🎯 Quiz completed, processing answers:', answers);
    const persona = buildPersonaJson(answers);
    console.log('📝 Built persona:', persona);
    setPersonaJson(persona);
    setUserName(persona.name);
    
    // Set processing state to prevent navigation issues
    setIsProcessing(true);
    setLoadingState("role-analysis");
    setAppState("loading");
    
    try {
      console.log('🚀 Calling ai-role-classifier...');
      
      // Step 1: Get role recommendations
      const { data: roleData, error: roleError } = await supabase.functions.invoke('ai-role-classifier', {
        body: { personaJson: persona }
      });

      console.log('📥 Role classifier response:', { data: roleData, error: roleError });

      if (roleError) {
        console.error('❌ Role classification error:', roleError);
        throw new Error(`Role classification failed: ${roleError.message}`);
      }

      if (!roleData || !roleData.recommendations) {
        console.error('❌ Invalid role data received:', roleData);
        throw new Error('Invalid role classification response');
      }

      console.log('✅ Role classification successful, proceeding to role selection');
      setRoleOptions(roleData.recommendations);
      setIsProcessing(false);
      setLoadingState(null);
      setAppState("role-selection");
    } catch (error) {
      console.error('❌ Error in quiz completion:', error);
      setIsProcessing(false);
      setLoadingState(null);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze your profile. Please try again.",
        variant: "destructive",
      });
      setAppState("quiz");
    }
  };

  const handleRoleSelection = async (selectedRole: string) => {
    console.log('🎯 Role selected:', selectedRole);
    console.log('👤 Using persona:', personaJson);
    
    // Set processing state to prevent navigation issues
    setIsProcessing(true);
    setLoadingState("roadmap-generation");
    setAppState("loading");
    
    try {
      console.log('🚀 Calling ai-roadmap-generator...');
      
      // Step 2: Generate roadmap for selected role
      const { data: roadmapData, error: roadmapError } = await supabase.functions.invoke('ai-roadmap-generator', {
        body: { 
          personaJson,
          selectedRole 
        }
      });

      console.log('📥 Roadmap generator response:', { data: roadmapData, error: roadmapError });

      if (roadmapError) {
        console.error('❌ Roadmap generation error:', roadmapError);
        throw new Error(`Roadmap generation failed: ${roadmapError.message}`);
      }

      if (!roadmapData || !roadmapData.roadmap) {
        console.error('❌ Invalid roadmap data received:', roadmapData);
        throw new Error('Invalid roadmap response');
      }

      console.log('✅ AI Roadmap generation successful!');
      setRoadmapData(roadmapData.roadmap);
      setIsProcessing(false);
      setLoadingState(null);
      setAppState("roadmap");
    } catch (error) {
      console.error('❌ Error generating roadmap:', error);
      setIsProcessing(false);
      setLoadingState(null);
      toast({
        title: "Generation Failed",
        description: "Failed to generate your roadmap. Please try again.",
        variant: "destructive",
      });
      setAppState("role-selection");
    }
  };

  const handleLoadingComplete = () => {
    // Only allow completion if not currently processing
    if (!isProcessing) {
      setAppState("roadmap");
    }
  };

  const handleRestart = () => {
    setAppState("hero");
    setLoadingState(null);
    setIsProcessing(false);
    setRoadmapData(null);
    setSessionId('');
    setUserName('');
    setPersonaJson(null);
    setRoleOptions(null);
  };

  if (appState === "quiz") {
    return <QuizSection onComplete={handleQuizComplete} />;
  }

  if (appState === "role-selection") {
    return (
      <RoleSelectionSection
        userName={userName}
        roleOptions={roleOptions || []}
        onSelectRole={handleRoleSelection}
        onBack={() => setAppState("quiz")}
      />
    );
  }

  if (appState === "loading") {
    return (
      <LoadingTransition 
        onComplete={handleLoadingComplete} 
        userName={userName}
        loadingState={loadingState}
        isProcessing={isProcessing}
      />
    );
  }

  if (appState === "roadmap" && roadmapData) {
    // Use enhanced roadmap if it has the new structure, otherwise use the original
    return roadmapData.justification ? (
      <EnhancedRoadmapSection 
        roadmapData={roadmapData} 
        onRestart={handleRestart}
        sessionId={sessionId}
        userName={userName}
      />
    ) : (
      <InteractiveRoadmap roadmapData={roadmapData} onRestart={handleRestart} />
    );
  }

  // Prevent fallback to hero during processing
  if (isProcessing) {
    return (
      <LoadingTransition 
        onComplete={handleLoadingComplete} 
        userName={userName}
        loadingState={loadingState}
        isProcessing={isProcessing}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <HeroSection onStartQuiz={handleStartQuiz} />
      
      {/* Testing Component - Remove in production */}
      <div className="p-4">
        <ResourceCatalogTest />
      </div>
    </div>
  );
};

export default Index;
