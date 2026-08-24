import type { Skill } from '@/types/index.js';

/** Skills del stack Angular. Centralizadas en el registro global compartido. */

export const ANGULAR_STANDALONE_MODERN_SKILL: Skill = {
  id: 'angular-standalone-modern',
  name: 'Angular standalone y sintaxis moderna',
  description:
    'Componentes standalone + OnPush, control de flujo @if/@for/@defer, input()/output()/inject().',
  instructions: `
Disciplina moderna obligatoria en todo componente Angular:
- Standalone por defecto con ChangeDetectionStrategy.OnPush; NUNCA NgModules ni change detection por defecto.
- Sintaxis nueva en plantillas: @if/@for (con track)/@switch/@defer; prohibido *ngIf/*ngFor salvo código legacy que se esté migrando.
- APIs de signals: input() (con transform si aplica), output(), model(), viewChild(); inyección con inject(), nunca por constructor.
- @defer on idle/viewport para secciones pesadas (gráficos, tablas grandes) y presupuestos de bundle declarados.`,
};

export const ANGULAR_TYPED_FORMS_SKILL: Skill = {
  id: 'angular-typed-forms',
  name: 'Formularios tipados de Angular',
  description: 'Reactive Forms tipados, validadores personalizados y errores accesibles.',
  instructions: `
Formularios SIEMPRE con Reactive Forms tipados:
- FormBuilder/NonNullableFormBuilder con tipos inferidos del modelo; controls tipados, sin any.
- Validadores síncronos y asíncronos personalizados como funciones puras reutilizables; mensajes centralizados en un catálogo.
- Errores accesibles: aria-invalid, aria-describedby vinculado al mensaje, foco al primer campo inválido tras submit.
- Estados del formulario (touched/dirty/pending) para UX de validación sin agresividad mientras el usuario escribe.`,
};
