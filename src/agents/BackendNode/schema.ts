import { z } from 'zod';
import { StoryPointsSchema } from '@/agents/TechnicalPO/schema.js';

export const HttpVerbSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export const BackendTaskAreaSchema = z.enum([
  'endpoints',
  'domain',
  'database',
  'security',
  'testing',
]);

const EndpointSchema = z.object({
  method: HttpVerbSchema,
  path: z.string().regex(/^\//, 'La ruta debe iniciar con /'),
  purpose: z.string().min(1),
  authRequired: z.boolean(),
  statusCodes: z.array(z.number().int().min(200).max(599)).min(1),
});

const EntityFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  indexed: z.boolean(),
});

const BackendTaskSchema = z.object({
  area: BackendTaskAreaSchema,
  description: z.string().min(1),
});

export const ApiDesignSchema = z.object({
  summary: z.string().min(1),
  frameworkDecision: z.object({
    framework: z.enum(['nestjs', 'express']),
    justification: z.string().min(1),
  }),
  endpoints: z.array(EndpointSchema).min(1),
  dataModel: z
    .array(
      z.object({
        entity: z.string().min(1),
        fields: z.array(EntityFieldSchema).min(1),
      }),
    )
    .min(1),
  securityMeasures: z.array(z.string().min(1)).min(3),
  errorHandlingStrategy: z.string().min(1),
  cachingStrategy: z.string(),
  tasks: z.array(BackendTaskSchema).min(4),
  storyPoints: StoryPointsSchema,
  risks: z.array(z.string().min(1)).min(1),
});

export type ApiDesign = z.infer<typeof ApiDesignSchema>;
