import { SkillRegistry } from '@/core/SkillRegistry.js';
import { PCI_DSS_SKILL, RICE_SKILL, WSJF_SKILL } from './productSkills.js';
import {
  ANGULAR_SIGNALS_SKILL,
  CORE_WEB_VITALS_SKILL,
  REACT_SERVER_FIRST_SKILL,
} from './frontendSkills.js';
import {
  HEXAGONAL_NESTJS_SKILL,
  OWASP_API_TOP10_SKILL,
  WCAG_FORMS_SKILL,
} from './backendUxSkills.js';

/**
 * Registro global de skills compartido por todos los agentes.
 * Los agentes lo reciben por defecto; los tests pueden inyectar uno propio.
 */
export const skillRegistry = new SkillRegistry()
  .register(PCI_DSS_SKILL)
  .register(WSJF_SKILL)
  .register(RICE_SKILL)
  .register(CORE_WEB_VITALS_SKILL)
  .register(REACT_SERVER_FIRST_SKILL)
  .register(ANGULAR_SIGNALS_SKILL)
  .register(HEXAGONAL_NESTJS_SKILL)
  .register(OWASP_API_TOP10_SKILL)
  .register(WCAG_FORMS_SKILL);

export {
  ANGULAR_SIGNALS_SKILL,
  CORE_WEB_VITALS_SKILL,
  HEXAGONAL_NESTJS_SKILL,
  OWASP_API_TOP10_SKILL,
  PCI_DSS_SKILL,
  REACT_SERVER_FIRST_SKILL,
  RICE_SKILL,
  WCAG_FORMS_SKILL,
  WSJF_SKILL,
};
