import type { UserStoryDeliverable } from '@/agents/TechnicalPO/schema.js';
import type { DesignSpec } from '@/agents/UXUI/schema.js';

/**
 * Serializa entregables estructurados en briefs de texto que alimentan
 * al siguiente agente del pipeline (handoffs con contexto compartido).
 */

export function buildUxBrief(requirement: string, story: UserStoryDeliverable): string {
  const criteria = story.acceptanceCriteria
    .map((c) => `- ${c.scenario}: Dado ${c.given}, cuando ${c.when}, entonces ${c.then}`)
    .join('\n');

  return [
    'Diseña la solución UX/UI para la siguiente funcionalidad, asegurando soporte a los criterios de aceptación indicados:',
    requirement,
    '',
    `## HISTORIA DE PRODUCTO: ${story.title}`,
    `Como ${story.userStory.asA}, quiero ${story.userStory.iWant}, para ${story.userStory.soThat}.`,
    '',
    '## CRITERIOS DE ACEPTACIÓN QUE EL DISEÑO DEBE SOPORTAR',
    criteria,
    '',
    `## CONTEXTO TÉCNICO`,
    story.technicalContext.securityCompliance,
  ].join('\n');
}

export function buildFrontendBrief(
  requirement: string,
  story: UserStoryDeliverable,
  design?: DesignSpec,
): string {
  const frontendTasks = story.tasks
    .filter((task) => task.area === 'frontend')
    .map((task) => `- ${task.description}`)
    .join('\n');

  const sections = [
    'Implementa la siguiente funcionalidad en React:',
    requirement,
    '',
    `## HISTORIA DE PRODUCTO: ${story.title}`,
    `Como ${story.userStory.asA}, quiero ${story.userStory.iWant}, para ${story.userStory.soThat}.`,
  ];

  if (frontendTasks) {
    sections.push('', '## TAREAS FRONTEND DEFINIDAS POR EL PRODUCT OWNER', frontendTasks);
  }

  if (design) {
    const colors = design.designTokens.colors
      .map((color) => `${color.name} ${color.hex} (contraste ${color.contrastRatio}:1)`)
      .join('; ');
    const components = design.components
      .map(
        (component) =>
          `${component.name} [variantes: ${component.variants.join(', ')}; estados: ${component.states.join(', ')}]`,
      )
      .join('; ');

    sections.push(
      '',
      '## ESPECIFICACIÓN DE DISEÑO (del agente UX/UI)',
      `Resumen: ${design.solutionSummary}`,
      `Colores: ${colors}`,
      `Tipografía: ${design.designTokens.typographyScale} · Espaciado: ${design.designTokens.spacingScale}`,
      `Componentes: ${components}`,
      `Estados de interfaz requeridos: ${design.interfaceStates.join(', ')}`,
      `Accesibilidad obligatoria: ${design.accessibilityChecklist.join('; ')}`,
    );
  }

  return sections.join('\n');
}

export function buildBackendBrief(requirement: string, story: UserStoryDeliverable): string {
  const backendTasks = story.tasks
    .filter((task) => task.area === 'backend' || task.area === 'database')
    .map((task) => `- (${task.area}) ${task.description}`)
    .join('\n');

  return [
    'Diseña la API y arquitectura backend para la siguiente funcionalidad:',
    requirement,
    '',
    `## HISTORIA DE PRODUCTO: ${story.title}`,
    `Como ${story.userStory.asA}, quiero ${story.userStory.iWant}, para ${story.userStory.soThat}.`,
    '',
    '## REQUISITOS DE SEGURIDAD Y CUMPLIMIENTO',
    story.technicalContext.securityCompliance,
    ...(backendTasks
      ? ['', '## TAREAS BACKEND/DATOS DEFINIDAS POR EL PRODUCT OWNER', backendTasks]
      : []),
  ].join('\n');
}
