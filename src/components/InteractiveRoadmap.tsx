import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Star, Download, Share, Play, MapPin, Flag, Target } from "lucide-react";
import { ResourceCard } from "@/components/ResourceCard";

interface Resource {
  title: string;
  type: 'course' | 'tutorial' | 'practice' | 'community' | 'book' | 'tool';
  provider: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  cost: 'Free' | 'Paid' | 'Freemium';
  rating: number;
  url: string;
  description: string;
}

interface RoadmapData {
  role: string;
  difficulty: string;
  timeline: string;
  hiringOutlook: string;
  phases: {
    name: string;
    duration: string;
    skills: string[];
    projects: string[];
    resources: Resource[];
    completed: boolean;
  }[];
  nextSteps: string[];
}

interface InteractiveRoadmapProps {
  roadmapData: RoadmapData;
  onRestart: () => void;
}

export const InteractiveRoadmap = ({ roadmapData, onRestart }: InteractiveRoadmapProps) => {
  const [completedPhases, setCompletedPhases] = useState(
    roadmapData.phases.map(phase => phase.completed)
  );
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);

  const completedCount = completedPhases.filter(Boolean).length;
  const progressPercentage = (completedCount / roadmapData.phases.length) * 100;

  const togglePhaseCompletion = (index: number) => {
    const newCompletedPhases = [...completedPhases];
    newCompletedPhases[index] = !newCompletedPhases[index];
    setCompletedPhases(newCompletedPhases);
  };

  const getPhaseStatus = (index: number) => {
    if (completedPhases[index]) return 'completed';
    if (index === 0 || completedPhases[index - 1]) return 'current';
    return 'locked';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
            Your AI Career Journey
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Navigate your path to becoming a {roadmapData.role} with this interactive roadmap.
          </p>
          
          {/* Progress Overview */}
          <Card className="max-w-2xl mx-auto border-0 shadow-lg bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="text-ai-primary" size={20} />
                  <span className="font-semibold">Journey Progress</span>
                </div>
                <Badge variant="secondary">{completedCount}/{roadmapData.phases.length} phases</Badge>
              </div>
              <Progress value={progressPercentage} className="h-4 mb-4" />
              <div className="flex justify-center gap-4">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download size={16} />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Share size={16} />
                  Share
                </Button>
                <Button variant="ghost" size="sm" onClick={onRestart}>
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Roadmap Path */}
        <div className="relative">
          {/* SVG Path */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 1200 800" 
              className="absolute top-0 left-0"
              style={{ minHeight: `${roadmapData.phases.length * 300}px` }}
            >
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--ai-primary))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--ai-secondary))" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              {/* Curved path connecting all phases */}
              <path
                d={`M 200 100 Q 400 150 600 200 T 1000 300 Q 800 400 600 500 T 200 600 Q 400 650 600 700`}
                stroke="url(#pathGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray="20,10"
                className="animate-pulse"
              />
            </svg>
          </div>

          {/* Phase Cards positioned along the path */}
          <div className="relative z-10 space-y-8">
            {roadmapData.phases.map((phase, index) => {
              const status = getPhaseStatus(index);
              const isSelected = selectedPhase === index;
              const positionClass = index % 2 === 0 ? 'justify-start' : 'justify-end';
              
              return (
                <div key={index} className={`flex ${positionClass} mb-16`}>
                  <div className={`relative ${index % 2 === 0 ? 'mr-8' : 'ml-8'}`}>
                    {/* Phase Number Circle */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <div 
                        className={`w-16 h-16 rounded-full border-4 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                          status === 'completed' 
                            ? 'bg-ai-success border-ai-success text-white shadow-lg scale-110' 
                            : status === 'current'
                              ? 'bg-ai-primary border-ai-primary text-white shadow-lg animate-pulse'
                              : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                        }`}
                        onClick={() => status !== 'locked' && setSelectedPhase(isSelected ? null : index)}
                      >
                        {status === 'completed' ? (
                          <CheckCircle size={24} />
                        ) : status === 'current' ? (
                          <Play size={20} />
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
                      </div>
                      {index === roadmapData.phases.length - 1 && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                          <Flag className="text-ai-accent" size={32} />
                        </div>
                      )}
                    </div>

                    {/* Phase Card */}
                    <Card 
                      className={`w-80 cursor-pointer transition-all duration-300 hover:shadow-xl ${
                        status === 'completed' 
                          ? 'border-ai-success bg-ai-success/5 shadow-lg' 
                          : status === 'current'
                            ? 'border-ai-primary bg-ai-primary/5 shadow-lg'
                            : status === 'locked'
                              ? 'border-muted bg-muted/20 opacity-60'
                              : 'border-border'
                      } ${isSelected ? 'scale-105 shadow-2xl' : ''}`}
                      onClick={() => status !== 'locked' && setSelectedPhase(isSelected ? null : index)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {status === 'completed' ? (
                              <CheckCircle className="text-ai-success" size={20} />
                            ) : status === 'current' ? (
                              <Clock className="text-ai-primary" size={20} />
                            ) : (
                              <Target className="text-muted-foreground" size={20} />
                            )}
                            {phase.name}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {phase.duration}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-4">
                          {/* Skills Preview */}
                          <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <Star size={14} className="text-ai-primary" />
                              Key Skills
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {phase.skills.slice(0, 3).map((skill, skillIndex) => (
                                <Badge key={skillIndex} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {phase.skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{phase.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          {status !== 'locked' && (
                            <Button
                              size="sm"
                              variant={status === 'completed' ? 'outline' : 'default'}
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePhaseCompletion(index);
                              }}
                            >
                              {status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Phase Details */}
        {selectedPhase !== null && (
          <div className="mt-12 animate-fade-in">
            <Card className="border-0 shadow-2xl bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Target className="text-ai-primary" size={28} />
                  Phase {selectedPhase + 1}: {roadmapData.phases[selectedPhase].name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Star size={18} className="text-ai-primary" />
                        Skills You'll Master
                      </h4>
                      <ul className="space-y-2">
                        {roadmapData.phases[selectedPhase].skills.map((skill, skillIndex) => (
                          <li key={skillIndex} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-ai-primary rounded-full" />
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle size={18} className="text-ai-secondary" />
                        Projects & Deliverables
                      </h4>
                      <ul className="space-y-2">
                        {roadmapData.phases[selectedPhase].projects.map((project, projectIndex) => (
                          <li key={projectIndex} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-ai-secondary rounded-full" />
                            {project}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <ResourceCard resources={roadmapData.phases[selectedPhase].resources} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Next Steps Section */}
        <Card className="mt-12 border-0 shadow-lg bg-gradient-to-r from-ai-accent/5 to-ai-primary/5">
          <CardHeader>
            <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
              <Flag className="text-ai-accent" size={24} />
              Ready to Begin Your Journey?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 mb-6">
              {roadmapData.nextSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <div className="w-8 h-8 bg-ai-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <span className="flex-1">{step}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-ai-primary to-ai-secondary text-white font-semibold px-8 py-6"
                onClick={() => !completedPhases[0] && togglePhaseCompletion(0)}
              >
                {completedPhases[0] ? 'Continue Journey' : 'Start Phase 1'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};