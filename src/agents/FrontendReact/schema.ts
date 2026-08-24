import { z } from 'zod';
import { StoryPointsSchema } from '@/agents/TechnicalPO/schema.js';

export const ReactTaskAreaSchema = z.enum(['components', 'data', 'styles-animation', 'testing']);

const ReactTaskSchema = z.object({
  area: ReactTaskAreaSchema,
  description: z.string().min(1),
});

/** Decisión de manejo de formularios (stack por defecto: React Hook Form + zod) */
export const FormHandlingSchema = z.object({
  hasForms: z.boolean(),
  /** Ej. "react-hook-form + zodResolver (@hookform/resolvers/zod)" */
  strategy: z.string().min(1),
  /** Ubicación del esquema zod compartido cliente/servidor */
  schemaLocation: z.string(),
});

/** Estrategia i18n (stack por defecto: next-intl resuelto por cookie, sin URL) */
export const I18nStrategySchema = z.object({
  multilingual: z.boolean(),
  localeDetection: z.enum(['cookie', 'url-prefix', 'header-negotiation', 'not-applicable']),
  details: z.string().min(1),
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
    stateDecision: z.enum(['server-actions', 'react-query', 'swr', 'local-state', 'zustand']),
    /** Middleware persist de Zustand, storage elegido y qué NO se persiste */
    persistenceDetails: z.string(),
    justification: z.string().min(1),
  }),
  formHandling: FormHandlingSchema,
  i18nStrategy: I18nStrategySchema,
  /** Uso de next/headers (cookies()) en el servidor; "No aplica" si no interviene */
  serverCookiesUsage: z.string().min(1),
  performanceNotes: z.array(z.string().min(1)).min(2),
  accessibilityNotes: z.array(z.string().min(1)).min(2),
  animationNotes: z.string().min(1),
  tasks: z.array(ReactTaskSchema).min(4),
  storyPoints: StoryPointsSchema,
  risks: z.array(z.string().min(1)).min(1),
});

export type FrontendImplementationPlan = z.infer<typeof ImplementationPlanSchema>;
