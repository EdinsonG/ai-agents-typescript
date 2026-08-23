import { z } from 'zod';
import { StoryPointsSchema } from '@/agents/TechnicalPO/schema.js';

export const ReactTaskAreaSchema = z.enum(['components', 'data', 'styles-animation', 'testing']);

const ReactTaskSchema = z.object({
  area: ReactTaskAreaSchema,
  description: z.string().min(1),
});

export const ImplementationPlanSchema = z.object({
  analysis: z.array(z.string().min(1)).min(2),
  components: z
    .array(
      z.object({
        name: z.string().min(1),
        kind: z.enum(['server', 'client']),
        responsibility: z.string().min(1),
      }),
    )
    .min(1),
  folderStructure: z.string().min(1),
  stateAndDataStrategy: z.object({
    stateDecision: z.enum(['server-actions', 'react-query', 'swr', 'local-state']),
    justification: z.string().min(1),
  }),
  performanceNotes: z.array(z.string().min(1)).min(2),
  accessibilityNotes: z.array(z.string().min(1)).min(2),
  animationNotes: z.string().min(1),
  tasks: z.array(ReactTaskSchema).min(4),
  storyPoints: StoryPointsSchema,
  risks: z.array(z.string().min(1)).min(1),
});

export type FrontendImplementationPlan = z.infer<typeof ImplementationPlanSchema>;
