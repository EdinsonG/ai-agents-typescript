import type { ChatMessage } from '@/types/index.js';

/** Heurística estándar: ~4 caracteres por token para texto en español/inglés. */
const CHARS_PER_TOKEN = 4;

export const DEFAULT_MAX_CONTEXT_TOKENS = 32_000;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function estimateMessagesTokens(messages: ChatMessage[]): number {
  // +4 tokens de overhead por mensaje (formato del chat)
  return messages.reduce((total, message) => total + estimateTokens(message.content) + 4, 0);
}

const TRUNCATION_MARKER =
  '[Nota: {count} mensaje(s) antiguos fueron omitidos por límite de contexto. La conversación continúa.]';

/**
 * Reduce los mensajes al presupuesto de tokens SIN mutar el historial original.
 * Garantiza: el/los mensajes system iniciales siempre se conservan,
 * y el último mensaje nunca se descarta.
 */
export function truncateMessages(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
  if (estimateMessagesTokens(messages) <= maxTokens) return [...messages];

  let index = 0;
  while (index < messages.length && messages[index].role === 'system') {
    index++;
  }

  const systemMessages = messages.slice(0, index);
  const conversation = messages.slice(index);

  const systemCost = estimateMessagesTokens(systemMessages);
  const markerBudget = 32;

  let keptFrom = conversation.length - 1;
  let used = systemCost + estimateTokens(conversation[keptFrom].content) + 4;

  while (keptFrom > 0) {
    const previousCost = estimateTokens(conversation[keptFrom - 1].content) + 4;
    if (used + previousCost + markerBudget > maxTokens) break;
    used += previousCost;
    keptFrom--;
  }

  const droppedCount = keptFrom;

  if (droppedCount === 0) {
    return [...systemMessages, ...conversation];
  }

  return [
    ...systemMessages,
    { role: 'system', content: TRUNCATION_MARKER.replace('{count}', String(droppedCount)) },
    ...conversation.slice(keptFrom),
  ];
}
