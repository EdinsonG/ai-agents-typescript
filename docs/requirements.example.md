# Requerimientos del Proyecto — Ejemplo Completo

> Este archivo es un ejemplo completo de cómo estructurar `requirements.md`.
> Copia este archivo a la raíz del proyecto como `requirements.md` y edítalo
> según tu proyecto. Cada sección `##` corresponde a un agente o pipeline.
>
> **Regla de oro:** cuanta más contexto des al agente, mejor será el resultado.
> Incluye restricciones técnicas, criterios de seguridad y métricas de éxito cuando apliquen.

---

## po

Sistema de gestión de inventarios para cadena de tiendas de ropa con presencia internacional:

**Contexto de negocio:**
- Cadena de 15 tiendas en Latinoamérica
- 50,000 SKUs activos con variaciones de talla/color
- Equipo de 3 desarrolladores fullstack
- MVP en 6 semanas, Fase 2 en 3 meses

**Funcionalidades core:**
- CRUD de productos con categorías, tallas, colores y precios por sucursal
- Control de stock por sucursal con alertas de stock mínimo (configurable por categoría)
- Registro de entradas y salidas con trazabilidad completa (quién, cuándo, motivo, documentos adjuntos)
- Reportes de rotación de inventario por período y categoría
- Búsqueda avanzada con filtros múltiples (categoría, estado, rango de precios, sucursal)
- Importación masiva de productos vía CSV/Excel con validación

**Roles y permisos:**
- Administrador: acceso total, gestión de usuarios y configuración
- Gerente de sucursal: CRUD de productos de su sucursal, reportes, transferencias entre sucursales
- Operador de almacén: registro de movimientos, consulta de stock

**Requisitos técnicos:**
- Autenticación JWT con refresh tokens (expiración de 15 min para access, 7 días para refresh)
- API REST documentada con OpenAPI 3.1
- Paginación cursor-based para listados grandes
- Filtrado y ordenamiento en todos los listados

**Criterios de seguridad:**
- Validación de todos los inputs con zod en la frontera
- Rate limiting por usuario (100 req/min) y por IP (1000 req/min)
- Auditoría de acciones críticas (crear, editar, eliminar) con log estructurado
- RBAC con guards centralizados, nunca checks dispersos
- Sanitización de inputs para prevenir XSS y SQL injection

---

## react

Dashboard de inventario para gerentes de sucursal:

**Vista de resumen (home):**
- KPIs en tarjetas: productos con bajo stock (rojo), valor total del inventario, movimientos del día, productos más movidos
- Gráfico de líneas: tendencia de stock por categoría (últimos 30 días)
- Alertas destacadas: productos bajo mínimo, stock agotado, transferencias pendientes

**Tabla de productos:**
- Columnas visibles: nombre, SKU, categoría, stock total, precio, estado, acciones
- Búsqueda en tiempo real por nombre o SKU
- Filtros: categoría (multi-select), estado (activo/inactivo/agotado), rango de precios
- Paginación con 25 items por página
- Ordenamiento por cualquier columna
- Acciones por fila: editar, ver historial, desactivar

**Formulario de producto:**
- Creación en 3 pasos: datos básicos → variantes (talla/color/stock) → imágenes
- Validación en tiempo real con zod
- Autocompletado de categoría y proveedor
- Subida de imágenes con preview y drag & drop

**Notificaciones:**
- Toast notifications para acciones exitosas
- Banner de alerta cuando stock baja del mínimo configurable
- WebSocket para actualizaciones en tiempo real (stock changes)

**UX:**
- Modo oscuro con toggle persistente
- Responsive: desktop (1200px+), tablet (768px-1199px)
- Skeleton loaders durante carga de datos
- Empty states ilustrados para tablas vacías
- Loading states en botones de acción

**Stack:**
- React 19, App Router, Server Components por defecto
- TypeScript estricto
- Tailwind CSS v4
- React Hook Form + zod para formularios
- Zustand para estado global de UI
- next-intl para i18n (resuelto por cookie, sin prefijo URL)
- Tailwind CSS para estilos

---

## backend

API REST para el sistema de inventario:

**Endpoints:**

Productos:
- `GET /api/products` — Listado con paginación, filtros y ordenamiento
- `GET /api/products/:id` — Detalle de producto con variantes
- `POST /api/products` — Crear producto (solo admin/gerente)
- `PUT /api/products/:id` — Actualizar producto
- `DELETE /api/products/:id` — Soft delete (solo admin)
- `GET /api/products/:id/stock` — Stock por sucursal
- `POST /api/products/import` — Importación masiva CSV/Excel

Categorías:
- CRUD completo con árbol de categorías (padre/hijo)

Sucursales:
- CRUD de sucursales con geolocalización
- `GET /api/branches/:id/dashboard` — KPIs de la sucursal

Movimientos:
- `POST /api/movements` — Registrar entrada/salida/transferencia
- `GET /api/movements` — Historial con filtros por tipo, fecha, producto
- `GET /api/movements/:id` — Detalle con trazabilidad

Reportes:
- `GET /api/reports/rotation` — Rotación por período y categoría
- `GET /api/reports/stock-by-branch` — Stock consolidado
- `GET /api/reports/alerts` — Productos bajo mínimo

**Autenticación y autorización:**
- JWT con roles: admin, gerente, operador
- Guards centralizados con políticas por recurso
- Refresh token rotation con detección de reuso

