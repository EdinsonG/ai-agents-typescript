/**
 * Example: Multi-turn Conversation
 *
 * This example demonstrates how to maintain conversation history
 * across multiple interactions with an agent.
 *
 * Usage:
 *   GROQ_API_KEY_AGENTS=your-key npx tsx examples/multi-turn.ts
 */

import { FrontendReactAgent } from '../src/index.js';

const API_KEY = process.env.GROQ_API_KEY_AGENTS;

if (!API_KEY) {
  console.error('Error: Set GROQ_API_KEY_AGENTS environment variable');
  process.exit(1);
}

async function main() {
  const agent = new FrontendReactAgent(API_KEY);

  console.log('Multi-turn conversation demo\n');

  // First turn
  console.log('User: Create a button component');
  const response1 = await agent.execute('Create a button component');
  console.log(`Agent: ${response1.substring(0, 200)}...\n`);

  // Second turn - agent remembers previous context
  console.log('User: Add loading state to it');
  const response2 = await agent.execute('Add loading state to it');
  console.log(`Agent: ${response2.substring(0, 200)}...\n`);

  // Export session for persistence
  const session = agent.exportSession();
  console.log(`Session saved: ${session.history.length} messages`);

  // Show conversation history
  console.log('\n=== Conversation History ===');
  for (const msg of session.history) {
    if (msg.role === 'system') continue;
    console.log(`\n[${msg.role}]: ${msg.content.substring(0, 100)}...`);
  }
}

main().catch(console.error);
