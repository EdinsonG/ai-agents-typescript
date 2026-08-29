/**
 * Example: Basic Agent Usage
 *
 * This example shows how to use the ai-agents-core library to create
 * and execute a simple agent.
 *
 * Usage:
 *   GROQ_API_KEY_AGENTS=your-key npx tsx examples/basic-agent.ts
 */

import { TechnicalPOAgent, FrontendReactAgent, BackendNodeAgent } from '../src/index.js';

const API_KEY = process.env.GROQ_API_KEY_AGENTS;

if (!API_KEY) {
  console.error('Error: Set GROQ_API_KEY_AGENTS environment variable');
  process.exit(1);
}

async function main() {
  // Create a Technical PO agent
  const poAgent = new TechnicalPOAgent(API_KEY);

  console.log(`Running agent: ${poAgent.displayName}`);

  const result = await poAgent.execute(
    'Create user stories for a shopping cart feature with product selection, quantity update, and checkout.',
  );

  console.log('\n=== Agent Output ===\n');
  console.log(result);
}

main().catch(console.error);
