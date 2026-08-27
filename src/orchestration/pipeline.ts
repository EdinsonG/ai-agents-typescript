import type { BackendNodeAgent } from '@/agents/BackendNode/BackendNodeAgent.js';
import type { FrontendReactAgent } from '@/agents/FrontendReact/FrontendReactAgent.js';
import type { TechnicalPOAgent } from '@/agents/TechnicalPO/TechnicalPOAgent.js';
import type { UXUIAgent } from '@/agents/UXUI/UXUIAgent.js';
import type { DeliveryPackage, PipelineOptions } from '@/types/index.js';
import { buildBackendBrief, buildFrontendBrief, buildUxBrief } from './briefs.js';

/**
 * Orquesta la suite de agentes en un pipeline de producto:
 * requerimiento → historia (PO) → diseño (UX/UI) → implementación (Frontend + Backend).
 * Cada etapa recibe un brief generado a partir de los entregables estructurados previos.
 * Usa Promise.allSettled para no perder resultados parciales si una etapa falla.
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
    const errors: string[] = [];

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

    // Usar Promise.allSettled para no perder resultados parciales
    const [frontendResult, backendResult] = await Promise.allSettled([
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

    const frontendPlan = frontendResult.status === 'fulfilled' ? frontendResult.value : undefined;
    const api = backendResult.status === 'fulfilled' ? backendResult.value : undefined;

    if (frontendResult.status === 'rejected') {
      errors.push(`Frontend: ${frontendResult.reason?.message ?? frontendResult.reason}`);
    }
    if (backendResult.status === 'rejected') {
      errors.push(`Backend: ${backendResult.reason?.message ?? backendResult.reason}`);
    }

    // Si ambas etapas paralelas fallaron, lanzar error
    if (frontendResult.status === 'rejected' && backendResult.status === 'rejected') {
      throw new Error(`Pipeline falló en etapas paralelas:\n${errors.join('\n')}`);
    }

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
