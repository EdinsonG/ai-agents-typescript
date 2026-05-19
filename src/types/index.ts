// Tipos de roles permitidos en el historial de conversación
export type AgentRole = 'system' | 'user' | 'assistant';

// Interfaz para la estructura de los mensajes en memoria
export interface ChatMessage {
  role: AgentRole;
  content: string;
}

// Opciones de configuración para el proveedor de LLM
export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// Configuración requerida para inicializar cualquier agente base
export interface AgentConfig {
  name: string;
  systemPrompt: string;
  apiKey: string;
  model?: string;
  temperature?: number;
}
