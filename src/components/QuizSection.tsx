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
    question: "Let's start with you! What best describes where you're at right now?",
    options: [
      { value: "student", label: "I'm a student", description: "Currently studying or just finished university" },
      { value: "developer", label: "I'm already coding", description: "I have programming experience and want to add AI to my toolkit" },
      { value: "analyst", label: "I work with data", description: "I analyze data or make business decisions based on insights" },
      { value: "professional", label: "I'm in a different field", description: "I work outside tech but want to transition into AI" },
      { value: "entrepreneur", label: "I'm building something", description: "I have ideas for AI products or want to start an AI business" }
    ]
  },
  {
    id: "experience",
    question: "How familiar are you with AI and machine learning? Be honest - we're here to help! 😊",
    options: [
      { value: "none", label: "What's machine learning?", description: "I'm completely new to this whole AI world" },
      { value: "basic", label: "I've heard the buzz", description: "I know the terms but haven't tried building anything yet" },
      { value: "some", label: "I've dabbled a bit", description: "I've taken a course or tried some tutorials" },
      { value: "intermediate", label: "I've built some things", description: "I have hands-on experience with AI projects" }
    ]
  },
  {
    id: "programming",
    question: "Now, let's talk coding. Where do you stand with programming?",
    options: [
      { value: "none", label: "Code? What code?", description: "I've never written a line of code in my life" },
      { value: "basic", label: "I can make websites look pretty", description: "I know HTML/CSS and maybe some basic scripting" },
      { value: "intermediate", label: "I'm pretty comfortable", description: "I can build things with Python, JavaScript, or similar languages" },
      { value: "advanced", label: "I speak fluent code", description: "I'm experienced with multiple programming languages and frameworks" }
    ]
  },
  {
    id: "goals",
    question: "What's your dream outcome? What would make this journey totally worth it?",
    options: [
      { value: "job", label: "Land my dream AI job", description: "Get hired at a company doing exciting AI work" },
      { value: "skills", label: "Level up my current role", description: "Add AI superpowers to what I already do" },
      { value: "startup", label: "Build the next big thing", description: "Create an AI startup or product that changes the world" },
      { value: "research", label: "Push the boundaries", description: "Contribute to cutting-edge AI research and innovation" }
    ]
  },
  {
    id: "timeline",
    question: "Last question! How much time can you realistically dedicate to this each week?",
    options: [
      { value: "1-5", label: "Just the weekends", description: "1-5 hours - I'm pretty busy but committed" },
      { value: "6-15", label: "Evenings + weekends", description: "6-15 hours - I can make this a serious hobby" },
      { value: "16-30", label: "This is my priority", description: "16-30 hours - I'm ready to make significant progress" },
      { value: "30+", label: "All in!", description: "30+ hours - I'm treating this like a full-time commitment" }
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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress indicator */}
        <div className="mb-8 text-center">
          <div className="text-sm text-muted-foreground mb-3">
            {currentQuestion + 1} of {quizQuestions.length} questions
          </div>
          <Progress value={progress} className="h-1 bg-muted/50" />
        </div>

        {/* Question bubble - chat style */}
        <div className="animate-fade-in mb-8">
          <div className="bg-card border rounded-3xl rounded-bl-md p-6 shadow-lg max-w-2xl mx-auto relative">
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-card border-l border-b rotate-45 rounded-bl-sm"></div>
            <h2 className="text-xl md:text-2xl font-medium leading-relaxed text-foreground">
              {currentQuestionData.question}
            </h2>
          </div>
        </div>

        {/* Answer options - response style */}
        <div className="space-y-3 animate-fade-in">
          <RadioGroup
            value={answers[currentQuestionData.id] || ""}
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {currentQuestionData.options.map((option, index) => (
              <div
                key={option.value}
                className="group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className="flex items-start space-x-4 p-5 rounded-2xl border-2 border-muted hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 cursor-pointer group-hover:shadow-md group-hover:scale-[1.02] bg-card/50 backdrop-blur-sm"
                  onClick={() => handleAnswer(option.value)}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value}
                    className="mt-1 transition-colors duration-200"
                  />
                  <div className="flex-1 min-w-0">
                    <Label 
                      htmlFor={option.value}
                      className="text-base font-medium cursor-pointer group-hover:text-primary transition-colors duration-200 block mb-1"
                    >
                      {option.label}
                    </Label>
                    {option.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        {/* Navigation */}
        {currentQuestion > 0 && (
          <div className="flex justify-center mt-8 animate-fade-in">
            <Button 
              variant="ghost" 
              onClick={handlePrevious}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Go back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};