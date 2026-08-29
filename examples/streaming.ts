/**
 * Example: Streaming
 *
 * This example demonstrates how to use streaming to get real-time
 * responses from the agent.
 *
 * Usage:
 *   GROQ_API_KEY_AGENTS=your-key npx tsx examples/streaming.ts
 */

import { LLMProvider, TechnicalPOAgent } from '../src/index.js';

const API_KEY = process.env.GROQ_API_KEY_AGENTS;

if (!API_KEY) {
  console.error('Error: Set GROQ_API_KEY_AGENTS environment variable');
  process.exit(1);
}

async function main() {
  // Create a provider with streaming support
  const provider = new LLMProvider({
    apiKey: API_KEY,
    model: 'llama-3.3-70b-versatile',
  });

  console.log('Streaming response:\n');

  // Stream the response
  for await (const chunk of provider.generateCompletionStream([
    { role: 'system', content: 'You are a helpful technical writer.' },
    { role: 'user', content: 'Write a brief introduction to microservices architecture.' },
  ])) {
    // Print each chunk as it arrives
    process.stdout.write(chunk.delta);
  }

  console.log('\n\n[Stream complete]');
}

main().catch(console.error);
