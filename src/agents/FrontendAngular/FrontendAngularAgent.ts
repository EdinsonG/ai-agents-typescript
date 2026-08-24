import { Agent } from '@/core/Agent.js';
import type { LLMProvider } from '@/core/LLMProvider.js';
import { skillRegistry } from '@/skills/index.js';
import type { UnitTestSuite } from '@/testing/unitTest.js';
import { UnitTestSuiteSchema } from '@/testing/unitTest.js';
import type { ExecuteOptions } from '@/types/index.js';
import { SYSTEM_PROMPT } from './prompt.js';
import { type AngularImplementationPlan, AngularImplementationPlanSchema } from './schema.js';

export class FrontendAngularAgent extends Agent {
  constructor(apiKey: string, model = 'llama-3.3-70b-versatile', provider?: LLMProvider) {
    super(
      {
        name: 'Frontend Angular Expert',
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
   * Genera el plan de implementación Angular como dato estructurado y validado.
   */
  public async implementFeatureStructured(
    featureDescription: string,
    options: ExecuteOptions = {},
  ): Promise<AngularImplementationPlan> {
    return this.executeStructured(
      this.buildFeaturePrompt(featureDescription),
      AngularImplementationPlanSchema,
      options,
    );
  }

  public async reviewCode(code: string): Promise<string> {
    return this.execute(this.buildReviewPrompt(code));
  }

  /**
   * Genera pruebas unitarias completas (Vitest/Jest + Angular Testing Kit)
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
      'Genera las pruebas unitarias completas para el siguiente objetivo (componente, servicio, pipe o directiva Angular):',
      subject,
      '',
      'Requisitos obligatorios:',
      '- Framework: Vitest (o Jest) con Angular Testing Kit (TestBed) y componentes standalone.',
      '- Configuración explícita de providers/mocks en TestBed; HttpClient mockeado con HttpTestingController cuando aplique.',
      '- Cubre renderizado inicial, interacciones del usuario, estados derivados con signals y manejo de errores.',
      '- detectChanges() y consultas tipadas; nombres de prueba descriptivos en español.',
      '- No modifiques la implementación; si detectas un bug, marca la prueba con it.skip y documéntalo.',
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
      'Diseña la arquitectura y genera la implementación en Angular para la siguiente funcionalidad:',
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
      'Realiza una revisión de código experta del siguiente código Angular.',
      'Evalúa: standalone + OnPush, uso idiomático de signals e inject(), sintaxis moderna de control de flujo, tipado estricto, gestión de suscripciones (fugas de memoria), accesibilidad y testing.',
      'Responde con: problemas detectados ordenados por severidad (crítico/mayor/menor), fragmento corregido de cada problema crítico o mayor, y veredicto final.',
      'Código a revisar:',
      sourceCode,
    ].join('\n\n');
  }
}
