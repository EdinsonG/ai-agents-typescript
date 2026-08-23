import { BackendNodeAgent } from './BackendNode/BackendNodeAgent.js';
import { FrontendAngularAgent } from './FrontendAngular/FrontendAngularAgent.js';
import { FrontendReactAgent } from './FrontendReact/FrontendReactAgent.js';
import { TechnicalPOAgent } from './TechnicalPO/TechnicalPOAgent.js';
import { UXUIAgent } from './UXUI/UXUIAgent.js';

export { BackendNodeAgent, FrontendAngularAgent, FrontendReactAgent, TechnicalPOAgent, UXUIAgent };

export const AGENT_IDS = ['po', 'react', 'angular', 'backend', 'uxui'] as const;
export type AgentId = (typeof AGENT_IDS)[number];

export function createAgent(id: AgentId, apiKey: string) {
  switch (id) {
    case 'po':
      return new TechnicalPOAgent(apiKey);
    case 'react':
      return new FrontendReactAgent(apiKey);
    case 'angular':
      return new FrontendAngularAgent(apiKey);
    case 'backend':
      return new BackendNodeAgent(apiKey);
    case 'uxui':
      return new UXUIAgent(apiKey);
  }
}
