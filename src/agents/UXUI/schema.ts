import { z } from 'zod';

const ColorTokenSchema = z.object({
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Debe ser un color hex de 6 dígitos'),
  usage: z.string().min(1),
  contrastRatio: z.number().min(1).max(21),
});

const ComponentSpecSchema = z.object({
  name: z.string().min(1),
  variants: z.array(z.string().min(1)).min(1),
  states: z.array(z.string().min(1)).min(3),
});

export const DesignSpecSchema = z.object({
  uxAnalysis: z.array(z.string().min(1)).min(2),
  solutionSummary: z.string().min(1),
  wireframeAscii: z.string(),
  designTokens: z.object({
    colors: z.array(ColorTokenSchema).min(3),
    typographyScale: z.string().min(1),
    spacingScale: z.string().min(1),
  }),
  components: z.array(ComponentSpecSchema).min(1),
  accessibilityChecklist: z.array(z.string().min(1)).min(4),
  interfaceStates: z.array(z.string().min(1)).min(5),
  successMetrics: z.array(z.string().min(1)).min(2),
  acceptanceCriteria: z
    .array(
      z.object({
        given: z.string().min(1),
        when: z.string().min(1),
        then: z.string().min(1),
      }),
    )
    .min(2),
});

export type DesignSpec = z.infer<typeof DesignSpecSchema>;
