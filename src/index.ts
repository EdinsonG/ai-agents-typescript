/**
 * ai-agents-core — Library entry point.
 *
 * Usage:
 *   import { Agent, createAgent, ProductDeliveryPipeline } from 'ai-agents-core';
 */

// ── Core ──────────────────────────────────────────────────────────────
export { Agent } from '@/core/Agent.js';
export { LLMProvider } from '@/core/LLMProvider.js';
export { SkillRegistry, mergeSkillOptions } from '@/core/SkillRegistry.js';
export { ToolRegistry, executeToolCall } from '@/core/tools.js';
export { config, overrideConfig, type AppConfig } from '@/core/config.js';
export {
  LLMProviderError,
  StructuredOutputError,
  classifyProviderError,
  isRetryableKind,
} from '@/core/errors.js';
export { parseJsonLoose } from '@/core/json.js';
export { estimateTokens, estimateMessagesTokens, truncateMessages, DEFAULT_MAX_CONTEXT_TOKENS } from '@/core/tokens.js';

// ── Clients ───────────────────────────────────────────────────────────
export { createInferenceClient, KNOWN_BASE_URLS } from '@/core/clients/index.js';
export { OpenAICompatibleClient } from '@/core/clients/openAICompatibleClient.js';
export { AnthropicClient } from '@/core/clients/anthropicClient.js';
export { ProviderHttpError } from '@/core/clients/httpError.js';

// ── Agents ────────────────────────────────────────────────────────────
export { BackendNodeAgent } from '@/agents/BackendNode/BackendNodeAgent.js';
export { FrontendReactAgent, DEFAULT_REACT_STACK_SKILLS } from '@/agents/FrontendReact/FrontendReactAgent.js';
export { TechnicalPOAgent } from '@/agents/TechnicalPO/TechnicalPOAgent.js';
export { UXUIAgent } from '@/agents/UXUI/UXUIAgent.js';
export { AGENT_IDS, createAgent, type AgentId } from '@/agents/index.js';

// ── Skills ────────────────────────────────────────────────────────────
export { skillRegistry } from '@/skills/index.js';

// ── Orchestration ─────────────────────────────────────────────────────
export { ProductDeliveryPipeline } from '@/orchestration/pipeline.js';
export { buildUxBrief, buildFrontendBrief, buildBackendBrief } from '@/orchestration/briefs.js';

// ── Evals ─────────────────────────────────────────────────────────────
export { EvalRunner } from '@/evals/runner.js';
export { LLMJudge } from '@/evals/judge.js';
export { computeScorePercent, toVerdictList } from '@/evals/scoring.js';
export { formatSuiteReport, formatSuiteReportJson } from '@/evals/reporter.js';

// ── Critique ──────────────────────────────────────────────────────────
export { CritiqueRunner } from '@/critique/runner.js';

// ── Observability ─────────────────────────────────────────────────────
export { ObservabilityCollector, globalCollector, DEFAULT_COST_RATES } from '@/observability/collector.js';
export { formatUsageSummary } from '@/observability/reporter.js';

// ── Types (re-exports) ────────────────────────────────────────────────
export type {
  AgentRole,
  ChatMessage,
  AgentConfig,
  AgentInferenceOptions,
  ExecuteOptions,
} from '@/types/agent.js';
export type {
  LLMProviderConfig,
  InferenceProviderKind,
  TokenUsage,
  CompletionResult,
  InferenceRequest,
  InferenceClient,
  StreamChunk,
  GenerateCompletionOptions,
  JsonSchemaResponseFormat,
  LLMErrorKind,
} from '@/types/llm.js';
export type { Skill } from '@/types/skill.js';
export type {
  EvalRubricCriterion,
  DeterministicCheck,
  EvalCase,
  CriterionVerdict,
  CaseEvalResult,
  EvalSuiteResult,
  EvalExecutor,
} from '@/types/evals.js';
export type {
  PipelineOptions,
  StageTimings,
  DeliveryPackage,
} from '@/types/orchestration.js';
export type {
  LLMCallRecord,
  AgentUsageSummary,
  ObservabilitySummary,
  CostRates,
} from '@/types/observability.js';
export type { CritiqueOptions, CritiqueResult } from '@/types/critique.js';
export type { Tool, ToolContext, ToolCallResult } from '@/types/tool.js';
