import { Skill } from '@/core/Skill.js';

/**
 * Registro centralizado de skills disponibles para los agentes.
 * Cada skill es un módulo de conocimiento experto inyectable por petición.
 */
export class SkillRegistry {
  private readonly skills = new Map<string, Skill>();

  public register(skill: Skill): this {
    if (this.skills.has(skill.id)) {
      throw new Error(`La skill "${skill.id}" ya está registrada`);
    }
    this.skills.set(skill.id, skill);
    return this;
  }

  public get(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  public get availableIds(): string[] {
    return [...this.skills.keys()];
  }

  /**
   * Resuelve una lista de ids a skills, lanzando error si alguna no existe.
   */
  public resolve(ids?: readonly string[]): Skill[] {
    if (!ids?.length) return [];
    return ids.map((id) => {
      const skill = this.skills.get(id);
      if (!skill) {
        throw new Error(`Skill desconocida: "${id}". Disponibles: ${this.availableIds.join(', ')}`);
      }
      return skill;
    });
  }

  /**
   * Compone las instrucciones de las skills en un bloque para anexar al system prompt.
   */
  public compose(ids?: readonly string[]): string {
    const skills = this.resolve(ids);
    if (!skills.length) return '';

    const blocks = skills.map(
      (skill) => `## SKILL ACTIVA: ${skill.name} (${skill.id})\n${skill.instructions.trim()}`,
    );

    return [
      '',
      '=== SKILLS EXPERTAS ACTIVAS PARA ESTA PETICIÓN ===',
      'Aplica estas instrucciones especializadas además de tu rol base:',
      blocks.join('\n\n'),
    ].join('\n');
  }
}
