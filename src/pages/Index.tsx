import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import ConversationSection from "@/components/ConversationSection";
import { InteractiveRoadmap } from "@/components/InteractiveRoadmap";

type AppState = "hero" | "quiz" | "roadmap";

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
    return <ConversationSection onComplete={handleQuizComplete} />;
  }

  if (appState === "roadmap" && roadmapData) {
    return <InteractiveRoadmap roadmapData={roadmapData} onRestart={handleRestart} />;
  }

  return <HeroSection onStartQuiz={handleStartQuiz} />;
};

export default Index;
