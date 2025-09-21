import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export const ResourceCatalogTest = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [roadmapTest, setRoadmapTest] = useState<any>(null);

  const testResourceManager = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('resource-manager', {
        body: { action: 'get_resources' }
      });
      
      if (error) throw error;
      
      setResources(data.resources);
      console.log('Resources fetched:', data.resources);
    } catch (error) {
      console.error('Error testing resource manager:', error);
    } finally {
      setLoading(false);
    }
  };

  const testRoadmapGenerator = async () => {
    setLoading(true);
    try {
      const testPersona = {
        experience_level: 'beginner',
        ai_interests: ['machine-learning'],
        learning_goals: ['career-transition'],
        technical_background: 'basic-programming'
      };

      const { data, error } = await supabase.functions.invoke('ai-roadmap-generator', {
        body: { 
          personaJson: testPersona,
          selectedRole: 'Machine Learning Engineer'
        }
      });
      
      if (error) throw error;
      
      setRoadmapTest(data);
      console.log('Roadmap generated:', data);
    } catch (error) {
      console.error('Error testing roadmap generator:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Resource Catalog Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testResourceManager} disabled={loading}>
              Test Resource Manager
            </Button>
            <Button onClick={testRoadmapGenerator} disabled={loading}>
              Test Roadmap Generator
            </Button>
          </div>
          
          {resources.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Resources Found: {resources.length}
              </h3>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {resources.map((resource: any) => (
                  <div key={resource.id} className="p-2 border rounded text-sm">
                    <strong>{resource.title}</strong> - {resource.difficulty_level} - {resource.type}
                  </div>
                ))}
              </div>
            </div>
          )}

          {roadmapTest && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Roadmap Test Result</h3>
              <pre className="text-xs bg-muted p-2 rounded max-h-60 overflow-y-auto">
                {JSON.stringify(roadmapTest, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};