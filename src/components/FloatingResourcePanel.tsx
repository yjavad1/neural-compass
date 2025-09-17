import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  PlayCircle, 
  Code, 
  Users, 
  Wrench, 
  GraduationCap,
  ExternalLink,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  Bookmark,
  Filter,
  ArrowRight
} from "lucide-react";

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

interface FloatingResourcePanelProps {
  resources: Resource[];
  phaseName: string;
  phaseIndex: number;
  isVisible: boolean;
}

const getResourceIcon = (type: Resource['type']) => {
  const icons = {
    course: GraduationCap,
    tutorial: PlayCircle,
    practice: Code,
    community: Users,
    book: BookOpen,
    tool: Wrench
  };
  return icons[type] || BookOpen;
};

const getCostColor = (cost: Resource['cost']) => {
  switch (cost) {
    case 'Free': return 'text-green-700 bg-green-50 border-green-200';
    case 'Paid': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'Freemium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    default: return 'text-muted-foreground bg-muted border-border';
  }
};

const getDifficultyColor = (difficulty: Resource['difficulty']) => {
  switch (difficulty) {
    case 'Beginner': return 'text-green-700 bg-green-50 border-green-200';
    case 'Intermediate': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'Advanced': return 'text-red-700 bg-red-50 border-red-200';
    default: return 'text-muted-foreground bg-muted border-border';
  }
};

export const FloatingResourcePanel = ({ 
  resources, 
  phaseName, 
  phaseIndex, 
  isVisible 
}: FloatingResourcePanelProps) => {
  const [completedResources, setCompletedResources] = useState<Set<string>>(new Set());
  const [bookmarkedResources, setBookmarkedResources] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const toggleResourceCompletion = (resourceTitle: string) => {
    const newCompleted = new Set(completedResources);
    if (newCompleted.has(resourceTitle)) {
      newCompleted.delete(resourceTitle);
    } else {
      newCompleted.add(resourceTitle);
    }
    setCompletedResources(newCompleted);
  };

  const toggleResourceBookmark = (resourceTitle: string) => {
    const newBookmarked = new Set(bookmarkedResources);
    if (newBookmarked.has(resourceTitle)) {
      newBookmarked.delete(resourceTitle);
    } else {
      newBookmarked.add(resourceTitle);
    }
    setBookmarkedResources(newBookmarked);
  };

  const filteredResources = resources.filter(resource => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'bookmarked') return bookmarkedResources.has(resource.title);
    if (activeFilter === 'completed') return completedResources.has(resource.title);
    if (activeFilter === 'recommended') return resource.rating >= 4.5;
    return resource.type === activeFilter;
  });

  const completedCount = resources.filter(r => completedResources.has(r.title)).length;
  const progressPercentage = (completedCount / resources.length) * 100;

  const resourceTypes = [...new Set(resources.map(r => r.type))];

  if (!isVisible || resources.length === 0) {
    return (
      <div className="hidden lg:block fixed right-6 top-1/2 transform -translate-y-1/2 w-80 z-40">
        <Card className="border-dashed border-2 border-muted-foreground/30 bg-muted/20">
          <CardContent className="flex items-center justify-center h-48 text-center">
            <div className="space-y-2">
              <BookOpen className="mx-auto text-muted-foreground" size={32} />
              <p className="text-sm text-muted-foreground">
                Hover over a phase to see learning resources
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="hidden lg:block fixed right-6 top-1/2 transform -translate-y-1/2 w-80 z-40 animate-fade-in">
      <Card className="shadow-2xl border-ai-primary/20 bg-gradient-to-br from-background to-ai-primary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="text-ai-primary" size={20} />
              Phase {phaseIndex + 1} Resources
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {resources.length} total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{phaseName}</p>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Learning Progress</span>
              <span className="text-muted-foreground">{completedCount}/{resources.length}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Filters */}
          <div className="flex items-center gap-1 mb-4">
            <Filter size={14} className="text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant={activeFilter === 'all' ? 'default' : 'ghost'}
                className="h-6 px-2 text-xs"
                onClick={() => setActiveFilter('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={activeFilter === 'recommended' ? 'default' : 'ghost'}
                className="h-6 px-2 text-xs"
                onClick={() => setActiveFilter('recommended')}
              >
                <Star size={10} className="mr-1" />
                Top
              </Button>
              {resourceTypes.map(type => {
                const Icon = getResourceIcon(type);
                return (
                  <Button
                    key={type}
                    size="sm"
                    variant={activeFilter === type ? 'default' : 'ghost'}
                    className="h-6 px-2 text-xs"
                    onClick={() => setActiveFilter(type)}
                  >
                    <Icon size={10} className="mr-1" />
                    {type}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Resource List */}
          <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
            {filteredResources.map((resource, index) => {
              const isCompleted = completedResources.has(resource.title);
              const isBookmarked = bookmarkedResources.has(resource.title);
              const Icon = getResourceIcon(resource.type);
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md group ${
                    isCompleted ? 'bg-green-50/50 border-green-200' : 'bg-background/50 border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      <Icon size={16} className="text-ai-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h5 className="font-medium text-sm line-clamp-2 leading-tight">
                          {resource.title}
                        </h5>
                        <p className="text-xs text-muted-foreground mt-1">{resource.provider}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => toggleResourceBookmark(resource.title)}
                      >
                        <Bookmark 
                          size={12} 
                          className={isBookmarked ? 'fill-current text-ai-primary' : 'text-muted-foreground'} 
                        />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleResourceCompletion(resource.title)}
                      >
                        <CheckCircle 
                          size={12} 
                          className={isCompleted ? 'fill-current text-green-600' : 'text-muted-foreground'} 
                        />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs border ${getCostColor(resource.cost)}`}>
                      {resource.cost}
                    </Badge>
                    <Badge className={`text-xs border ${getDifficultyColor(resource.difficulty)}`}>
                      {resource.difficulty}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock size={10} className="mr-1" />
                      {resource.duration}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            className={i < resource.rating ? 'fill-current text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">
                        {resource.rating}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="h-6 text-xs px-3"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      Start
                      <ArrowRight size={10} className="ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {filteredResources.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen size={24} className="mx-auto mb-2" />
                <p className="text-sm">No resources found</p>
                <p className="text-xs">Try a different filter</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {filteredResources.length > 0 && (
            <div className="pt-3 border-t space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs"
                onClick={() => setActiveFilter('bookmarked')}
              >
                <Bookmark size={12} className="mr-1" />
                View Saved ({bookmarkedResources.size})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};