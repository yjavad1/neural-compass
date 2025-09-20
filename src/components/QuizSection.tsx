import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ChipSelect } from "@/components/ui/chip-select";
import { MultiSelectChips } from "@/components/ui/multi-select-chips";

interface ChatMessage {
  type: 'ai' | 'user';
  content: string;
  timestamp: number;
  questionIndex?: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'text' | 'chips' | 'slider' | 'multi-select';
  options?: { value: string; label: string; description?: string }[];
  allowOther?: boolean;
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    unit: string;
  };
  maxSelections?: number;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: "name",
    question: "Hey! I'm Pathfinder 👋 What should I call you?",
    type: "text"
  },
  {
    id: "background",
    question: "Nice to meet you, {{name}}! Tell me a little about yourself.",
    type: "chips",
    allowOther: true,
    options: [
      { value: "student", label: "I studied business", description: "Business, finance, or economics background" },
      { value: "developer", label: "I work in software", description: "Programming or tech experience" },
      { value: "exploring", label: "I'm a student exploring AI", description: "Currently studying and curious about AI" },
      { value: "researcher", label: "I'm into research", description: "Academic or scientific background" },
      { value: "creative", label: "I'm in creative fields", description: "Design, marketing, content creation" }
    ]
  },
  {
    id: "goal",
    question: "What's your main goal with AI right now?",
    type: "chips",
    options: [
      { value: "job", label: "Get a job", description: "Land an AI role at a company" },
      { value: "startup", label: "Build a startup", description: "Create an AI-powered business" },
      { value: "knowledge", label: "Learn for knowledge", description: "Understand AI for personal growth" },
      { value: "skills", label: "Enhance current role", description: "Add AI to my existing work" }
    ]
  },
  {
    id: "coding",
    question: "How comfortable are you with coding?",
    type: "chips",
    options: [
      { value: "none", label: "None", description: "Never written code before" },
      { value: "basic", label: "Basic Python", description: "Some programming experience" },
      { value: "comfortable", label: "Comfortable", description: "Can build things with code" },
      { value: "expert", label: "I'm a code wizard 🧙‍♂️", description: "Very experienced programmer" }
    ]
  },
  {
    id: "math",
    question: "And how do you feel about math & statistics?",
    type: "chips",
    options: [
      { value: "low", label: "Low", description: "Math makes me nervous 😅" },
      { value: "medium", label: "Medium", description: "I can handle basic stats" },
      { value: "high", label: "High", description: "Bring on the calculus! 📊" },
      { value: "love", label: "I dream in equations 🤓", description: "Math is my happy place" }
    ]
  },
  {
    id: "time",
    question: "How many hours a week can you put into learning AI?",
    type: "slider",
    sliderConfig: {
      min: 1,
      max: 25,
      step: 1,
      unit: "hrs"
    }
  },
  {
    id: "interests",
    question: "Which areas of AI excite you most?",
    type: "multi-select",
    maxSelections: 4,
    allowOther: true,
    options: [
      { value: "nlp", label: "NLP", description: "Language and text processing" },
      { value: "vision", label: "Computer Vision", description: "Image and video analysis" },
      { value: "agents", label: "Agents", description: "Autonomous AI systems" },
      { value: "analytics", label: "Analytics", description: "Data science and insights" },
      { value: "product", label: "AI Product", description: "Building AI-powered products" },
      { value: "ethics", label: "Ethics", description: "Responsible AI development" },
      { value: "robotics", label: "Robotics", description: "Physical AI systems" },
      { value: "gaming", label: "Gaming AI", description: "AI for games and simulations" }
    ]
  },
  {
    id: "constraints",
    question: "Anything I should factor in?",
    type: "multi-select",
    maxSelections: 3,
    options: [
      { value: "budget", label: "Budget sensitive", description: "Need affordable options" },
      { value: "hardware", label: "Limited hardware", description: "Don't have powerful computers" },
      { value: "urgent", label: "Urgent timeline", description: "Need results ASAP" },
      { value: "remote", label: "Remote only", description: "Can only work remotely" },
      { value: "none", label: "None", description: "I'm flexible!" }
    ]
  },
  {
    id: "timeline",
    question: "When do you want to see results?",
    type: "chips",
    options: [
      { value: "3months", label: "3 months", description: "Quick wins and fast progress" },
      { value: "6months", label: "6 months", description: "Solid foundation building" },
      { value: "9months", label: "9 months", description: "Comprehensive skill development" },
      { value: "12months", label: "12 months", description: "Deep expertise and mastery" },
      { value: "longer", label: "I'm in no rush 🐌", description: "Long-term learning journey" }
    ]
  }
];

interface QuizSectionProps {
  onComplete: (answers: Record<string, any>) => void;
}

