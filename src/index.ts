import 'dotenv/config';
import { TechnicalPOAgent } from '@/agents/TechnicalPO/TechnicalPOAgent.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY_AGENTS;

async function main() {
  if (!GROQ_API_KEY) {
    console.error('❌ Error: La variable de entorno GROQ_API_KEY_AGENTS no está configurada.');
    return;
  }

  console.log('🚀 [Core] Inicializando Agente: Technical Product Owner...');
  const poAgent = new TechnicalPOAgent(GROQ_API_KEY);

  const featureRequest =
    'Necesito un módulo de autenticación OAuth2 que soporte Google y GitHub, con manejo seguro de JWT y refresh tokens con expiración de 7 días.';

  console.log('\n🤖 El Product Owner está procesando el requerimiento en Groq (Llama 3.3)...\n');

  try {
    const response = await poAgent.generateUserStory(featureRequest);
    console.log('======================= ENTRABLE DE AGILE GENERADO =======================\n');
    console.log(response);
    console.log('\n==========================================================================');
  } catch (error) {
    console.error('❌ Error durante la ejecución del agente:', error);
  }
}

main();
