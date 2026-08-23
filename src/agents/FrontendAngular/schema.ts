import { z } from 'zod';
import { StoryPointsSchema } from '@/agents/TechnicalPO/schema.js';

export const AngularTaskAreaSchema = z.enum(['components', 'services', 'styles', 'testing']);

const AngularTaskSchema = z.object({
  area: AngularTaskAreaSchema,
  description: z.string().min(1),
});

export const AngularImplementationPlanSchema = z.object({
  analysis: z.array(z.string().min(1)).min(2),
  architecture: z.object({
    folderStructure: z.string().min(1),
    lazyLoadedFeatures: z.array(z.string()).min(1),
  }),
  components: z
    .array(
      z.object({
        name: z.string().min(1),
        responsibility: z.string().min(1),
      }),
    )
    .min(1),
  reactivityDecision: z.object({
    approach: z.enum(['signals', 'rxjs', 'ngrx-signalstore']),
    justification: z.string().min(1),
  }),
  performanceNotes: z.array(z.string().min(1)).min(2),
  accessibilityNotes: z.array(z.string().min(1)).min(2),
  tasks: z.array(AngularTaskSchema).min(4),
  storyPoints: StoryPointsSchema,
  risks: z.array(z.string().min(1)).min(1),
});

export type AngularImplementationPlan = z.infer<typeof AngularImplementationPlanSchema>;