export const QuizSection = ({ onComplete }: QuizSectionProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const isLastQuestion = currentQuestion === quizQuestions.length - 1;
  const currentQuestionData = quizQuestions[currentQuestion];
  const userName = answers.name || "";

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, showInput]);

  // Show AI question whenever currentQuestion changes and it's not already shown
  useEffect(() => {
    const hasAiForThis = chatHistory.some(
      (m) => m.type === 'ai' && m.questionIndex === currentQuestion
    );
    if (!hasAiForThis) {
      showAIMessageFor(currentQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  const showAIMessageFor = (qIndex: number) => {
    const q = quizQuestions[qIndex];
    setIsTyping(true);
    setShowInput(false);

    console.debug('[Quiz] Showing AI message for question', qIndex, q.id);

    // Replace {{name}} placeholder with actual name
    const questionText = q.question.replace('{{name}}', userName || 'there');

    // Simulate AI typing
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          type: 'ai',
          content: questionText,
          timestamp: Date.now(),
          questionIndex: qIndex,
        },
      ]);
      setIsTyping(false);

      // Show input after a brief pause
      setTimeout(() => {
        setShowInput(true);
      }, 500);
    }, 1000 + Math.random() * 1000); // Random typing delay
  };

  const handleAnswer = (value: any) => {
    // Hide input while transitioning
    setShowInput(false);

    // Format display value based on question type
    let displayValue = value;
    if (currentQuestionData.type === 'chips' && currentQuestionData.options) {
      const selectedOption = currentQuestionData.options.find(opt => opt.value === value);
      displayValue = selectedOption?.label || value;
    } else if (currentQuestionData.type === 'slider') {
      displayValue = `${value} ${currentQuestionData.sliderConfig?.unit || ''}`;
    } else if (currentQuestionData.type === 'multi-select' && Array.isArray(value)) {
      if (currentQuestionData.options) {
        displayValue = value.map(v => {
          const option = currentQuestionData.options!.find(opt => opt.value === v);
          return option?.label || v;
        }).join(', ');
      } else {
        displayValue = value.join(', ');
      }
    }

    // Add user response to chat
    setChatHistory(prev => [
      ...prev,
      {
        type: 'user',
        content: displayValue,
        timestamp: Date.now(),
        questionIndex: currentQuestion,
      },
    ]);

    const newAnswers = { ...answers, [currentQuestionData.id]: value };
    setAnswers(newAnswers);
    console.debug('[Quiz] Answered', { questionIndex: currentQuestion, questionId: currentQuestionData.id, value });
    
    if (isLastQuestion) {
      // Add final AI message
      setTimeout(() => {
        setChatHistory(prev => [
          ...prev,
          {
            type: 'ai',
            content: `Great, ${userName}! I'll map some AI roles and learning paths for you. Ready?`,
            timestamp: Date.now(),
            questionIndex: currentQuestion,
          },
        ]);
        
        setTimeout(() => {
          onComplete(newAnswers);
        }, 2000);
      }, 1000);
    } else {
      // Move to next question
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
      }, 1500);
    }
  };

  const handlePrevious = () => {
    if (isTyping) return;
    if (currentQuestion > 0) {
      const newIndex = currentQuestion - 1;

      // Keep all messages before the previous question,
      // and for the previous question keep only the AI prompt (remove the user's answer)
      setChatHistory(prev =>
        prev.filter(m => {
          const qi = m.questionIndex ?? -1;
          return qi < newIndex || (qi === newIndex && m.type === 'ai');
        })
      );

      // Remove the stored answer for the previous question so the user can change it
      setAnswers(prev => {
        const copy = { ...prev };
        const qId = quizQuestions[newIndex].id;
        delete copy[qId];
        return copy;
      });

      setCurrentQuestion(newIndex);
      setIsTyping(false);
      setShowInput(true);
      console.debug('[Quiz] Went back to question', newIndex);
    }
  };

  const renderInputComponent = () => {
    const currentValue = answers[currentQuestionData.id];

    switch (currentQuestionData.type) {
      case 'text':
        return (
          <div className="max-w-md mx-auto">
            <Input
              placeholder="Enter your name..."
              value={currentValue || ''}
              onChange={(e) => {
                const newAnswers = { ...answers, [currentQuestionData.id]: e.target.value };
                setAnswers(newAnswers);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && currentValue?.trim()) {
                  handleAnswer(currentValue.trim());
                }
              }}
              className="text-center"
              autoFocus
            />
            {currentValue?.trim() && (
              <Button 
                onClick={() => handleAnswer(currentValue.trim())} 
                className="w-full mt-3"
              >
                Continue
              </Button>
            )}
          </div>
        );

      case 'chips':
        return (
          <ChipSelect
            options={currentQuestionData.options || []}
            value={currentValue}
            onChange={handleAnswer}
            allowOther={currentQuestionData.allowOther}
          />
        );

      case 'slider':
        const sliderValue = currentValue !== undefined ? [currentValue] : [currentQuestionData.sliderConfig?.min || 1];
        return (
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">
                {sliderValue[0]} {currentQuestionData.sliderConfig?.unit || ''}
              </span>
            </div>
            <Slider
              value={sliderValue}
              onValueChange={([value]) => {
                const newAnswers = { ...answers, [currentQuestionData.id]: value };
                setAnswers(newAnswers);
              }}
              min={currentQuestionData.sliderConfig?.min || 1}
              max={currentQuestionData.sliderConfig?.max || 25}
              step={currentQuestionData.sliderConfig?.step || 1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{currentQuestionData.sliderConfig?.min || 1}</span>
              <span>{currentQuestionData.sliderConfig?.max || 25}</span>
            </div>
            <Button 
              onClick={() => handleAnswer(sliderValue[0])} 
              className="w-full"
            >
              Continue
            </Button>
          </div>
        );

      case 'multi-select':
        return (
          <div className="space-y-4">
            <MultiSelectChips
              options={currentQuestionData.options || []}
              value={currentValue || []}
              onChange={(value) => {
                const newAnswers = { ...answers, [currentQuestionData.id]: value };
                setAnswers(newAnswers);
              }}
              allowOther={currentQuestionData.allowOther}
              maxSelections={currentQuestionData.maxSelections}
            />
            {(currentValue?.length > 0) && (
              <div className="flex justify-center">
                <Button onClick={() => handleAnswer(currentValue)}>
                  Continue
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
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

          {/* Input Component */}
          {showInput && !isTyping && (
            <div className="animate-fade-in">
              {renderInputComponent()}
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