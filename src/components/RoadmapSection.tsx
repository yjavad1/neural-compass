import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Star, Download, Share } from "lucide-react";
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

interface RoadmapSectionProps {
  roadmapData: RoadmapData;
  onRestart: () => void;
}

export const RoadmapSection = ({ roadmapData, onRestart }: RoadmapSectionProps) => {
  const completedPhases = roadmapData.phases.filter(phase => phase.completed).length;
  const progressPercentage = (completedPhases / roadmapData.phases.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
            Your AI Career Roadmap
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A personalized path to becoming a {roadmapData.role} based on your background and goals.
          </p>
        </div>

        {/* Role Overview */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">
              {roadmapData.role}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <Badge variant="secondary" className="mb-2 text-sm px-4 py-2">
                  Difficulty: {roadmapData.difficulty}
                </Badge>
                <p className="text-sm text-muted-foreground">Based on your background</p>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2 text-sm px-4 py-2">
                  Timeline: {roadmapData.timeline}
                </Badge>
                <p className="text-sm text-muted-foreground">Estimated completion</p>
              </div>
              <div className="text-center">
                <Badge variant="default" className="mb-2 text-sm px-4 py-2">
                  Hiring: {roadmapData.hiringOutlook}
                </Badge>
                <p className="text-sm text-muted-foreground">Market outlook</p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{completedPhases}/{roadmapData.phases.length} phases</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="flex items-center gap-2">
                <Download size={16} />
                Export PDF
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Share size={16} />
                Share Roadmap
              </Button>
              <Button variant="ghost" onClick={onRestart}>
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Learning Phases */}
        <div className="grid gap-6 mb-8">
          {roadmapData.phases.map((phase, index) => (
            <Card 
              key={index} 
              className={`border-l-4 transition-all duration-300 hover:shadow-lg ${
                phase.completed 
                  ? 'border-l-ai-success bg-ai-success/5' 
                  : index === completedPhases 
                    ? 'border-l-ai-primary bg-ai-primary/5' 
                    : 'border-l-muted'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-3">
                    {phase.completed ? (
                      <CheckCircle className="text-ai-success" size={24} />
                    ) : index === completedPhases ? (
                      <Clock className="text-ai-primary" size={24} />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-muted" />
                    )}
                    Phase {index + 1}: {phase.name}
                  </CardTitle>
                  <Badge variant="outline">{phase.duration}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Star size={16} className="text-ai-primary" />
                        Key Skills
                      </h4>
                      <ul className="space-y-2">
                        {phase.skills.map((skill, skillIndex) => (
                          <li key={skillIndex} className="text-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-ai-primary rounded-full" />
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle size={16} className="text-ai-secondary" />
                        Projects & Deliverables
                      </h4>
                      <ul className="space-y-2">
                        {phase.projects.map((project, projectIndex) => (
                          <li key={projectIndex} className="text-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-ai-secondary rounded-full" />
                            {project}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <ResourceCard resources={phase.resources} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Next Steps */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-ai-accent/5 to-ai-primary/5">
          <CardHeader>
            <CardTitle className="text-xl text-center">
              Ready to Start Your AI Journey?
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
              <Button size="lg" className="bg-gradient-to-r from-ai-primary to-ai-secondary text-white font-semibold px-8 py-6">
                Begin Phase 1
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};