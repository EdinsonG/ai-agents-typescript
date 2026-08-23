import type { Skill } from '@/core/Skill.js';

export const PCI_DSS_SKILL: Skill = {
  id: 'pci-dss',
  name: 'Cumplimiento PCI-DSS',
  description:
    'Para funcionalidades que procesan, almacenan o transmiten datos de tarjetas de pago.',
  instructions: `
Cuando la funcionalidad involucre datos de tarjetas o pagos, aplica obligatoriamente:
- NUNCA almacenar PAN completo, CVV/CVC ni datos sensibles de autenticación; solo tokens de pasarela (Stripe/Braintree) y últimos 4 dígitos para display.
- Minimiza el alcance del cumplimiento (scope reduction): los formularios de tarjeta deben vivir en elementos iframe alojados por la pasarela; el servidor nunca ve el número.
- Autenticación reforzada (SCA/3D Secure 2) en transacciones europeas o de riesgo.
- Cifrado TLS 1.2+ en tránsito y AES-256 en reposo para cualquier dato relacionado; nunca loguear payloads de pago.
- Define qué evidencias de cumplimiento se necesitan: segmentación de red, rotación de claves, auditoría de acceso a zonas de pago.
- En criterios de aceptación incluye al menos un escenario de intento de manipulación de montos/moneda desde el cliente.`,
};

export const WSJF_SKILL: Skill = {
  id: 'wsjf',
  name: 'Priorización WSJF',
  description:
    'Weighted Shortest Job First (SAFe) para ordenar backlog cuando hay múltiples iniciativas.',
  instructions: `
Al priorizar con WSJF, calcula el Cost of Delay (CoD) por cada ítem:
CoD = Valor de negocio + Criticidad temporal (time criticality) + Reducción de riesgo/oportunidad
Prioridad = CoD / Tamaño del trabajo (story points estimados).
- Presenta una tabla: ítem | valor (1-20) | criticidad temporal (1-20) | reducción de riesgo (1-20) | tamaño (puntos) | WSJF resultante, ordenada descendente.
- Justifica brevemente cada puntuación alta (≥13) o baja (≤5); no inventes precisión falsa: usa rangos si la incertidumbre es alta.
- Señala explícitamente qué ítems son dependencias bloqueantes de otros, porque alteran la cola aunque su WSJF sea medio.
- Recuerda el principio: lo óptimo es maximizar el flujo, no cada elemento individual.`,
};

export const RICE_SKILL: Skill = {
  id: 'rice',
  name: 'Puntuación RICE',
  description:
    'Framework de priorización Reach/Impact/Confidence/Effort para features orientadas a crecimiento.',
  instructions: `
Al priorizar con RICE:
RICE = (Alcance × Impacto × Confianza) / Esfuerzo.
- Alcance: usuarios/clientes afectados por periodo (número real o estimado con base declarada).
- Impacto: 3 = masivo, 2 = alto, 1 = medio, 0.5 = bajo, 0.25 = mínimo.
- Confianza: 100% (datos propios), 80% (datos de industria), 50% (intuición). Si es <50%, recomienda validar antes de construir.
- Esfuerzo: persona-semanas.
- Muestra tabla ordenada por RICE e indica qué hipótesis baratas pueden testearse primero para subir la confianza.`,
};
