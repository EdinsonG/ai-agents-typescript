import { Agent } from '@/core/Agent.js';
import type { LLMProvider } from '@/core/LLMProvider.js';
import { skillRegistry } from '@/skills/index.js';
import type { UnitTestSuite } from '@/testing/unitTest.js';
import { UnitTestSuiteSchema } from '@/testing/unitTest.js';
import type { ExecuteOptions } from '@/types/index.js';
import { SYSTEM_PROMPT } from './prompt.js';
import { type ApiDesign, ApiDesignSchema } from './schema.js';

export class BackendNodeAgent extends Agent {
  constructor(apiKey: string, model = 'llama-3.3-70b-versatile', provider?: LLMProvider) {
    super(
      {
        name: 'Backend Node Expert',
        systemPrompt: SYSTEM_PROMPT,
        model,
        temperature: 0.2,
        apiKey,
      },
      provider,
      skillRegistry,
    );
  }

  public async designApi(
    requirementDescription: string,
    options: ExecuteOptions = {},
  ): Promise<string> {
    return this.execute(this.buildApiPrompt(requirementDescription), options);
  }

  /**
   * Genera el diseño de API como dato estructurado y validado.
   */
  public async designApiStructured(
    requirementDescription: string,
    options: ExecuteOptions = {},
  ): Promise<ApiDesign> {
    return this.executeStructured(
      this.buildApiPrompt(requirementDescription),
      ApiDesignSchema,
      options,
    );
  }

  public async reviewCode(code: string): Promise<string> {
    return this.execute(this.buildReviewPrompt(code));
  }

  /**
   * Genera pruebas unitarias y de integración completas (Vitest/Jest + Supertest)
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
      'Genera las pruebas unitarias/de integración completas para el siguiente objetivo backend Node.js/TypeScript:',
      subject,
      '',
      'Requisitos obligatorios:',
      '- Framework: Vitest (o Jest); pruebas HTTP con Supertest contra una app factory (no el servidor escuchando).',
      '- Unitarias para casos de uso/servicios de dominio con repositorios y dependencias mockeadas.',
      '- De integración para endpoints: validar código de estado, shape del payload JSON, errores tipados y casos de autorización (401/403).',
      '- Cubre validaciones inválidas (400), recursos inexistentes (404) y conflictos (409) además del camino feliz.',
      '- Base de datos mockeada o efímera; nunca depender de servicios externos reales.',
      '- No modifiques la implementación; si detectas un bug, marca la prueba con it.skip y documéntalo.',
      '- Incluye los comandos exactos para ejecutar la suite.',
    ].join('\n');

    return this.executeStructured(promptMessage, UnitTestSuiteSchema, options);
  }

  private buildApiPrompt(requirementDescription: string): string {
    const description = requirementDescription.trim();
    if (!description) {
      throw new Error('requirementDescription no puede estar vacío');
    }

    this.clearMemory();

    return [
      'Diseña la API, la arquitectura y la implementación backend para el siguiente requerimiento:',
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
      'Realiza una revisión de código experta del siguiente código backend Node.js/TypeScript.',
      'Evalúa: validación de entradas, seguridad (OWASP), manejo de errores tipados, arquitectura (separación de capas), rendimiento (N+1, índices, caché) y testing.',
      'Responde con: problemas detectados ordenados por severidad (crítico/mayor/menor), fragmento corregido de cada problema crítico o mayor, y veredicto final.',
      'Código a revisar:',
      sourceCode,
    ].join('\n\n');
  }
}
