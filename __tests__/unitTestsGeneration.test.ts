import { describe, expect, it } from 'vitest';
import { BackendNodeAgent } from '@/agents/BackendNode/BackendNodeAgent.js';
import { FrontendAngularAgent } from '@/agents/FrontendAngular/FrontendAngularAgent.js';
import { FrontendReactAgent } from '@/agents/FrontendReact/FrontendReactAgent.js';
import { type GenerateCompletionOptions, LLMProvider } from '@/core/LLMProvider.js';
import type { UnitTestSuite } from '@/testing/unitTest.js';
import type { ChatMessage } from '@/types/index.js';

const SUITE_JSON: UnitTestSuite = {
  target: 'LoginForm',
  framework: 'vitest',
  libraries: ['@testing-library/react', '@testing-library/jest-dom'],
  testFiles: [
    {
      path: 'src/components/LoginForm.test.tsx',
      description: 'Cubre renderizado, envío válido y error de credenciales',
      code: [
        "import { render, screen } from '@testing-library/react';",
        "import userEvent from '@testing-library/user-event';",
        "import { describe, expect, it, vi } from 'vitest';",
        "import { LoginForm } from './LoginForm';",
        '',
        "describe('LoginForm', () => {",
        "  it('envía credenciales válidas y muestra éxito', async () => {",
        '    // Arrange',
        '    const onSubmit = vi.fn();',
        '    render(<LoginForm onSubmit={onSubmit} />);',
        '    // Act',
        "    await userEvent.type(screen.getByLabelText('Usuario'), 'ana');",
        "    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreto');",
        "    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));",
        '    // Assert',
        '    expect(onSubmit).toHaveBeenCalledWith({ user: "ana", password: "secreto" });',
        '  });',
        '});',
      ].join('\n'),
    },
  ],
  runCommands: ['pnpm vitest run src/components/LoginForm.test.tsx'],
  coverageFocus: ['camino feliz de autenticación', 'credenciales inválidas muestran error'],
};

class ScriptedProvider extends LLMProvider {
  public requests: { messages: ChatMessage[]; hasResponseFormat: boolean }[] = [];

  constructor(private readonly scripted: string[]) {
    super({ apiKey: 'key', model: 'mock' });
  }

  public override async generateCompletion(
    messages: ChatMessage[],
    options?: GenerateCompletionOptions,
  ): Promise<string> {
    this.requests.push({
      messages: structuredClone(messages),
      hasResponseFormat: options?.responseFormat?.type === 'json_schema',
    });
    return this.scripted[Math.min(this.requests.length - 1, this.scripted.length - 1)];
  }
}

const CASES = [
  {
    name: 'FrontendReactAgent',
    make: (provider: LLMProvider) => new FrontendReactAgent('key', 'mock', provider),
    stackKeyword: 'React Testing Library',
  },
  {
    name: 'FrontendAngularAgent',
    make: (provider: LLMProvider) => new FrontendAngularAgent('key', 'mock', provider),
    stackKeyword: 'TestBed',
  },
  {
    name: 'BackendNodeAgent',
    make: (provider: LLMProvider) => new BackendNodeAgent('key', 'mock', provider),
    stackKeyword: 'Supertest',
  },
] as const;

describe.each(CASES)('$name.generateUnitTests', ({ make, stackKeyword }) => {
  it('devuelve la suite validada y pide formato estructurado con el stack correcto', async () => {
    const provider = new ScriptedProvider([JSON.stringify(SUITE_JSON)]);
    const agent = make(provider);

    const suite = await agent.generateUnitTests(`pruebas para el formulario de login`);

    expect(suite.target).toBe('LoginForm');
    expect(suite.framework).toBe('vitest');
    expect(suite.testFiles[0].code).toContain('describe(');
    expect(suite.runCommands[0]).toContain('vitest');
    expect(suite.coverageFocus.length).toBeGreaterThanOrEqual(2);

    const request = provider.requests[0];
    expect(request.hasResponseFormat).toBe(true);
    expect(request.messages.at(-1)?.role).toBe('user');
    expect(request.messages.at(-1)?.content).toContain(stackKeyword);
    expect(request.messages.at(-1)?.content).toContain('formulario de login');
  });

  it('lanza error si el objetivo está vacío sin consumir el proveedor', async () => {
    const provider = new ScriptedProvider([JSON.stringify(SUITE_JSON)]);
    const agent = make(provider);

    await expect(agent.generateUnitTests('  ')).rejects.toThrow(/no puede estar vacío/);
    expect(provider.requests).toHaveLength(0);
  });
});
