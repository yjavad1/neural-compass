import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Video, Code, Users, Star } from "lucide-react";

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

interface ResourceCardProps {
  resources: Resource[];
}

const getResourceIcon = (type: Resource['type']) => {
  switch (type) {
    case 'course':
      return <Video size={16} className="text-ai-primary" />;
    case 'tutorial':
      return <BookOpen size={16} className="text-ai-secondary" />;
    case 'practice':
      return <Code size={16} className="text-ai-accent" />;
    case 'community':
      return <Users size={16} className="text-ai-success" />;
    case 'book':
      return <BookOpen size={16} className="text-muted-foreground" />;
    case 'tool':
      return <Code size={16} className="text-ai-primary" />;
    default:
      return <BookOpen size={16} />;
  }
};

const getCostColor = (cost: Resource['cost']) => {
  switch (cost) {
    case 'Free':
      return 'bg-ai-success/10 text-ai-success border-ai-success/20';
    case 'Paid':
      return 'bg-ai-accent/10 text-ai-accent border-ai-accent/20';
    case 'Freemium':
      return 'bg-ai-secondary/10 text-ai-secondary border-ai-secondary/20';
    default:
      return '';
  }
};

const getDifficultyColor = (difficulty: Resource['difficulty']) => {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-ai-success/10 text-ai-success border-ai-success/20';
    case 'Intermediate':
      return 'bg-ai-primary/10 text-ai-primary border-ai-primary/20';
    case 'Advanced':
      return 'bg-ai-accent/10 text-ai-accent border-ai-accent/20';
    default:
      return '';
  }
};

export const ResourceCard = ({ resources }: ResourceCardProps) => {
  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = [];
    }
    acc[resource.type].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  return (
    <div className="mt-6">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <Star size={16} className="text-ai-primary" />
        Recommended Resources
      </h4>
      
      <div className="grid gap-4">
        {Object.entries(groupedResources).map(([type, typeResources]) => (
          <div key={type} className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground capitalize flex items-center gap-2">
              {getResourceIcon(type as Resource['type'])}
              {type}s ({typeResources.length})
            </h5>
            
            <div className="grid gap-3">
              {typeResources.map((resource, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-ai-primary/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h6 className="font-medium truncate">{resource.title}</h6>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star size={12} className="fill-current" />
                          {resource.rating}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {resource.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className={getCostColor(resource.cost)}>
                          {resource.cost}
                        </Badge>
                        <Badge variant="outline" className={getDifficultyColor(resource.difficulty)}>
                          {resource.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {resource.duration}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">by {resource.provider}</span>
                        <Button size="sm" variant="outline" className="h-8" asChild>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={12} className="mr-1" />
                            View
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};