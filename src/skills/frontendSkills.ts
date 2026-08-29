import type { Skill } from '@/types/index.js';

export const CORE_WEB_VITALS_SKILL: Skill = {
  id: 'core-web-vitals',
  name: 'Optimización Core Web Vitals',
  description: 'Estrategias concretas LCP/INP/CLS para interfaces React/Next.js.',
  instructions: `
En toda propuesta frontend, protege explícitamente las tres métricas:
- LCP: prioriza imagen hero con next/image (priority), preload de fuentes críticas, evita client components que bloqueen el primer render; el contenido principal debe ser Server Component.
- INP: divide tareas largas; virtualiza listas >100 filas (TanStack Virtual); debounced inputs; transiciones con useTransition para filtrados costosos; evita efectos que disparen re-renders en cascada.
- CLS: reserva espacio para imágenes/videos/embeds (aspect-ratio o width/height explícitos); skeletons de dimensiones idénticas al contenido final; nunca insertar banners encima de contenido ya pintado.
- En la sección de rendimiento, declara el presupuesto objetivo: LCP < 2.5s, INP < 200ms, CLS < 0.1 y cómo se verificaría (Lighthouse CI, web-vitals en producción).`,
};

export const REACT_SERVER_FIRST_SKILL: Skill = {
  id: 'react-server-first',
  name: 'Arquitectura Server-First (React 19)',
  description:
    'Decisiones rigurosas Server Component vs Client Component y estrategias de mutación.',
  instructions: `
Aplica disciplina server-first:
- Por defecto todo componente es Server Component; "use client" solo cuando exista interactividad real (estado local, eventos, browser APIs). Enumera qué componentes necesitan cliente y por qué.
- Mutaciones con Server Actions (+ useActionState/useOptimistic) antes que API routes + fetch manual. Si hay API route, justificar por qué (consumo externo, webhook).
- Data fetching en el servidor con fetch y estrategia de caché explícita (force-cache, no-store, revalidate: n, tags + revalidateTag) — nunca dejarla implícita.
- Pasa datos serializables de servidor a cliente como props; nunca funciones no serializables ni instancias de clase.
- Streaming: usa Suspense con fallbacks significativos por sección independiente, no un spinner global.
- Patrones de composición preferidos: pasar componentes servidor como children/props dentro de clientes ("component slots").`,
};
