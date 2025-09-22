import { z } from "zod";

export const RoadmapWithIdsSchema = z.object({
  role: z.string(),
  timeline_weeks: z.object({ 
    low: z.number(), 
    mid: z.number(), 
    high: z.number() 
  }),
  weekly_hours: z.number(),
  phases: z.array(z.object({
    name: z.string(),
    weeks: z.number(),
    skills: z.array(z.string()).min(1),
    projects: z.array(z.object({
      title: z.string(),
      size: z.enum(["S","M","L"]),
      brief: z.string()
    })).min(1),
    resource_ids: z.array(z.string()).min(2)
  })).min(3).max(4)
});

export type RoadmapWithIds = z.infer<typeof RoadmapWithIdsSchema>;