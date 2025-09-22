import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Diagnostics() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runSmokeTest() {
    setLoading(true);
    try {
      const persona = { 
        goal: "job", 
        interests: ["nlp"], 
        constraints: [], 
        hours_per_week: 8,
        coding: "intermediate",
        timeline_months: 6
      };
      
      console.log('🔍 Running diagnostics with persona:', persona);
      
      const { data, error } = await supabase.functions.invoke('ai-roadmap-generator', {
        body: { 
          personaJson: persona, 
          selectedRole: "AI Product Manager" 
        }
      });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      console.log('📊 Diagnostics result:', data);
      setReport(data?.roadmap || data);
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      setReport({ error: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Roadmap Generation Diagnostics</h1>
          <Button onClick={runSmokeTest} disabled={loading}>
            {loading ? 'Running...' : 'Run Smoke Test'}
          </Button>
        </div>

        {report?.error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{report.error}</p>
            </CardContent>
          </Card>
        )}

        {report?.phases && (
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Generated Roadmap: {report.role}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Timeline: {report.timeline} | Difficulty: {report.difficulty}
                </p>
              </CardHeader>
            </Card>

            {report.phases.map((phase: any, index: number) => (
              <Card key={phase.name || index}>
                <CardHeader>
                  <CardTitle className="text-lg">{phase.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Duration: {phase.duration} | Resources: {phase.resources?.length || 0}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">Skills</h4>
                      <p className="text-sm text-muted-foreground">
                        {phase.skills?.join(', ') || 'None'}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Resources</h4>
                      {phase.resources?.length > 0 ? (
                        <ul className="text-sm list-disc ml-5 space-y-1">
                          {phase.resources.map((r: any, i: number) => (
                            <li key={i} className="text-muted-foreground">
                              <span className="font-medium">{r.title}</span> 
                              <span className="ml-2">({r.provider} - {r.cost})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-destructive">❌ No resources found</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!report && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Click "Run Smoke Test" to validate roadmap generation
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}