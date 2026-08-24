import type { Skill } from '@/types/index.js';

/**
 * Skills del stack React/Next.js. Centralizadas en el registro global:
 * cualquier agente puede activarlas y se inyectan solo en la petición
 * que las solicita (no gravan el system prompt de cada llamada).
 */

export const REACT_HOOK_FORM_ZOD_SKILL: Skill = {
  id: 'react-hook-form-zod',
  name: 'Formularios React Hook Form + zod',
  description:
    'Validación de formularios con react-hook-form + zodResolver, esquemas compartidos cliente/servidor.',
  instructions: `
Formularios SIEMPRE con React Hook Form + zod:
- useForm tipado con el esquema zod y resolver zodResolver de @hookform/resolvers/zod.
- El esquema vive en schema.ts junto al feature y SE REUTILIZA en el servidor (Server Action o Route Handler) para validación doble sin duplicar reglas.
- Errores por campo con formState.errors; accesibilidad obligatoria: aria-invalid, aria-describedby apuntando al mensaje, labels asociados.
- UX de envío: isSubmitting para deshabilitar el botón, isDirty para avisos de salida.
- Campos controlados solo cuando haga falta vía Controller; el resto con register.`,
};

export const ZUSTAND_PERSIST_SKILL: Skill = {
  id: 'zustand-persist',
  name: 'Estado y persistencia con Zustand',
  description:
    'Stores Zustand por feature, selectores finos y persistencia segura con middleware persist.',
  instructions: `
Estado global de cliente SIEMPRE con Zustand:
- Un store por feature en stores/useXStore.ts; acciones dentro del store (set/get), componentes consumiendo con selectores finos para minimizar re-renders.
- Persistencia con middleware persist + createJSONStorage según sensibilidad: localStorage para preferencias y borradores; cookie NO sensitiva solo si el dato es necesario en SSR; JAMÁS tokens ni datos personales en localStorage/sessionStorage.
- No duplicar en el store datos que ya viven en el servidor: la caché de RSC/fetch manda; Zustand es estado de UI/cliente.
- Prohibido Redux/MobX salvo petición explícita del usuario.`,
};

export const NEXT_INTL_COOKIE_SKILL: Skill = {
  id: 'next-intl-cookie',
  name: 'Multilenguaje next-intl por cookie',
  description:
    'i18n con next-intl resuelto por cookie NEXT_LOCALE, sin prefijo de locale en las URLs.',
  instructions: `
Multilenguaje SIEMPRE con next-intl resuelto POR COOKIE, nunca por URL:
- Sin segmento [locale] ni prefijos /es //en: una sola ruta por página.
- Middleware lee la cookie NEXT_LOCALE; si no existe, negocia con Accept-Language una única vez y la fija.
- getRequestConfig obtiene el locale con await cookies() de next/headers; mensajes en messages/{locale}.json organizados por namespace de feature.
- useTranslations en Client Components; getTranslations en Server Components y Server Actions.
- Cambio de idioma: Server Action que escribe la cookie y revalida — NUNCA navegación a una ruta duplicada.`,
};

export const NEXT_SERVER_COOKIES_SKILL: Skill = {
  id: 'next-server-cookies',
  name: 'Cookies de servidor con next/headers',
  description:
    'Lectura/escritura de cookies exclusivamente en el servidor con next/headers y opciones seguras.',
  instructions: `
Cookies de servidor SOLO vía next/headers:
- Lectura con await cookies() (API asíncrona en Next 15+) dentro de Server Components, Server Actions o Route Handlers.
- Escritura y borrado EXCLUSIVAMENTE en Server Actions o Route Handlers; jamás desde Client Components.
- Opciones según caso: httpOnly para sesión/autenticación, secure en producción, sameSite:'lax' por defecto, maxAge/expires explícito y path correcto.
- Cookies sensibles nunca legibles desde JS de cliente; las preferencias no sensibles sí pueden serlo.`,
};
