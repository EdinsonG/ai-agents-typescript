import { describe, expect, it } from 'vitest';
import { SYSTEM_PROMPT as BACKEND_PROMPT } from '@/agents/BackendNode/prompt.js';
import { SYSTEM_PROMPT as ANGULAR_PROMPT } from '@/agents/FrontendAngular/prompt.js';
import { SYSTEM_PROMPT as REACT_PROMPT } from '@/agents/FrontendReact/prompt.js';
import { SYSTEM_PROMPT as PO_PROMPT } from '@/agents/TechnicalPO/prompt.js';
import { SYSTEM_PROMPT as UXUI_PROMPT } from '@/agents/UXUI/prompt.js';
import { LANGUAGE_RULES } from '@/prompts/languageRules.js';
import { skillRegistry } from '@/skills/index.js';

const PROMPTS: Array<[string, string]> = [
  ['TechnicalPO', PO_PROMPT],
  ['FrontendReact', REACT_PROMPT],
  ['FrontendAngular', ANGULAR_PROMPT],
  ['BackendNode', BACKEND_PROMPT],
  ['UXUI', UXUI_PROMPT],
];

describe('regla de idioma centralizada', () => {
  it.each(PROMPTS)('%s compone el bloque idéntico de REGLAS DE IDIOMA', (_name, prompt) => {
    expect(prompt).toContain(LANGUAGE_RULES);
    expect(prompt).toContain('estrictamente en español');
  });

  it('el bloque se definió una sola vez y no tiene variantes', () => {
    expect(LANGUAGE_RULES).toContain('REGLAS DE IDIOMA');
    expect(LANGUAGE_RULES.match(/REGLAS DE IDIOMA/g)).toHaveLength(1);

    // Todas las variantes antiguas desaparecieron: solo existe la unificada
    const allPrompts = PROMPTS.map(([, prompt]) => prompt).join('\n---\n');
    expect(allPrompts.match(/Escribe todas tus respuestas/g)).toHaveLength(5);
    expect(allPrompts).not.toContain('análisis, historias de usuario y tareas estrictamente');
    expect(allPrompts).not.toContain('especificaciones estrictamente');
  });

  it('el bloque es invariante: no es una skill del registro', () => {
    // El idioma aplica al 100% de las respuestas; las skills son opt-in
    expect(skillRegistry.get('language-rules')).toBeUndefined();
  });
});
