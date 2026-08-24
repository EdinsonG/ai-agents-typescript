/**
 * Contratos del pipeline de orquestación multi-agente.
 */

import type {
  ApiDesign,
  DesignSpec,
  FrontendImplementationPlan,
  UserStoryDeliverable,
} from '@/types/deliverables.js';

export interface PipelineStageOptions {
  skills?: readonly string[];
}

export interface PipelineOptions {
  /** Etapas opcionales; por defecto se ejecutan todas tras el PO */
  stages?: {
    uxui?: boolean;
    frontend?: boolean;
    backend?: boolean;
  };
  skills?: {
    po?: readonly string[];
    uxui?: readonly string[];
    frontend?: readonly string[];
    backend?: readonly string[];
  };
}

export type DeliveryPackage = {
  requirement: string;
  story: UserStoryDeliverable;
  design?: DesignSpec;
  frontend?: FrontendImplementationPlan;
  api?: ApiDesign;
  /** Duración de cada etapa ejecutada, en ms */
  stageTimingsMs: Record<string, number>;
};
