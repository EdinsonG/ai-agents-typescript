import type { BackendNodeAgent } from '@/agents/BackendNode/BackendNodeAgent.js';
import type { ApiDesign } from '@/agents/BackendNode/schema.js';
import type { FrontendReactAgent } from '@/agents/FrontendReact/FrontendReactAgent.js';
import type { FrontendImplementationPlan } from '@/agents/FrontendReact/schema.js';
import type { UserStoryDeliverable } from '@/agents/TechnicalPO/schema.js';
import type { TechnicalPOAgent } from '@/agents/TechnicalPO/TechnicalPOAgent.js';
import type { DesignSpec } from '@/agents/UXUI/schema.js';
import type { UXUIAgent } from '@/agents/UXUI/UXUIAgent.js';
import { buildBackendBrief, buildFrontendBrief, buildUxBrief } from './briefs.js';

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

/**
 * Orquesta la suite de agentes en un pipeline de producto:
 * requerimiento → historia (PO) → diseño (UX/UI) → implementación (Frontend + Backend).
 * Cada etapa recibe un brief generado a partir de los entregables estructurados previos.
 */
export class ProductDeliveryPipeline {
  constructor(
    private readonly po: TechnicalPOAgent,
    private readonly uxui: UXUIAgent,
    private readonly frontend: FrontendReactAgent,
    private readonly backend: BackendNodeAgent,
  ) {}

  public async run(requirement: string, options: PipelineOptions = {}): Promise<DeliveryPackage> {
    const trimmed = requirement.trim();
    if (!trimmed) {
      throw new Error('El requerimiento del pipeline no puede estar vacío');
    }

    const { stages = {}, skills = {} } = options;
    const timings: Record<string, number> = {};

    const story = await this.runStage('po', timings, () =>
      this.po.generateUserStoryStructured(trimmed, { skills: skills.po }),
    );

    const design =
      stages.uxui === false
        ? undefined
        : await this.runStage('uxui', timings, () =>
            this.uxui.designSolutionStructured(buildUxBrief(trimmed, story), {
              skills: skills.uxui,
            }),
          );

    const [frontendPlan, api] = await Promise.all([
      stages.frontend === false
        ? Promise.resolve(undefined)
        : this.runStage('frontend', timings, () =>
            this.frontend.implementFeatureStructured(buildFrontendBrief(trimmed, story, design), {
              skills: skills.frontend,
            }),
          ),
      stages.backend === false
        ? Promise.resolve(undefined)
        : this.runStage('backend', timings, () =>
            this.backend.designApiStructured(buildBackendBrief(trimmed, story), {
              skills: skills.backend,
            }),
          ),
    ]);

    return {
      requirement: trimmed,
      story,
      design,
      frontend: frontendPlan,
      api,
      stageTimingsMs: timings,
    };
  }

  private async runStage<T>(
    name: string,
    timings: Record<string, number>,
    task: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    try {
      return await task();
    } finally {
      timings[name] = Date.now() - start;
    }
  }
}
