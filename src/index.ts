/**
 * ai-agents-core — Library entry point.
 *
 * Usage:
 *   import { Agent, createAgent, ProductDeliveryPipeline } from 'ai-agents-core';
 */

// ── Agents ────────────────────────────────────────────────────────────
export {
  BackendNodeAgent,
  DEFAULT_BACKEND_STACK_SKILLS,
} from '@/agents/BackendNode/BackendNodeAgent.js';
export {
  DEFAULT_REACT_STACK_SKILLS,
  FrontendReactAgent,
} from '@/agents/FrontendReact/FrontendReactAgent.js';
export { AGENT_IDS, type AgentId, createAgent } from '@/agents/index.js';
export { DEFAULT_QA_SKILLS, QAExpertAgent } from '@/agents/QAExpert/QAExpertAgent.js';
export { TechnicalPOAgent } from '@/agents/TechnicalPO/TechnicalPOAgent.js';
export { DEFAULT_UXUI_SKILLS, UXUIAgent } from '@/agents/UXUI/UXUIAgent.js';
// ── Core ──────────────────────────────────────────────────────────────
export { Agent } from '@/core/Agent.js';
export { AnthropicClient } from '@/core/clients/anthropicClient.js';
export { ProviderHttpError } from '@/core/clients/httpError.js';
// ── Clients ───────────────────────────────────────────────────────────
export { createInferenceClient, KNOWN_BASE_URLS } from '@/core/clients/index.js';
export { OpenAICompatibleClient } from '@/core/clients/openAICompatibleClient.js';
export { type AppConfig, config, overrideConfig } from '@/core/config.js';
export {
  classifyProviderError,
  isRetryableKind,
  LLMProviderError,
  StructuredOutputError,
} from '@/core/errors.js';
export { parseJsonLoose } from '@/core/json.js';
export { LLMProvider } from '@/core/LLMProvider.js';
export { getLogger, type Logger, type LogLevel, setLogger } from '@/core/logger.js';
export { mergeSkillOptions, SkillRegistry } from '@/core/SkillRegistry.js';
export {
  DEFAULT_MAX_CONTEXT_TOKENS,
  estimateMessagesTokens,
  estimateTokens,
  truncateMessages,
} from '@/core/tokens.js';
export { executeToolCall, ToolRegistry } from '@/core/tools.js';
// ── Critique ──────────────────────────────────────────────────────────
export { CritiqueRunner } from '@/critique/runner.js';
export { LLMJudge } from '@/evals/judge.js';
export { formatSuiteReport, formatSuiteReportJson } from '@/evals/reporter.js';

// ── Evals ─────────────────────────────────────────────────────────────
export { EvalRunner } from '@/evals/runner.js';
export { computeScorePercent, toVerdictList } from '@/evals/scoring.js';
// ── Observability ─────────────────────────────────────────────────────
export {
  DEFAULT_COST_RATES,
  globalCollector,
  ObservabilityCollector,
} from '@/observability/collector.js';
export { formatUsageSummary } from '@/observability/reporter.js';
export { buildBackendBrief, buildFrontendBrief, buildUxBrief } from '@/orchestration/briefs.js';
// ── Orchestration ─────────────────────────────────────────────────────
export { ProductDeliveryPipeline } from '@/orchestration/pipeline.js';
// ── Skills ────────────────────────────────────────────────────────────
export { skillRegistry } from '@/skills/index.js';

// ── Types (re-exports) ────────────────────────────────────────────────
export type {
  AgentConfig,
  AgentInferenceOptions,
  AgentRole,
  ChatMessage,
  ExecuteOptions,
} from '@/types/agent.js';
export type { CritiqueOptions, CritiqueResult } from '@/types/critique.js';
export type {
  CaseEvalResult,
  CriterionVerdict,
  DeterministicCheck,
  EvalCase,
  EvalExecutor,
  EvalRubricCriterion,
  EvalSuiteResult,
} from '@/types/evals.js';
export type {
  CompletionResult,
  GenerateCompletionOptions,
  InferenceClient,
  InferenceProviderKind,
  InferenceRequest,
  JsonSchemaResponseFormat,
  LLMErrorKind,
  LLMProviderConfig,
  StreamChunk,
  TokenUsage,
} from '@/types/llm.js';
export type {
  AgentUsageSummary,
  CostRates,
  LLMCallRecord,
  ObservabilitySummary,
} from '@/types/observability.js';
export type {
  DeliveryPackage,
  PipelineOptions,
  StageTimings,
} from '@/types/orchestration.js';
export type { Skill } from '@/types/skill.js';
export type { Tool, ToolCallResult, ToolContext } from '@/types/tool.js';
