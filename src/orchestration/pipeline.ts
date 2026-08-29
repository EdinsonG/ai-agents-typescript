import type { BackendNodeAgent } from '@/agents/BackendNode/BackendNodeAgent.js';
import type { FrontendReactAgent } from '@/agents/FrontendReact/FrontendReactAgent.js';
import type { TechnicalPOAgent } from '@/agents/TechnicalPO/TechnicalPOAgent.js';
import type { UXUIAgent } from '@/agents/UXUI/UXUIAgent.js';
import { config } from '@/core/config.js';
import { getLogger } from '@/core/logger.js';
import type { DeliveryPackage, PipelineOptions, StageTimings } from '@/types/index.js';
import { buildBackendBrief, buildFrontendBrief, buildUxBrief } from './briefs.js';

/**
 * Orquesta la suite de agentes en un pipeline de producto.
 * Usa Promise.allSettled para preservar resultados parciales.
 * Incluye timeout configurable por etapa via AI_AGENT_PIPELINE_STAGE_TIMEOUT_MS.
 */
export class ProductDeliveryPipeline {
  constructor(
    private readonly po: TechnicalPOAgent,
    private readonly uxui: UXUIAgent,
    private readonly frontend: FrontendReactAgent,
    private readonly backend: BackendNodeAgent,
    private readonly stageTimeoutMs: number = config.pipelineStageTimeoutMs,
  ) {}

  public async run(requirement: string, options: PipelineOptions = {}): Promise<DeliveryPackage> {
    const trimmed = requirement.trim();
    if (!trimmed) {
      throw new Error('El requerimiento del pipeline no puede estar vacío');
    }

    const { stages = {}, skills = {} } = options;
    const timings: StageTimings = { po: 0 };

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
            this.backend.designApiStructured(buildBackendBrief(trimmed, story, design), {
              skills: skills.backend,
            }),
          ),
    ]);

    const frontendPlan = frontendResult.status === 'fulfilled' ? frontendResult.value : undefined;
    const api = backendResult.status === 'fulfilled' ? backendResult.value : undefined;

    if (frontendResult.status === 'rejected') {
      getLogger().error(
        `[Pipeline] Frontend falló: ${frontendResult.reason?.message ?? frontendResult.reason}`,
      );
    }
    if (backendResult.status === 'rejected') {
      getLogger().error(
        `[Pipeline] Backend falló: ${backendResult.reason?.message ?? backendResult.reason}`,
      );
    }

    if (frontendResult.status === 'rejected' && backendResult.status === 'rejected') {
      throw new Error(
        `Pipeline falló en etapas paralelas:\nFrontend: ${frontendResult.reason?.message}\nBackend: ${backendResult.reason?.message}`,
      );
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
    name: keyof StageTimings,
    timings: StageTimings,
    task: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    try {
      return await withTimeout(
        task(),
        this.stageTimeoutMs,
        `Etapa "${name}" excedió timeout de ${this.stageTimeoutMs}ms`,
      );
    } finally {
      timings[name] = Date.now() - start;
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
