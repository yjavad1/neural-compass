import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Clock, BarChart3 } from "lucide-react";

interface RoleOption {
  role: string;
  fitScore: number;
  reasoning: string;
  timeToEntry: string;
  difficulty: string;
}

interface RoleSelectionSectionProps {
  userName: string;
  roleOptions: RoleOption[];
  onSelectRole: (role: string) => void;
  onBack: () => void;
}

export const RoleSelectionSection = ({ 
  userName, 
  roleOptions, 
  onSelectRole, 
  onBack 
}: RoleSelectionSectionProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quiz
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Perfect! Here are your AI career matches, {userName} 🎯
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Based on your background, interests, and goals, I've identified the best AI roles for you. 
              Choose one to get your personalized learning roadmap.
            </p>
          </div>

          {/* Role Options */}
          <div className="grid gap-6 max-w-4xl mx-auto">
            {roleOptions.map((option, index) => (
              <Card 
                key={index}
                className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group cursor-pointer"
                onClick={() => onSelectRole(option.role)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {option.role}
                        </CardTitle>
                        <Badge 
                          variant={index === 0 ? "default" : "secondary"}
                          className="shrink-0"
                        >
                          {option.fitScore}% match
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {option.timeToEntry}
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          {option.difficulty}
                        </div>
                        {index === 0 && (
                          <div className="flex items-center gap-1 text-primary">
                            <TrendingUp className="w-4 h-4" />
                            Best Match
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {option.reasoning}
                  </CardDescription>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      variant={index === 0 ? "default" : "outline"}
                    >
                      Choose this path
                    </Button>
                  </div>
                </CardContent>

                {/* Highlight border for best match */}
                {index === 0 && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
                )}
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 p-6 bg-muted/50 rounded-xl max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Pro tip:</strong> The top recommendation is based on your specific background and goals, 
              but any of these paths can lead to a successful AI career. Choose the one that excites you most!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};