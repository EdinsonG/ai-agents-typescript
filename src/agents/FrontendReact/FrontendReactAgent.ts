import { Agent } from '@/core/Agent.js';
import type { LLMProvider } from '@/core/LLMProvider.js';
import { skillRegistry } from '@/skills/index.js';
import type { UnitTestSuite } from '@/testing/unitTest.js';
import { UnitTestSuiteSchema } from '@/testing/unitTest.js';
import type { ExecuteOptions } from '@/types/index.js';
import { SYSTEM_PROMPT } from './prompt.js';
import { type FrontendImplementationPlan, ImplementationPlanSchema } from './schema.js';

export class FrontendReactAgent extends Agent {
  constructor(apiKey: string, model = 'llama-3.3-70b-versatile', provider?: LLMProvider) {
    super(
      {
        name: 'Frontend React Expert',
        systemPrompt: SYSTEM_PROMPT,
        model,
        temperature: 0.2,
        apiKey,
      },
      provider,
      skillRegistry,
    );
  }

  public async implementFeature(
    featureDescription: string,
    options: ExecuteOptions = {},
  ): Promise<string> {
    return this.execute(this.buildFeaturePrompt(featureDescription), options);
  }

  /**
   * Genera el plan de implementación como dato estructurado y validado.
   */
  public async implementFeatureStructured(
    featureDescription: string,
    options: ExecuteOptions = {},
  ): Promise<FrontendImplementationPlan> {
    return this.executeStructured(
      this.buildFeaturePrompt(featureDescription),
      ImplementationPlanSchema,
      options,
    );
  }

  public async reviewCode(code: string): Promise<string> {
    return this.execute(this.buildReviewPrompt(code));
  }

  /**
   * Genera pruebas unitarias completas (Vitest + React Testing Library)
   * como entregable estructurado y validado.
   */
  public async generateUnitTests(
    subjectDescription: string,
    options: ExecuteOptions = {},
  ): Promise<UnitTestSuite> {
    const subject = subjectDescription.trim();
    if (!subject) {
      throw new Error('subjectDescription no puede estar vacío');
    }

    this.clearMemory();

    const promptMessage = [
      'Genera las pruebas unitarias completas para el siguiente objetivo (componente, hook o funcionalidad React):',
      subject,
      '',
      'Requisitos obligatorios:',
      '- Framework: Vitest con React Testing Library y jest-dom.',
      '- Archivos de prueba completos y ejecutables, con imports correctos, mocks explícitos de red/datos y render aislado por prueba.',
      '- Cubre camino feliz, casos borde y estados de carga/error/vacío.',
      '- Patrón AAA y nombres de prueba descriptivos en español.',
      '- No modifiques la implementación; si detectas un bug, marca la prueba con it.skip y documéntalo en un comentario.',
      '- Incluye los comandos exactos para ejecutar la suite.',
    ].join('\n');

    return this.executeStructured(promptMessage, UnitTestSuiteSchema, options);
  }

  private buildFeaturePrompt(featureDescription: string): string {
    const description = featureDescription.trim();
    if (!description) {
      throw new Error('featureDescription no puede estar vacío');
    }

    this.clearMemory();

    return [
      'Diseña la arquitectura y genera la implementación frontend para la siguiente funcionalidad:',
      description,
    ].join('\n\n');
  }

  private buildReviewPrompt(code: string): string {
    const sourceCode = code.trim();
    if (!sourceCode) {
      throw new Error('code no puede estar vacío');
    }

    this.clearMemory();

    return [
      'Realiza una revisión de código experta del siguiente código React/TypeScript.',
      'Evalúa: tipado estricto, rendimiento (re-renders innecesarios), accesibilidad, uso correcto de Server/Client Components, calidad de Tailwind y animaciones con Motion.',
      'Responde con: problemas detectados ordenados por severidad (crítico/mayor/menor), fragmento corregido de cada problema crítico o mayor, y veredicto final.',
      'Código a revisar:',
      sourceCode,
    ].join('\n\n');
  }
}
