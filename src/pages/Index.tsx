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

// Mock function removed - now using real AI generation

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
      
      {/* Development mode indicator */}
      {process.env.NODE_ENV !== "production" && (
        <div className="fixed bottom-2 right-2 text-xs px-2 py-1 bg-black/60 text-white rounded">
          DEV
        </div>
      )}
    </div>
  );
};

export default Index;
