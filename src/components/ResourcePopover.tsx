import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  Bookmark
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

interface ResourcePopoverProps {
  resources: Resource[];
  children: React.ReactNode;
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
    case 'Free': return 'bg-green-100 text-green-800 border-green-200';
    case 'Paid': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Freemium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getDifficultyColor = (difficulty: Resource['difficulty']) => {
  switch (difficulty) {
    case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
    case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const ResourcePopover = ({ resources, children }: ResourcePopoverProps) => {
  const [completedResources, setCompletedResources] = useState<Set<string>>(new Set());
  const [bookmarkedResources, setBookmarkedResources] = useState<Set<string>>(new Set());

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

  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = [];
    }
    acc[resource.type].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  const completedCount = resources.filter(r => completedResources.has(r.title)).length;
  const progressPercentage = (completedCount / resources.length) * 100;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" side="right" align="start">
        <div className="p-4 border-b bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">Learning Resources</h3>
            <Badge variant="secondary">{resources.length} resources</Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span className="text-muted-foreground">{completedCount}/{resources.length}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 m-2">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="recommended" className="text-xs">Top</TabsTrigger>
            <TabsTrigger value="bookmarked" className="text-xs">Saved</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="max-h-96 overflow-y-auto px-2 pb-2">
            <div className="space-y-4">
              {Object.entries(groupedResources).map(([type, typeResources]) => {
                const Icon = getResourceIcon(type as Resource['type']);
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <Icon size={16} className="text-ai-primary" />
                      <h4 className="font-medium text-sm capitalize">{type}s</h4>
                      <Badge variant="outline" className="text-xs">
                        {typeResources.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {typeResources.map((resource, index) => {
                        const isCompleted = completedResources.has(resource.title);
                        const isBookmarked = bookmarkedResources.has(resource.title);
                        
                        return (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                              isCompleted ? 'bg-green-50 border-green-200' : 'bg-background border-border'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-sm line-clamp-1 flex-1">
                                {resource.title}
                              </h5>
                              <div className="flex items-center gap-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
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
                            
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {resource.description}
                            </p>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`text-xs ${getCostColor(resource.cost)}`}>
                                <DollarSign size={10} className="mr-1" />
                                {resource.cost}
                              </Badge>
                              <Badge className={`text-xs ${getDifficultyColor(resource.difficulty)}`}>
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
                                  {resource.provider}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs px-2"
                                onClick={() => window.open(resource.url, '_blank')}
                              >
                                <ExternalLink size={10} className="mr-1" />
                                Start
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="recommended" className="max-h-96 overflow-y-auto px-2 pb-2">
            <div className="space-y-2">
              {resources
                .filter(r => r.rating >= 4.5)
                .slice(0, 3)
                .map((resource, index) => (
                  <div key={index} className="p-3 rounded-lg border bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Star size={14} className="fill-current text-yellow-400" />
                      <span className="font-medium text-sm">Highly Recommended</span>
                    </div>
                    <h5 className="font-medium text-sm mb-1">{resource.title}</h5>
                    <p className="text-xs text-muted-foreground mb-2">{resource.description}</p>
                    <Button
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      Start Learning
                    </Button>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="bookmarked" className="max-h-96 overflow-y-auto px-2 pb-2">
            <div className="space-y-2">
              {resources
                .filter(r => bookmarkedResources.has(r.title))
                .map((resource, index) => (
                  <div key={index} className="p-3 rounded-lg border">
                    <h5 className="font-medium text-sm mb-1">{resource.title}</h5>
                    <p className="text-xs text-muted-foreground mb-2">{resource.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      Continue Learning
                    </Button>
                  </div>
                ))}
              {resources.filter(r => bookmarkedResources.has(r.title)).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bookmark size={24} className="mx-auto mb-2" />
                  <p className="text-sm">No bookmarked resources yet</p>
                  <p className="text-xs">Bookmark resources to save them for later</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};