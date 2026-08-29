# Requerimientos del Proyecto

> Este archivo define los requerimientos que cada agente procesará.
> Edita las secciones según tu proyecto. Cada sección `##` corresponde
> a un agente o pipeline disponible.

---

## po

Sistema de gestión de inventarios para cadena de tiendas de ropa:

- CRUD de productos con categorías, tallas, colores y precios
- Control de stock por sucursal con alertas de stock mínimo
- Registro de entradas y salidas con trazabilidad (quién, cuándo, motivo)
- Reportes de rotación de inventario por período y categoría
- Roles: administrador, gerente de sucursal, operador de almacén
- Autenticación JWT con refresh tokens
- API REST documentada con OpenAPI

Criterios de seguridad:
- Validación de todos los inputs con zod
- Rate limiting por usuario (100 req/min)
- Auditoría de acciones críticas (crear, editar, eliminar)

---

## react

Dashboard de inventario para gerentes de sucursal:

- Vista de resumen con KPIs: productos con bajo stock, valor total del inventario, movimientos del día
- Tabla de productos con búsqueda, filtros por categoría/estado y paginación
- Formulario de producto con edición en línea de precio y stock
- Gráfico de barras: top 10 productos más vendidos del mes
- Notificaciones en tiempo real cuando stock baja del mínimo
- Modo oscuro y responsive (desktop + tablet)
- Skeleton loaders durante carga de datos

Stack: React 18+, TypeScript estricto, TailwindCSS, React Query para server state.

---

## angular

Módulo de administración para gerentes de cadena:

- Dashboard con métricas agregadas de todas las sucursales
- Gestión de usuarios: crear, editar, asignar roles y permisos
- Configuración de alertas de stock mínimo por categoría y sucursal
- Importación masiva de productos desde CSV/Excel
- Auditoría: historial de acciones con filtros por fecha, usuario y tipo

Stack: Angular 17+, standalone components, signals, OnPush change detection,
Reactive Forms tipados, Angular Material.

---

## backend

API REST para el sistema de inventario:

- Endpoints CRUD para productos, categorías, sucursales y movimientos
- Autenticación JWT con roles (admin, gerente, operador)
- Paginación, filtrado y ordenamiento en listados
- Endpoints de reportes: stock por sucursal, rotación, movimientos
- Webhooks para notificar cambios de stock a sistemas externos
- Rate limiting configurables por endpoint y rol
- Logging estructurado (JSON) con correlación de requests
- Health check y métricas para Prometheus

Base de datos: PostgreSQL 15, migraciones con Flyway o Knex.
Cache: Redis para sesiones y queries frecuentes.

---

## uxui

Rediseño del módulo de inventario:

**Problema actual:**
- La tabla de productos tiene 20 columnas visibles, overwhelmed para usuarios
- No hay filtros, solo búsqueda por nombre exacto
- El formulario de creación tiene 30 campos en una sola página
- Los reportes son CSV descargados manualmente

**Objetivos:**
- Reducir tiempo de búsqueda de un producto de 2 minutos a 10 segundos
- Simplificar la tabla mostrando solo 6 columnas clave + actions
- Formulario de creación en 3 pasos: datos básicos → variantes → imágenes
- Dashboard con gráficos interactivos en lugar de CSV
- Accesibilidad WCAG 2.1 AA

**Métricas de éxito:**
- Task success rate > 90% en prueba de usabilidad
- Tiempo en tarea < 30 segundos para crear un producto
- NPS > 8/10 en encuesta post-lanzamiento

---

## pipeline

Sistema completo de gestión de inventarios para cadena de tiendas de ropa.
Incluye backend API, dashboard React, módulo administrativo Angular y
diseño UX de todos los módulos. Ver secciones individuales para detalles
específicos de cada capa.

Prioridad: MVP en 6 semanas con funcionalidad core (CRUD + stock + reportes básicos).
Fase 2: notificaciones, importación masiva, analytics avanzado.
