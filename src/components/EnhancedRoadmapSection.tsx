import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Clock, 
  Star, 
  Download, 
  Share, 
  DollarSign,
  Target,
  Lightbulb,
  BookOpen,
  Code,
  Award,
  ExternalLink
} from "lucide-react";

interface Resource {
  title: string;
  type: 'course' | 'tutorial' | 'book' | 'tool' | 'certification';
  provider: string;
  url: string;
  estimatedTime: string;
  cost: 'Free' | 'Paid' | 'Freemium';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  whyRecommended: string;
}

interface Project {
  title: string;
  description: string;
  keySkills: string[];
  portfolioValue: string;
}

interface Phase {
  name: string;
  duration: string;
  objective: string;
  skills: string[];
  projects: Project[];
  resources: Resource[];
  completed?: boolean;
}

interface Justification {
  whyThisPath: string;
  strengths: string[];
  alternativePaths: string[];
  whyNotAlternatives: string;
}

interface Salary {
  entry: string;
  mid: string;
  senior: string;
}

interface EnhancedRoadmapData {
  role: string;
  difficulty: string;
  timeline: string;
  hiringOutlook: string;
  justification: Justification;
  salary: Salary;
  phases: Phase[];
  nextSteps: string[];
}

interface EnhancedRoadmapSectionProps {
  roadmapData: EnhancedRoadmapData;
  onRestart: () => void;
}

export const EnhancedRoadmapSection: React.FC<EnhancedRoadmapSectionProps> = ({ 
  roadmapData, 
  onRestart 
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const completedPhases = roadmapData.phases.filter(phase => phase.completed).length;
  const progressPercentage = (completedPhases / roadmapData.phases.length) * 100;

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen size={16} />;
      case 'tutorial': return <Code size={16} />;
      case 'certification': return <Award size={16} />;
      default: return <Star size={16} />;
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'Free': return 'bg-green-100 text-green-800';
      case 'Paid': return 'bg-blue-100 text-blue-800';
      case 'Freemium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Your Personalized AI Career Roadmap
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A data-driven path to becoming a {roadmapData.role}, tailored specifically for your background and goals.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="justification">Why This Path?</TabsTrigger>
            <TabsTrigger value="learning-path">Learning Path</TabsTrigger>
            <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl text-center flex items-center justify-center gap-3">
                  <Target className="text-primary" />
                  {roadmapData.role}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-2 text-sm px-4 py-2">
                      {roadmapData.difficulty}
                    </Badge>
                    <p className="text-sm text-muted-foreground">Difficulty Level</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="mb-2 text-sm px-4 py-2">
                      {roadmapData.timeline}
                    </Badge>
                    <p className="text-sm text-muted-foreground">Timeline</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="default" className="mb-2 text-sm px-4 py-2">
                      {roadmapData.hiringOutlook}
                    </Badge>
                    <p className="text-sm text-muted-foreground">Market Outlook</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="default" className="mb-2 text-sm px-4 py-2 bg-green-100 text-green-800">
                      {roadmapData.phases.length} Phases
                    </Badge>
                    <p className="text-sm text-muted-foreground">Learning Phases</p>
                  </div>
                </div>
                
                {/* Salary Information */}
                <div className="mb-6 p-4 bg-background/50 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="text-primary" size={20} />
                    Expected Salary Range
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Entry Level</p>
                      <p className="font-semibold">{roadmapData.salary.entry}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mid Level</p>
                      <p className="font-semibold">{roadmapData.salary.mid}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Senior Level</p>
                      <p className="font-semibold">{roadmapData.salary.senior}</p>
                    </div>
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
                    Create New Roadmap
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Justification Tab */}
          <TabsContent value="justification" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="text-primary" />
                  Why This Career Path is Perfect for You
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Personalized Analysis</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {roadmapData.justification.whyThisPath}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Your Key Strengths</h3>
                  <div className="grid gap-2">
                    {roadmapData.justification.strengths.map((strength, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <CheckCircle className="text-green-600" size={16} />
                        <span className="text-green-800">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Alternative Paths Considered</h3>
                  <div className="grid gap-2 mb-3">
                    {roadmapData.justification.alternativePaths.map((alt, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <Target size={16} className="text-muted-foreground" />
                        <span>{alt}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Why your chosen path is optimal:</strong> {roadmapData.justification.whyNotAlternatives}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Path Tab */}
          <TabsContent value="learning-path" className="space-y-6">
            {roadmapData.phases.map((phase, index) => (
              <Card 
                key={index} 
                className={`border-l-4 transition-all duration-300 hover:shadow-lg ${
                  phase.completed 
                    ? 'border-l-green-500 bg-green-50/50' 
                    : index === completedPhases 
                      ? 'border-l-primary bg-primary/5' 
                      : 'border-l-muted'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-3">
                      {phase.completed ? (
                        <CheckCircle className="text-green-500" size={24} />
                      ) : index === completedPhases ? (
                        <Clock className="text-primary" size={24} />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-muted" />
                      )}
                      Phase {index + 1}: {phase.name}
                    </CardTitle>
                    <Badge variant="outline">{phase.duration}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-2">{phase.objective}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {/* Skills */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Star size={16} className="text-primary" />
                          Key Skills ({phase.skills.length})
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {phase.skills.map((skill, skillIndex) => (
                            <div key={skillIndex} className="text-sm flex items-center gap-2 p-2 bg-primary/5 rounded">
                              <div className="w-2 h-2 bg-primary rounded-full" />
                              {skill}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Projects */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Code size={16} className="text-secondary" />
                          Portfolio Projects
                        </h4>
                        <div className="space-y-3">
                          {phase.projects.map((project, projectIndex) => (
                            <div key={projectIndex} className="p-3 bg-secondary/5 rounded-lg">
                              <h5 className="font-medium mb-1">{project.title}</h5>
                              <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {project.keySkills.map((skill, skillIdx) => (
                                  <Badge key={skillIdx} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-xs text-green-600 font-medium">{project.portfolioValue}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Resources */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BookOpen size={16} className="text-purple-600" />
                        Curated Resources ({phase.resources.length})
                      </h4>
                      <div className="space-y-3">
                        {phase.resources.map((resource, resourceIndex) => (
                          <div key={resourceIndex} className="p-3 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getResourceIcon(resource.type)}
                                <h5 className="font-medium">{resource.title}</h5>
                              </div>
                              <ExternalLink size={14} className="text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{resource.provider}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              <Badge variant="outline" className="text-xs">{resource.difficulty}</Badge>
                              <Badge className={`text-xs ${getCostColor(resource.cost)}`}>
                                {resource.cost}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">{resource.estimatedTime}</Badge>
                            </div>
                            <p className="text-xs text-blue-600">{resource.whyRecommended}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Next Steps Tab */}
          <TabsContent value="next-steps" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
                  <Target className="text-primary" />
                  Your Immediate Action Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 mb-6">
                  {roadmapData.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-background/80 border border-primary/20">
                      <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <span className="flex-1 font-medium">{step}</span>
                      <CheckCircle className="text-muted-foreground" size={20} />
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-secondary text-white font-semibold px-8 py-6">
                    Start Phase 1: {roadmapData.phases[0]?.name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};