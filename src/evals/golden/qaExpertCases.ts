import type { EvalCase } from '@/types/index.js';

export const QA_EXPERT_CASES: EvalCase[] = [
  {
    id: 'qa-test-plan-api-rest',
    input:
      'Crear un plan de testing completo para una API REST de gestión de usuarios con: CRUD, autenticación JWT, roles (admin/user), rate-limiting y paginación.',
    threshold: 65,
    rubric: [
      {
        id: 'analisis-riesgos',
        requirement:
          'Incluye análisis de riesgos identificando áreas críticas: autenticación, autorización, rate-limiting y data validation.',
      },
      {
        id: 'estrategia-testing',
        requirement:
          'Define estrategias diferenciadas: unitarias para lógica de negocio, integración para endpoints, E2E para flujos completos, seguridad para auth.',
      },
      {
        id: 'casos-prueba-detallados',
        requirement:
          'Genera casos de prueba con precondiciones, pasos detallados, resultado esperado y prioridad. Cubre happy-path, edge cases y error paths.',
      },
      {
        id: 'quality-gates',
        requirement:
          'Define quality gates para cada fase: build (lint + unit tests), staging (integration + security), producción (performance + monitoring).',
      },
    ],
  },
  {
    id: 'qa-bug-bash-e-commerce',
    input:
      'Realiza un bug bash sobre un checkout de e-commerce que incluye: carrito de compras, selección de envío, pago con tarjeta y confirmación de pedido.',
    threshold: 65,
    rubric: [
      {
        id: 'bugs-seguridad',
        requirement:
          'Identifica al menos 2 bugs de seguridad: XSS en campos de entrada, CSRF en formularios, inyección en queries, o exposición de datos sensibles.',
      },
      {
        id: 'bugs-usabilidad',
        requirement:
          'Identifica al menos 2 bugs de usabilidad: estados de carga faltantes, mensajes de error poco claros, navegación confusa, o feedback visual ausente.',
      },
      {
        id: 'bugs-reproduccion',
        requirement:
          'Cada bug incluye pasos exactos para reproducir, comportamiento esperado vs actual, y severidad clasificada.',
      },
      {
        id: 'recomendaciones',
        requirement:
          'Proporciona recomendaciones concretas priorizadas por impacto, no solo descripción de problemas.',
      },
    ],
  },
  {
    id: 'qa-code-review-seguridad',
    input: [
      'Revisa este código de autenticación:',
      '```',
      'app.post("/login", async (req, res) => {',
      '  const { email, password } = req.body;',
      '  const user = await db.query("SELECT * FROM users WHERE email = " + email);',
      '  if (user && user.password === password) {',
      '    const token = jwt.sign({ id: user.id }, "secret123");',
      '    res.json({ token });',
      '  } else {',
      '    res.status(401).json({ error: "Credenciales inválidas" });',
      '  }',
      '});',
      '```',
    ].join('\n'),
    threshold: 70,
    rubric: [
      {
        id: 'sql-injection',
        requirement:
          'Detecta la vulnerabilidad de SQL injection por interpolación de strings en la query.',
      },
      {
        id: 'password-plain',
        requirement:
          'Identifica que las contraseñas se comparan en texto plano sin hashing (bcrypt/argon2).',
      },
      {
        id: 'jwt-secret-hardcoded',
        requirement:
          'Detecta el secret JWT hardcodeado y recomienda variables de entorno + rotación.',
      },
      {
        id: 'fix-concreto',
        requirement:
          'Proporciona código corregido o fragmentos específicos para los problemas críticos encontrados.',
      },
    ],
  },
  {
    id: 'qa-testing-accesibilidad',
    input:
      'Diseña la estrategia de testing de accesibilidad para un formulario de registro multi-paso con 4 secciones: datos personales, dirección, preferencias y confirmación.',
    threshold: 65,
    rubric: [
      {
        id: 'wcag-criterios',
        requirement:
          'Menciona criterios WCAG 2.1 AA específicos aplicables: percepción, operabilidad, comprensión, robustez.',
      },
      {
        id: 'herramientas',
        requirement:
          'Incluye herramientas de testing: axe-core, Lighthouse, testing de navegación por teclado, screen reader simulation.',
      },
      {
        id: 'casos-accesibilidad',
        requirement:
          'Define casos específicos: focus management entre pasos, aria labels, contraste de colores, mensajes de error accesibles.',
      },
      {
        id: 'automatizacion',
        requirement:
          'Propone estrategia de automatización con herramientas específicas y cuándo usar testing manual vs automatizado.',
      },
    ],
  },
  {
    id: 'qa-performance-testing',
    input:
      'Diseña la estrategia de performance testing para una API que maneja 10,000 requests/minuto con consultas a base de datos y caché Redis.',
    threshold: 65,
    rubric: [
      {
        id: 'tipos-testing',
        requirement:
          'Distingue entre load testing, stress testing y soak testing con objetivos específicos para cada uno.',
      },
      {
        id: 'metricas',
        requirement:
          'Define métricas concretas: latencia p50/p95/p99, throughput, error rate, tiempo de respuesta de DB vs cache.',
      },
      {
        id: 'herramientas',
        requirement:
          'Recomienda herramientas específicas: k6, Artillery, o equivalentes con justificación.',
      },
      {
        id: 'escenarios',
        requirement:
          'Propone escenarios realistas: pico súbito, carga gradual, soup testing de 24h, y benchmarks de regresión.',
      },
    ],
  },
];
