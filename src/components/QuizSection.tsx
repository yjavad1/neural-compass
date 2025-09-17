import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ChatMessage {
  type: 'ai' | 'user';
  content: string;
  timestamp: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  aiContext?: string;
  options: { value: string; label: string; description?: string }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: "background",
    question: "Hey there! I'm PathFinder AI, and I'm excited to help you discover your perfect path into AI. Let's start with you - what best describes where you're at right now?",
    aiContext: "Getting to know the user's current situation",
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
    question: "Great choice! Now, let's talk about your AI experience. How familiar are you with artificial intelligence and machine learning? Be totally honest - there's no wrong answer here!",
    aiContext: "Assessing AI/ML knowledge level",
    options: [
      { value: "none", label: "What's machine learning?", description: "I'm completely new to this whole AI world" },
      { value: "basic", label: "I've heard the buzz", description: "I know the terms but haven't tried building anything yet" },
      { value: "some", label: "I've dabbled a bit", description: "I've taken a course or tried some tutorials" },
      { value: "intermediate", label: "I've built some things", description: "I have hands-on experience with AI projects" }
    ]
  },
  {
    id: "programming",
    question: "Perfect! Now I'm curious about your coding background. Programming isn't everything in AI, but it helps me understand your starting point. Where do you stand?",
    aiContext: "Understanding technical foundation",
    options: [
      { value: "none", label: "Code? What code?", description: "I've never written a line of code in my life" },
      { value: "basic", label: "I can make websites look pretty", description: "I know HTML/CSS and maybe some basic scripting" },
      { value: "intermediate", label: "I'm pretty comfortable", description: "I can build things with Python, JavaScript, or similar languages" },
      { value: "advanced", label: "I speak fluent code", description: "I'm experienced with multiple programming languages and frameworks" }
    ]
  },
  {
    id: "goals",
    question: "This is where it gets exciting! What's your dream outcome from this AI journey? What would make you think 'YES, this was totally worth it!'?",
    aiContext: "Identifying primary motivation and end goal",
    options: [
      { value: "job", label: "Land my dream AI job", description: "Get hired at a company doing exciting AI work" },
      { value: "skills", label: "Level up my current role", description: "Add AI superpowers to what I already do" },
      { value: "startup", label: "Build the next big thing", description: "Create an AI startup or product that changes the world" },
      { value: "research", label: "Push the boundaries", description: "Contribute to cutting-edge AI research and innovation" }
    ]
  },
  {
    id: "timeline",
    question: "Almost done! Last question - let's be realistic about time. How many hours per week can you actually dedicate to learning AI? (Don't worry, we'll make every hour count!)",
    aiContext: "Setting realistic expectations for learning pace",
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
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const isLastQuestion = currentQuestion === quizQuestions.length - 1;
  const currentQuestionData = quizQuestions[currentQuestion];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, showOptions]);

  // Show AI question with typing effect
  useEffect(() => {
    if (currentQuestion === 0 && chatHistory.length === 0) {
      // First question - show immediately
      showAIMessage();
    }
  }, []);

  const showAIMessage = () => {
    setIsTyping(true);
    setShowOptions(false);
    
    // Simulate AI typing
    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        type: 'ai',
        content: currentQuestionData.question,
        timestamp: Date.now()
      }]);
      setIsTyping(false);
      
      // Show options after a brief pause
      setTimeout(() => {
        setShowOptions(true);
      }, 500);
    }, 1000 + Math.random() * 1000); // Random typing delay
  };

  const handleAnswer = (value: string) => {
    const selectedOption = currentQuestionData.options.find(opt => opt.value === value);
    if (!selectedOption) return;

    // Add user response to chat
    setChatHistory(prev => [...prev, {
      type: 'user',
      content: selectedOption.label,
      timestamp: Date.now()
    }]);

    const newAnswers = { ...answers, [currentQuestionData.id]: value };
    setAnswers(newAnswers);
    
    if (isLastQuestion) {
      // Add final AI message
      setTimeout(() => {
        setChatHistory(prev => [...prev, {
          type: 'ai',
          content: "Perfect! I've got everything I need. Let me create your personalized AI roadmap...",
          timestamp: Date.now()
        }]);
        
        setTimeout(() => {
          onComplete(newAnswers);
        }, 2000);
      }, 1000);
    } else {
      // Move to next question
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
        showAIMessage();
      }, 1500);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      // Remove last AI question and user response from chat
      setChatHistory(prev => prev.slice(0, -2));
      setCurrentQuestion(currentQuestion - 1);
      setShowOptions(true);
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header with progress */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b p-4 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white"></div>
              </div>
              <span className="font-medium text-sm">PathFinder AI</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {currentQuestion + 1} of {quizQuestions.length}
            </div>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Chat Messages */}
          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`max-w-2xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                {message.type === 'ai' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <span className="text-xs text-muted-foreground">PathFinder AI</span>
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl ${
                    message.type === 'ai'
                      ? 'bg-card border shadow-sm rounded-bl-md'
                      : 'bg-primary text-primary-foreground rounded-br-md ml-12'
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed">{message.content}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-2xl">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <span className="text-xs text-muted-foreground">PathFinder AI is typing...</span>
                </div>
                <div className="bg-card border shadow-sm rounded-2xl rounded-bl-md p-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Answer Options */}
          {showOptions && !isTyping && (
            <div className="space-y-3 animate-fade-in">
              {currentQuestionData.options.map((option, index) => (
                <div
                  key={option.value}
                  className="flex justify-end animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <button
                    onClick={() => handleAnswer(option.value)}
                    className="max-w-sm group bg-card/50 hover:bg-card border hover:border-primary/30 rounded-2xl rounded-br-md p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] text-left"
                  >
                    <div className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {option.description}
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Footer with back button */}
      {currentQuestion > 0 && chatHistory.length > 0 && (
        <div className="border-t bg-background/80 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto flex justify-center">
            <Button 
              variant="ghost" 
              onClick={handlePrevious}
              className="text-muted-foreground hover:text-foreground"
              size="sm"
            >
              ← Go back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};