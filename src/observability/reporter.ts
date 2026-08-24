import type { ObservabilitySummary } from '@/types/index.js';

/**
 * Formatea el resumen de consumo para consola/CI.
 */
export function formatUsageSummary(summary: ObservabilitySummary): string {
  const lines: string[] = [];

  lines.push('📈 Consumo de la ejecución');
  lines.push('─'.repeat(64));
  lines.push(
    `Llamadas: ${summary.totalCalls} (ok ${summary.okCalls} / fallos ${summary.failedCalls}) · latencia media ${summary.avgLatencyMs}ms`,
  );
  lines.push(
    `Tokens: ${summary.totalTokens.toLocaleString('es')} total (prompt ${summary.promptTokens.toLocaleString('es')} · completion ${summary.completionTokens.toLocaleString('es')})`,
  );
  lines.push(`Costo estimado: $${summary.estimatedCostUsd.toFixed(4)} USD`);

  if (summary.byAgent.length > 0) {
    lines.push('Por agente:');
    for (const agent of summary.byAgent) {
      lines.push(
        `  · ${agent.agentName}: ${agent.calls} llamada(s), ${agent.totalTokens.toLocaleString('es')} tokens, $${agent.estimatedCostUsd.toFixed(4)}, ${agent.avgLatencyMs}ms`,
      );
    }
  }
  lines.push('─'.repeat(64));

  return lines.join('\n');
}
