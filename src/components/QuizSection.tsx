import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface QuizQuestion {
  id: string;
  question: string;
  options: { value: string; label: string; description?: string }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: "background",
    question: "What's your current background?",
    options: [
      { value: "student", label: "Student", description: "Currently in university or recently graduated" },
      { value: "developer", label: "Software Developer", description: "Experience in programming and development" },
      { value: "analyst", label: "Data/Business Analyst", description: "Working with data and analytics" },
      { value: "professional", label: "Other Professional", description: "Non-tech professional looking to transition" },
      { value: "entrepreneur", label: "Entrepreneur", description: "Building or wanting to build AI-driven products" }
    ]
  },
  {
    id: "experience",
    question: "What's your experience with AI/ML?",
    options: [
      { value: "none", label: "Complete Beginner", description: "No prior AI/ML experience" },
      { value: "basic", label: "Basic Knowledge", description: "Familiar with concepts but no hands-on experience" },
      { value: "some", label: "Some Experience", description: "Completed courses or small projects" },
      { value: "intermediate", label: "Intermediate", description: "Built projects and understand fundamentals" }
    ]
  },
  {
    id: "programming",
    question: "How comfortable are you with programming?",
    options: [
      { value: "none", label: "No Programming Experience" },
      { value: "basic", label: "Basic (HTML/CSS, simple scripts)" },
      { value: "intermediate", label: "Intermediate (Python, JavaScript, etc.)" },
      { value: "advanced", label: "Advanced (Multiple languages, frameworks)" }
    ]
  },
  {
    id: "goals",
    question: "What's your primary goal?",
    options: [
      { value: "job", label: "Get an AI Job", description: "Land a role at a company" },
      { value: "skills", label: "Build AI Skills", description: "Enhance current role with AI capabilities" },
      { value: "startup", label: "Start AI Business", description: "Launch AI-powered product or service" },
      { value: "research", label: "AI Research", description: "Contribute to AI research and development" }
    ]
  },
  {
    id: "timeline",
    question: "How much time can you dedicate weekly?",
    options: [
      { value: "1-5", label: "1-5 hours/week", description: "Learning alongside full-time commitments" },
      { value: "6-15", label: "6-15 hours/week", description: "Serious learning with some flexibility" },
      { value: "16-30", label: "16-30 hours/week", description: "Intensive learning or career transition" },
      { value: "30+", label: "30+ hours/week", description: "Full-time commitment to learning" }
    ]
  }
];

interface QuizSectionProps {
  onComplete: (answers: Record<string, string>) => void;
}

export const QuizSection = ({ onComplete }: QuizSectionProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const isLastQuestion = currentQuestion === quizQuestions.length - 1;
  const currentQuestionData = quizQuestions[currentQuestion];

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestionData.id]: value };
    setAnswers(newAnswers);
    
    if (isLastQuestion) {
      onComplete(newAnswers);
    } else {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">
              Question {currentQuestion + 1} of {quizQuestions.length}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            {currentQuestionData.question}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <RadioGroup
            value={answers[currentQuestionData.id] || ""}
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {currentQuestionData.options.map((option) => (
              <div
                key={option.value}
                className="flex items-start space-x-3 p-4 rounded-lg border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer group"
                onClick={() => handleAnswer(option.value)}
              >
                <RadioGroupItem 
                  value={option.value} 
                  id={option.value}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={option.value}
                    className="text-base font-medium cursor-pointer group-hover:text-primary transition-colors"
                  >
                    {option.label}
                  </Label>
                  {option.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>
          
          {currentQuestion > 0 && (
            <div className="flex justify-start">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                className="mt-4"
              >
                Previous
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};