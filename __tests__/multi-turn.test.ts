import { describe, expect, it } from 'vitest';
import { Agent } from '@/core/Agent.js';
import { LLMProvider } from '@/core/LLMProvider.js';
import type { ChatMessage, CompletionResult, InferenceClient } from '@/types/index.js';

/** Minimal fake provider for testing */
function createFakeClient(response = 'test response'): InferenceClient {
  return {
    async complete(): Promise<CompletionResult> {
      return {
        content: response,
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      };
    },
  };
}

class TestAgent extends Agent {
  constructor(apiKey: string) {
    super(
      {
        name: 'Test Agent',
        apiKey,
        systemPrompt: 'You are a test agent.',
      },
      new LLMProvider({ apiKey, model: 'test', client: createFakeClient() }),
    );
  }
}

describe('Agent multi-turn (historial persistente)', () => {
  it('getHistory returns current conversation', () => {
    const agent = new TestAgent('test-key');
    expect(agent.getHistory()).toHaveLength(1); // system prompt only
  });

  it('loadHistory replaces history while preserving system prompt', () => {
    const agent = new TestAgent('test-key');
    const systemMsg = agent.getHistory()[0];

    const newHistory: ChatMessage[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi there' },
      { role: 'user', content: 'how are you?' },
    ];

    agent.loadHistory(newHistory);
    const loaded = agent.getHistory();

    expect(loaded[0]).toEqual(systemMsg); // system prompt preserved
    expect(loaded).toHaveLength(4); // system + 3 messages
    expect(loaded[1].content).toBe('hello');
    expect(loaded[2].content).toBe('hi there');
  });

  it('exportSession and loadSession round-trip', () => {
    const agent1 = new TestAgent('test-key');
    const history: ChatMessage[] = [
      { role: 'user', content: 'question 1' },
      { role: 'assistant', content: 'answer 1' },
    ];
    agent1.loadHistory(history);

    const session = agent1.exportSession();
    expect(session.agentName).toBe('Test Agent');
    expect(session.history.length).toBeGreaterThan(0);
    expect(session.createdAt).toBeDefined();

    const agent2 = new TestAgent('test-key');
    agent2.loadSession(session);
    const loaded = agent2.getHistory();

    expect(loaded.length).toBeGreaterThan(1);
    expect(loaded.some((m) => m.content === 'question 1')).toBe(true);
  });

  it('clearMemory resets history to system prompt only', () => {
    const agent = new TestAgent('test-key');
    agent.loadHistory([
      { role: 'user', content: 'msg1' },
      { role: 'assistant', content: 'reply1' },
    ]);

    expect(agent.getHistory().length).toBeGreaterThan(1);
    agent.clearMemory();
    expect(agent.getHistory()).toHaveLength(1);
    expect(agent.getHistory()[0].role).toBe('system');
  });
});
