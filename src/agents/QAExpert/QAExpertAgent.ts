import { Agent } from '@/core/Agent.js';
import type { LLMProvider } from '@/core/LLMProvider.js';
import { mergeSkillOptions } from '@/core/SkillRegistry.js';
import { skillRegistry } from '@/skills/index.js';
import type { AgentInferenceOptions, ExecuteOptions } from '@/types/index.js';
import { SYSTEM_PROMPT } from './prompt.js';
import {
  type BugBash,
  BugBashSchema,
  type CodeReview,
  CodeReviewSchema,
  type TestPlan,
  TestPlanSchema,
} from './schema.js';

/**
 * Skills del estándar obligatorio del agente QA, inyectadas solo en las
 * peticiones de análisis y revisión.
 */
export const DEFAULT_QA_SKILLS = [
  'testing-strategies',
  'owasp-testing-guide',
  'api-contract-testing',
] as const;

export class QAExpertAgent extends Agent {
  constructor(
    apiKey: string,
    model = 'llama-3.3-70b-versatile',
    provider?: LLMProvider,
    inference?: AgentInferenceOptions,
  ) {
    super(
      {
        name: 'QA Expert',
        systemPrompt: SYSTEM_PROMPT,
        model,
        temperature: 0.2,
        apiKey,
        ...inference,
      },
      provider,
      skillRegistry,
    );
  }

  /**
   * Genera un plan de testing completo para un requerimiento dado.
   */
  public async createTestPlan(
    requirementDescription: string,
    options: ExecuteOptions = {},
  ): Promise<string> {
    const description = requirementDescription.trim();
    if (!description) {
      throw new Error('requirementDescription no puede estar vacío');
    }

    this.clearMemory();

    const promptMessage = [
      'Crea un plan de testing completo para el siguiente requerimiento:',
      description,
      '',
      'Incluye: análisis de riesgos, estrategia de testing, casos de prueba detallados, quality gates y objetivos de cobertura.',
    ].join('\n\n');

    return this.execute(promptMessage, mergeSkillOptions(options, [...DEFAULT_QA_SKILLS]));
  }

  /**
   * Genera un plan de testing como dato estructurado y validado.
   */
  public async createTestPlanStructured(
    requirementDescription: string,
    options: ExecuteOptions = {},
  ): Promise<TestPlan> {
    const description = requirementDescription.trim();
    if (!description) {
      throw new Error('requirementDescription no puede estar vacío');
    }

    this.clearMemory();

    const promptMessage = [
      'Crea un plan de testing completo para el siguiente requerimiento:',
      description,
      '',
      'Incluye: análisis de riesgos, estrategia de testing, casos de prueba detallados, quality gates y objetivos de cobertura.',
    ].join('\n\n');

    return this.executeStructured(
      promptMessage,
      TestPlanSchema,
      mergeSkillOptions(options, [...DEFAULT_QA_SKILLS]),
    );
  }

  /**
   * Realiza una revisión de código orientada a calidad y bugs.
   */
  public async reviewCode(code: string): Promise<string> {
    const sourceCode = code.trim();
    if (!sourceCode) {
      throw new Error('code no puede estar vacío');
    }

    this.clearMemory();

    const promptMessage = [
      'Realiza una revisión de código orientada a calidad del siguiente código:',
      sourceCode,
      '',
      'Evalúa: bugs potenciales, security vulnerabilities, performance issues, maintainability, testing gaps. Proporciona un veredicto con score del 1-10.',
    ].join('\n\n');

    return this.execute(promptMessage, mergeSkillOptions({}, [...DEFAULT_QA_SKILLS]));
  }

  /**
   * Realiza una revisión de código como dato estructurado y validado.
   */
  public async reviewCodeStructured(code: string): Promise<CodeReview> {
    const sourceCode = code.trim();
    if (!sourceCode) {
      throw new Error('code no puede estar vacío');
    }

    this.clearMemory();

    const promptMessage = [
      'Realiza una revisión de código orientada a calidad del siguiente código:',
      sourceCode,
      '',
      'Evalúa: bugs potenciales, security vulnerabilities, performance issues, maintainability, testing gaps. Proporciona un veredicto con score del 1-10.',
    ].join('\n\n');

    return this.executeStructured(
      promptMessage,
      CodeReviewSchema,
      mergeSkillOptions({}, [...DEFAULT_QA_SKILLS]),
    );
  }

  /**
   * Ejecuta un bug bash: análisis exploratorio para encontrar bugs en código o diseño.
   */
  public async bugBash(subjectDescription: string, options: ExecuteOptions = {}): Promise<string> {
    const description = subjectDescription.trim();
    if (!description) {
      throw new Error('subjectDescription no puede estar vacío');
    }

    this.clearMemory();

    const promptMessage = [
      'Realiza un bug bash exhaustivo sobre el siguiente código o diseño:',
      description,
      '',
      'Busca bugs funcionales, de seguridad, performance, usabilidad y compatibilidad. Para cada bug: severidad, categoría, pasos para reproducir, comportamiento esperado vs actual.',
    ].join('\n\n');

    return this.execute(promptMessage, mergeSkillOptions(options, [...DEFAULT_QA_SKILLS]));
  }

  /**
   * Ejecuta un bug bash como dato estructurado y validado.
   */
  public async bugBashStructured(
    subjectDescription: string,
    options: ExecuteOptions = {},
  ): Promise<BugBash> {
    const description = subjectDescription.trim();
    if (!description) {
      throw new Error('subjectDescription no puede estar vacío');
    }

    this.clearMemory();

    const promptMessage = [
      'Realiza un bug bash exhaustivo sobre el siguiente código o diseño:',
      description,
      '',
      'Busca bugs funcionales, de seguridad, performance, usabilidad y compatibilidad. Para cada bug: severidad, categoría, pasos para reproducir, comportamiento esperado vs actual.',
    ].join('\n\n');

    return this.executeStructured(
      promptMessage,
      BugBashSchema,
      mergeSkillOptions(options, [...DEFAULT_QA_SKILLS]),
    );
  }
}
