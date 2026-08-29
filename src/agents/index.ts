import { BackendNodeAgent } from './BackendNode/BackendNodeAgent.js';
import { FrontendReactAgent } from './FrontendReact/FrontendReactAgent.js';
import { TechnicalPOAgent } from './TechnicalPO/TechnicalPOAgent.js';
import { UXUIAgent } from './UXUI/UXUIAgent.js';

export { BackendNodeAgent, FrontendReactAgent, TechnicalPOAgent, UXUIAgent };

export const AGENT_IDS = ['po', 'react', 'backend', 'uxui'] as const;
export type AgentId = (typeof AGENT_IDS)[number];

export function createAgent(id: AgentId, apiKey: string) {
  switch (id) {
    case 'po':
      return new TechnicalPOAgent(apiKey);
    case 'react':
      return new FrontendReactAgent(apiKey);
    case 'backend':
      return new BackendNodeAgent(apiKey);
    case 'uxui':
      return new UXUIAgent(apiKey);
  }
}
