import { z } from 'zod';

/**
 * Esquema compartido para suites de pruebas unitarias generadas por los agentes.
 * Cada especialidad (React, Backend) lo instancia con su stack de testing.
 */

export const UnitTestFileSchema = z.object({
  /** Ruta convencional del archivo de prueba (ej. src/components/X.test.tsx) */
  path: z.string().min(1),
  description: z.string().min(1),
  /** Código de prueba completo y listo para ejecutar */
  code: z.string().min(20),
});

export const UnitTestSuiteSchema = z.object({
  /** Qué se está testeando (componente, hook, servicio, endpoint...) */
  target: z.string().min(1),
  framework: z.enum(['vitest', 'jest']),
  /** Librerías auxiliares requeridas (ej. @testing-library/react, supertest) */
  libraries: z.array(z.string().min(1)).min(1),
  testFiles: z.array(UnitTestFileSchema).min(1),
  /** Comandos exactos para correr las pruebas */
  runCommands: z.array(z.string().min(1)).min(1),
  /** Qué escenarios cubre la suite (camino feliz, bordes, errores...) */
  coverageFocus: z.array(z.string().min(1)).min(2),
});

export type UnitTestFile = z.infer<typeof UnitTestFileSchema>;
export type UnitTestSuite = z.infer<typeof UnitTestSuiteSchema>;
