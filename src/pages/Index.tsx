import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { QuizSection } from "@/components/QuizSection";
import { RoadmapSection } from "@/components/RoadmapSection";

type AppState = "hero" | "quiz" | "roadmap";

// Mock AI-generated roadmap data
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
        completed: false
      },
      {
        name: "Core Skills Development", 
        duration: "6-8 weeks",
        skills: ["Machine Learning Algorithms", "Deep Learning Basics", "TensorFlow/PyTorch", "Data Preprocessing"],
        projects: ["Image Classification Model", "Predictive Analytics Dashboard", "ML Pipeline Development"],
        completed: false
      },
      {
        name: "Specialization & Practice",
        duration: "4-6 weeks", 
        skills: ["Advanced ML Techniques", "MLOps", "Model Deployment", "Industry Applications"],
        projects: ["End-to-End ML Project", "Model API Development", "Production Deployment"],
        completed: false
      },
      {
        name: "Portfolio & Launch",
        duration: "4-6 weeks",
        skills: ["Portfolio Development", "Technical Communication", "Networking", "Job Search Strategy"],
        projects: ["GitHub Portfolio", "Technical Blog Posts", "Interview Preparation", "Capstone Project"],
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
  const [appState, setAppState] = useState<AppState>("hero");
  const [roadmapData, setRoadmapData] = useState<any>(null);

  const handleStartQuiz = () => {
    setAppState("quiz");
  };

  const handleQuizComplete = (answers: Record<string, string>) => {
    const generatedRoadmap = generateRoadmap(answers);
    setRoadmapData(generatedRoadmap);
    setAppState("roadmap");
  };

  const handleRestart = () => {
    setAppState("hero");
    setRoadmapData(null);
  };

  if (appState === "quiz") {
    return <QuizSection onComplete={handleQuizComplete} />;
  }

  if (appState === "roadmap" && roadmapData) {
    return <RoadmapSection roadmapData={roadmapData} onRestart={handleRestart} />;
  }

  return <HeroSection onStartQuiz={handleStartQuiz} />;
};

export default Index;
