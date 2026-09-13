import { Proof } from '../../one-proof-4-all/src/index.ts';
import { PromptTester } from './tester.ts';

/**
 * Test suite for Prompt Tester
 */
async function runTests() {
  await Proof.describe('Prompt Tester Execution', async () => {
    const tester = new PromptTester();

    const mockData = {
      openintent: '1.0.0',
      intents: {
        create_user: {
          prompt: '', // Missing
          context: { domain: 'users', language: 'pt-BR' },
          behavior: { controller: 'users.create', operationId: 'create' },
          schema: 'Zod'
        },
        delete_user: {
          prompt: 'Excluir usuário', // Already has it
          context: { domain: 'users', language: 'pt-BR' },
          behavior: { controller: 'users.delete', operationId: 'delete' },
          schema: 'Zod'
        },
        list_orders: {
          prompt: '', // Missing
          context: { domain: 'orders', language: 'pt-BR' },
          behavior: { controller: 'orders.list', operationId: 'list' },
          schema: null
        }
      }
    };

    const results = tester.execute(mockData);

    await Proof.it('Groups by domain correctly', async () => {
      await Proof.assert(results.length === 2, 'Should have 2 domains (users, orders)');
    });

    await Proof.it('Generates missing prompts correctly', async () => {
      const userDomain = results.find(r => String(r.domain) === 'users');
      const createSummary = userDomain!.summaries.find(s => s.name === 'create_user');
      
      await Proof.assert(!createSummary!.hadOriginalPrompt, 'Should be marked as missing original prompt');
      await Proof.assert(createSummary!.finalPrompt.length > 0, 'Final prompt should be generated');
    });

    await Proof.it('Avoids entity names in generated prompts', async () => {
      const userDomain = results.find(r => String(r.domain) === 'users');
      const createSummary = userDomain!.summaries.find(s => s.name === 'create_user');
      const prompt = createSummary!.finalPrompt.toLowerCase();

      await Proof.assert(!prompt.includes('user'), 'Should not contain user');
      await Proof.assert(!prompt.includes('usuário'), 'Should not contain usuário');
    });

    await Proof.it('Preserves existing prompts', async () => {
      const userDomain = results.find(r => String(r.domain) === 'users');
      const deleteSummary = userDomain!.summaries.find(s => s.name === 'delete_user');

      await Proof.assert(deleteSummary!.hadOriginalPrompt, 'Should be marked as having original prompt');
      await Proof.assert(deleteSummary!.finalPrompt === 'Excluir usuário', 'Prompt should be preserved');
    });
  });
}

runTests().catch(() => process.exit(1));
