/**
 * Example: Tool Calling
 *
 * This example demonstrates how to register and use tools with an agent.
 * Tools allow agents to interact with external systems.
 *
 * Usage:
 *   GROQ_API_KEY_AGENTS=your-key npx tsx examples/tool-calling.ts
 */

import { z } from 'zod';
import { BackendNodeAgent, ToolRegistry, type Tool } from '../src/index.js';

const API_KEY = process.env.GROQ_API_KEY_AGENTS;

if (!API_KEY) {
  console.error('Error: Set GROQ_API_KEY_AGENTS environment variable');
  process.exit(1);
}

// Define a tool: search documentation
const searchDocsTool: Tool<{ query: string }> = {
  name: 'search_docs',
  description: 'Search technical documentation for a given query',
  parameters: z.object({
    query: z.string().describe('The search query'),
  }),
  execute: async (params) => {
    // In a real app, this would search a database or API
    return `Found 3 results for "${params.query}":
1. Getting Started Guide
2. API Reference
3. Best Practices`;
  },
};

// Define a tool: check database status
const dbStatusTool: Tool = {
  name: 'check_db_status',
  description: 'Check the current status of the database',
  parameters: z.object({}),
  execute: async () => {
    return JSON.stringify({
      status: 'healthy',
      connections: 45,
      maxConnections: 100,
      uptime: '15 days',
    });
  },
};

async function main() {
  // Create agent and register tools
  const agent = new BackendNodeAgent(API_KEY);

  agent.tools.register(searchDocsTool).register(dbStatusTool);

  console.log(`Running agent: ${agent.displayName} with ${agent.tools.getAll().length} tools`);

  // The agent can now use these tools during execution
  const result = await agent.execute(
    'Check the database status and document how to set up connection pooling.',
  );

  console.log('\n=== Agent Output ===\n');
  console.log(result);
}

main().catch(console.error);
