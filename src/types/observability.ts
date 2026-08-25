/**
 * Contratos de observabilidad: consumo de tokens, latencia y costo por llamada.
 */

import type { LLMErrorKind, TokenUsage } from './llm.js';

export type { TokenUsage };

/** Registro de una llamada al proveedor LLM. */
export interface LLMCallRecord {
  /** ISO 8601 del inicio de la llamada */
  timestamp: string;
  agentName: string;
  model: string;
  /** 'structured' cuando se solicitó salida json_schema */
  kind: 'text' | 'structured';
  ok: boolean;
  latencyMs: number;
  usage: TokenUsage;
  /** Presente solo cuando ok = false */
  errorKind?: LLMErrorKind;
}

export interface AgentUsageSummary {
  agentName: string;
  calls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  avgLatencyMs: number;
}

export interface ObservabilitySummary {
  totalCalls: number;
  okCalls: number;
  failedCalls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  avgLatencyMs: number;
  byAgent: AgentUsageSummary[];
}

/** Tarifas en USD por millón de tokens (entrada/salida). */
export interface CostRates {
  inputUsdPerMTok: number;
  outputUsdPerMTok: number;
}
