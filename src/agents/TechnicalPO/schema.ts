import { z } from 'zod';

export const StoryPointsSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(5),
  z.literal(8),
]);

export const TaskAreaSchema = z.enum(['frontend', 'backend', 'database', 'testing']);

export const AcceptanceCriterionSchema = z.object({
  scenario: z.string().min(1),
  given: z.string().min(1),
  when: z.string().min(1),
  then: z.string().min(1),
});

export const TaskSchema = z.object({
  area: TaskAreaSchema,
  description: z.string().min(1),
});

export const UserStoryDeliverableSchema = z.object({
  title: z.string().min(1),
  userStory: z.object({
    asA: z.string().min(1),
    iWant: z.string().min(1),
    soThat: z.string().min(1),
  }),
  technicalContext: z.object({
    componentization: z.string().min(1),
    cleanCodeAndStateManagement: z.string().min(1),
    securityCompliance: z.string().min(1),
  }),
  acceptanceCriteria: z.array(AcceptanceCriterionSchema).min(2),
  tasks: z.array(TaskSchema).min(4),
  estimation: z.object({
    storyPoints: StoryPointsSchema,
    justification: z.string().min(1),
  }),
});

export type UserStoryDeliverable = z.infer<typeof UserStoryDeliverableSchema>;
