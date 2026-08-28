import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { Agent } from '@/core/Agent.js';
import { StructuredOutputError } from '@/core/errors.js';
import { parseJsonLoose } from '@/core/json.js';
import { SkillRegistry } from '@/core/SkillRegistry.js';
import type { Skill } from '@/types/index.js';
import { createScriptedProvider } from './mocks/mockProvider.js';

const DUMMY_SKILL: Skill = {
  id: 'test-skill',
  name: 'Test Skill',
  description: 'Skill de prueba',
  instructions: 'Instrucciones de la skill de prueba.',
};

class TestAgent extends Agent {
  constructor(responses: string[], registry?: SkillRegistry) {
    super(
      { name: 'Test Agent', systemPrompt: 'SYSTEM_BASE', apiKey: 'key', model: 'mock' },
      createScriptedProvider(responses),
      registry,
    );
  }

  public get queuedProvider(): any {
    return this.provider;
  }

  public run(input: string, options?: Parameters<Agent['execute']>[1]) {
    return this.execute(input, options);
  }

  public runStructured<T>(input: string, schema: z.ZodType<T>) {
    return this.executeStructured(input, schema);
  }
}

describe('parseJsonLoose', () => {
  it('parsea JSON directo', () => {
    expect(parseJsonLoose('{"a":1}')).toEqual({ a: 1 });
  });

  it('parsea JSON dentro de cercos de código', () => {
    expect(parseJsonLoose('```json\n{"a":2}\n```')).toEqual({ a: 2 });
  });

  it('extrae el objeto de texto circundante', () => {
    expect(parseJsonLoose('Aquí está tu respuesta:\n{"a":3}\nSaludos.')).toEqual({ a: 3 });
  });

  it('lanza SyntaxError si no hay objeto JSON', () => {
    expect(() => parseJsonLoose('texto sin json')).toThrow(SyntaxError);
  });
});

describe('SkillRegistry', () => {
  it('resuelve skills registradas y compone su bloque de instrucciones', () => {
    const registry = new SkillRegistry().register(DUMMY_SKILL);
    const composed = registry.compose(['test-skill']);

    expect(composed).toContain('test-skill');
    expect(composed).toContain(DUMMY_SKILL.instructions);
  });

  it('devuelve cadena vacía sin skills y no rompe con undefined', () => {
    const registry = new SkillRegistry();

    expect(registry.compose()).toBe('');
    expect(registry.compose([])).toBe('');
  });

  it('lanza error con ids disponibles cuando la skill no existe', () => {
    const registry = new SkillRegistry().register(DUMMY_SKILL);

    expect(() => registry.resolve(['inexistente'])).toThrow(/Skill desconocida.*test-skill/);
  });
});

describe('Agent.execute con skills', () => {
  it('inyecta las skills solo en el mensaje de sistema enviado al proveedor', async () => {
    const agent = new TestAgent(['respuesta'], new SkillRegistry().register(DUMMY_SKILL));

    await agent.run('hola', { skills: ['test-skill'] });

    const sent = agent.queuedProvider.requests[0].messages;
    expect(sent[0].role).toBe('system');
    expect(sent[0].content).toContain('SKILL ACTIVA');
    expect(sent[0].content).toContain(DUMMY_SKILL.instructions);

    const history = agent['chatHistory'];
    expect(history[0].content).toBe('SYSTEM_BASE');
  });

  it('sin skills envía los mensajes intactos', async () => {
    const agent = new TestAgent(['respuesta']);

    await agent.run('hola');

    expect(agent.queuedProvider.requests[0].messages[0].content).toBe('SYSTEM_BASE');
  });

  it('lanza error si una skill solicitada no existe en el registro del agente', async () => {
    const agent = new TestAgent(['respuesta']);

    await expect(agent.run('hola', { skills: ['fantasma'] })).rejects.toThrow(/Skill desconocida/);
  });
});

describe('Agent.executeStructured', () => {
  const Schema = z.object({ answer: z.number() });

  it('retorna el objeto validado y solicita formato json_schema al proveedor', async () => {
    const agent = new TestAgent(['{"answer":42}']);

    const result = await agent.runStructured('pregunta', Schema);

    expect(result).toEqual({ answer: 42 });
    expect(agent.queuedProvider.requests[0].responseFormat?.type).toBe('json_schema');
  });

  it('acepta JSON con cercos de código', async () => {
    const agent = new TestAgent(['```json\n{"answer":7}\n```']);

    await expect(agent.runStructured('q', Schema)).resolves.toEqual({ answer: 7 });
  });

  it('reintenta con feedback cuando la primera salida es inválida', async () => {
    const agent = new TestAgent(['lorem ipsum sin json', '{"answer":9}']);

    const result = await agent.runStructured('pregunta', Schema);

    expect(result).toEqual({ answer: 9 });
    expect(agent.queuedProvider.requests).toHaveLength(2);

    const secondCallMessages = agent.queuedProvider.requests[1].messages;
    const feedbackMessage = secondCallMessages.at(-1);
    expect(feedbackMessage?.role).toBe('user');
    expect(feedbackMessage?.content).toContain('NO cumple el esquema');
    expect(
      secondCallMessages.some(
        (m: any) => m.role === 'assistant' && m.content === 'lorem ipsum sin json',
      ),
    ).toBe(true);
  });

  it('lanza StructuredOutputError tras agotar los intentos', async () => {
    const agent = new TestAgent(['mal 1', 'mal 2']);

    const error = await agent.runStructured('pregunta', Schema).catch((e) => e);

    expect(error).toBeInstanceOf(StructuredOutputError);
    expect(error.agentName).toBe('Test Agent');
    expect(error.attempts).toBe(2);
    expect(error.lastRawOutput).toBe('mal 2');
  });
});
