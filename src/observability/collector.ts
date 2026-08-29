import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from '@/core/config.js';
import type {
  AgentUsageSummary,
  CostRates,
  LLMCallRecord,
  ObservabilitySummary,
} from '@/types/index.js';

/** Tarifas de referencia (USD por millón de tokens) para llama-3.3-70b-versatile en Groq. */
export const DEFAULT_COST_RATES: CostRates = {
  inputUsdPerMTok: 0.59,
  outputUsdPerMTok: 0.79,
};

/**
 * Acumula registros de llamadas LLM y agrega métricas de consumo.
 * Los costos son estimaciones configurables: actualiza las tarifas según
 * los precios vigentes del modelo que uses.
 * Implementa ring buffer: al superar MAX_RECORDS se eliminan los más antiguos.
 */
export class ObservabilityCollector {
  private readonly records: LLMCallRecord[] = [];

  constructor(private readonly rates: CostRates = DEFAULT_COST_RATES) {}

  public record(record: LLMCallRecord): void {
    this.records.push(record);
    // Ring buffer: eliminar los más antiguos si se excede el límite
    if (this.records.length > config.maxObservabilityRecords) {
      this.records.splice(0, this.records.length - config.maxObservabilityRecords);
    }
  }

  public getRecords(): readonly LLMCallRecord[] {
    return this.records;
  }

  public clear(): void {
    this.records.length = 0;
  }

  public summary(): ObservabilitySummary {
    const byAgent = new Map<string, AgentUsageSummary>();
    const latencyByAgent = new Map<string, number>();
    let promptTokens = 0;
    let completionTokens = 0;
    let totalLatencyMs = 0;
    let okCalls = 0;
    let estimatedCostUsd = 0;

    for (const record of this.records) {
      promptTokens += record.usage.promptTokens;
      completionTokens += record.usage.completionTokens;
      totalLatencyMs += record.latencyMs;
      if (record.ok) okCalls++;
      estimatedCostUsd += this.estimateRecordCost(record);

      const agent = byAgent.get(record.agentName) ?? {
        agentName: record.agentName,
        calls: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
        avgLatencyMs: 0,
      };
      agent.calls++;
      agent.promptTokens += record.usage.promptTokens;
      agent.completionTokens += record.usage.completionTokens;
      agent.totalTokens += record.usage.totalTokens;
      agent.estimatedCostUsd += this.estimateRecordCost(record);
      byAgent.set(record.agentName, agent);
      latencyByAgent.set(
        record.agentName,
        (latencyByAgent.get(record.agentName) ?? 0) + record.latencyMs,
      );
    }

    for (const agent of byAgent.values()) {
      const agentLatency = latencyByAgent.get(agent.agentName) ?? 0;
      agent.avgLatencyMs = agent.calls === 0 ? 0 : Math.round(agentLatency / agent.calls);
    }

    return {
      totalCalls: this.records.length,
      okCalls,
      failedCalls: this.records.length - okCalls,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCostUsd: round4(estimatedCostUsd),
      avgLatencyMs:
        this.records.length === 0 ? 0 : Math.round(totalLatencyMs / this.records.length),
      byAgent: [...byAgent.values()]
        .map((agent) => ({ ...agent, estimatedCostUsd: round4(agent.estimatedCostUsd) }))
        .sort((a, b) => b.totalTokens - a.totalTokens),
    };
  }

  /** Exporta los registros en formato JSON Lines (un objeto por línea). */
  public toJSONL(): string {
    return this.records.map((record) => JSON.stringify(record)).join('\n');
  }

  /**
   * Saves records to a JSONL file.
   */
  public saveToFile(filePath: string): void {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, this.toJSONL(), 'utf-8');
  }

  /**
   * Loads records from a JSONL file, appending to existing records.
   */
  public loadFromFile(filePath: string): void {
    if (!existsSync(filePath)) return;

    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      try {
        const record = JSON.parse(line) as LLMCallRecord;
        this.record(record);
      } catch {
        // Skip malformed lines
      }
    }
  }

  /**
   * Exports the summary as a JSON object.
   */
  public toJSON(): ObservabilitySummary {
    return this.summary();
  }

  private estimateRecordCost(record: LLMCallRecord): number {
    return (
      (record.usage.promptTokens / 1_000_000) * this.rates.inputUsdPerMTok +
      (record.usage.completionTokens / 1_000_000) * this.rates.outputUsdPerMTok
    );
  }
}

/** Collector global: los agentes sin collector propio registran aquí. */
export const globalCollector = new ObservabilityCollector();

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
