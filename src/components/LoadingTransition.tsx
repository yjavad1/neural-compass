import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Sparkles, Target, CheckCircle } from 'lucide-react';

interface LoadingTransitionProps {
  onComplete: () => void;
  userName?: string;
}

const loadingSteps = [
  { icon: Brain, text: "Analyzing your profile...", duration: 1500 },
  { icon: Sparkles, text: "Generating personalized roadmap...", duration: 2000 },
  { icon: Target, text: "Optimizing learning path...", duration: 1500 },
  { icon: CheckCircle, text: "Finalizing your journey...", duration: 1000 }
];

export const LoadingTransition: React.FC<LoadingTransitionProps> = ({ 
  onComplete, 
  userName 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let stepTimeout: NodeJS.Timeout;

    const runStep = (stepIndex: number) => {
      if (stepIndex >= loadingSteps.length) {
        setIsComplete(true);
        setTimeout(onComplete, 800);
        return;
      }

      setCurrentStep(stepIndex);
      const step = loadingSteps[stepIndex];
      const stepProgress = (stepIndex / loadingSteps.length) * 100;
      
      // Animate progress for this step
      let currentProgress = stepProgress;
      const targetProgress = ((stepIndex + 1) / loadingSteps.length) * 100;
      const progressIncrement = (targetProgress - stepProgress) / (step.duration / 50);

      progressInterval = setInterval(() => {
        currentProgress += progressIncrement;
        if (currentProgress >= targetProgress) {
          currentProgress = targetProgress;
          clearInterval(progressInterval);
        }
        setProgress(currentProgress);
      }, 50);

      stepTimeout = setTimeout(() => {
        clearInterval(progressInterval);
        runStep(stepIndex + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg border-0 shadow-2xl bg-gradient-to-br from-card/95 to-card/80 backdrop-blur">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Creating Your Roadmap
            </h1>
            {userName && (
              <p className="text-muted-foreground">
                Almost ready, {userName}! Your personalized AI career path is being crafted.
              </p>
            )}
          </div>

          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-3 bg-muted/50" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Generating...</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Current Step */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
              {loadingSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                      ${isActive ? 'bg-primary text-primary-foreground animate-pulse' : 
                        isCompleted ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}
                    `}>
                      <Icon size={20} />
                    </div>
                    {index < loadingSteps.length - 1 && (
                      <div className={`
                        w-8 h-1 rounded transition-all duration-300
                        ${isCompleted ? 'bg-green-500' : 'bg-muted'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current Step Text */}
            <div className="text-center">
              <p className="font-medium text-lg animate-pulse">
                {loadingSteps[currentStep]?.text}
              </p>
            </div>

            {/* Completion Animation */}
            {isComplete && (
              <div className="text-center space-y-2 animate-in fade-in duration-500">
                <CheckCircle className="mx-auto text-green-500" size={48} />
                <p className="text-green-600 font-semibold">Roadmap Ready!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};