**Seguridad:**
- Rate limiting configurable por endpoint y rol
- Validación de inputs con zod en cada endpoint
- Logging estructurado (JSON) con correlación de requests (X-Request-ID)
- Helmet para headers de seguridad
- CORS explícito por origen

**Manejo de errores:**
- Errores tipados del dominio mapeados a HTTP en filtro centralizado
- 400 con detalle por campo en validación
- 401/403 para auth/authz
- 404 para recursos no encontrados
- 409 para conflictos (duplicados, race conditions)
- 429 para rate limiting
- 500 sin stack traces al cliente

**Infraestructura:**
- PostgreSQL 15 con migraciones
- Redis para sesiones y cache de queries frecuentes
- Health check en `GET /health`
- Métricas para Prometheus en `GET /metrics`

**Testing:**
- Tests de integración con Supertest contra app factory
- Mock de base de datos para tests unitarios
- Cobertura mínima: 80% statements, 75% branches

---

## uxui

Rediseño del módulo de inventario:

**Problema actual:**
- La tabla de productos tiene 20 columnas visibles, overwhelming para usuarios
- No hay filtros, solo búsqueda por nombre exacto
- El formulario de creación tiene 30 campos en una sola página sin agrupación lógica
- Los reportes son CSV descargados manualmente, sin visualización interactiva
- No hay feedback de acciones (éxito/error) ni loading states
- Tiempo promedio para crear un producto: 4 minutos
- Tasa de error en creación: 35% (campos obligatorios olvidados)

**Objetivos de diseño:**
- Reducir tiempo de búsqueda de un producto de 2 minutos a 10 segundos
- Simplificar la tabla mostrando solo 6 columnas clave + columna de acciones
- Formulario de creación en 3 pasos con progreso visual: datos básicos → variantes → imágenes
- Dashboard con gráficos interactivos en lugar de CSV
- Accesibilidad WCAG 2.2 AA completa

**Componentes a diseñar:**
- KPI cards con tendencia (flecha arriba/abajo)
- Tabla de productos con bulk actions
- Formulario multi-paso con validación inline
- Filtros laterales (sidebar) con chips activos
- Modal de confirmación para acciones destructivas
- Empty states ilustrados
- Skeleton loaders

**Design tokens:**
- Paleta de colores con contraste verificado (≥4.5:1)
- Escala tipográfica modular
- Espaciado en base 8pt
- Estados completos por componente: default, hover, focus-visible, active, disabled, loading, empty, error

**Métricas de éxito:**
- Task success rate > 90% en prueba de usabilidad
- Tiempo en tarea < 30 segundos para crear un producto
- Tasa de error en creación < 10%
- NPS > 8/10 en encuesta post-lanzamiento

---

## qa

Módulo de checkout con pago con tarjeta:

**Alcance del módulo:**
- Carrito de compras con cantidades, actualizar y eliminar items
- Formulario de datos de envío (nombre, dirección, ciudad, código postal, teléfono)
- Resumen de compra con desglose: subtotal, envío, impuestos, total
- Pasarela de pago con tarjeta de crédito/débito (integración con Stripe)
- Confirmación de pedido por email
- Historial de pedidos del usuario

**Flujo principal:**
1. Usuario revisa carrito → modifica cantidades o elimina items
2. Ingresa datos de envío → validación en tiempo real
3. Revisa resumen de compra
4. Ingresa datos de tarjeta → redirección a Stripe Elements
5. Confirmación exitosa → email de confirmación + limpieza de carrito
6. Error en pago → mensagem amigable + opción de reintentar

**Casos de error a cubrir:**
- Carrito vacío al intentar checkout
- Stock insuficiente al momento de pagar
- Datos de envío inválidos
- Tarjeta rechazada / fondos insuficientes
- Timeout de la pasarela de pago
- Error de red durante el pago
- Doble click en "Pagar" (idempotencia)
- Sesión expirada durante el checkout

**Seguridad:**
- PCI-DSS: nunca almacenar PAN completo, CVV ni datos sensibles
- Formulario de tarjeta en iframe de Stripe (scope reduction)
- TLS 1.2+ en tránsito
- Tokenización de datos de pago
- Rate limiting en endpoint de pago

**Requerimientos de testing:**
- Plan de testing que cubra: unit, integration, E2E, performance, security
- Casos de prueba para happy path y cada caso de error listado
- Scenarios de edge cases: cantidades extremas, productos con precio 0, envío gratis
- Validación de accesibilidad en formularios (WCAG 2.2 AA)
- Performance: checkout completo < 3 segundos en conexión normal
- Seguridad: intento de manipulación de montos desde el cliente

---

## pipeline

Sistema completo de gestión de inventarios para cadena de tiendas de ropa.

Incluye:
- Backend API con endpoints CRUD, autenticación, reportes y webhooks
- Dashboard React con tabla de productos, formularios y notificaciones
- Diseño UX completo con design tokens, componentes y estados

Ver secciones individuales (`## po`, `## react`, `## backend`, `## uxui`, `## qa`)
para detalles específicos de cada capa.

**Prioridad:** MVP en 6 semanas con funcionalidad core (CRUD + stock + reportes básicos).
**Fase 2:** notificaciones, importación masiva, analytics avanzado, multi-idioma.
