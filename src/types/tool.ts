import { z } from 'zod';

/**
 * Definition of a tool that an agent can invoke.
 * Tools allow agents to interact with external systems and execute actions.
 */
export interface Tool<TParams = unknown> {
  /** Unique identifier for the tool */
  name: string;
  /** Human-readable description of what the tool does */
  description: string;
  /** Zod schema for validating the tool's input parameters */
  parameters: z.ZodType<TParams>;
  /** Function that executes the tool's logic */
  execute: (params: TParams, context: ToolContext) => Promise<string>;
}

/**
 * Context provided to tool execution functions.
 */
export interface ToolContext {
  /** The agent's name */
  agentName: string;
  /** The original user input */
  userInput: string;
  /** The current conversation history */
  history: Array<{ role: string; content: string }>;
}

/**
 * Result of a tool execution attempt by the LLM.
 */
export interface ToolCallResult {
  /** The tool that was called */
  toolName: string;
  /** The parameters passed to the tool */
  params: Record<string, unknown>;
  /** The result returned by the tool */
  result: string;
  /** Whether the tool call was successful */
  success: boolean;
  /** Error message if the tool call failed */
  error?: string;
}
