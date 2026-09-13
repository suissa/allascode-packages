import { PromptTester } from './tester.ts';
import { PromptText, IntentName } from './types/index.ts';
import fs from 'fs';
import path from 'path';

/**
 * Prompts2Intents Executor
 * 
 * This script demonstrates the mapping between a prompt and its corresponding intent.
 * It "proves" that for every generated or original prompt, there is a target intent.
 */
export class Prompts2IntentsExecutor {
  private readonly tester: PromptTester;

  constructor() {
    this.tester = new PromptTester();
  }

  public run(filePath: string) {
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const results = this.tester.execute(rawData);

    console.log('\n🚀 Executando Prompts2Intents Executor...\n');

    for (const domainResult of results) {
      console.log(`📂 Domínio: ${domainResult.domain}`);
      
      for (const summary of domainResult.summaries) {
        this.executeMappingProof(summary.name, summary.finalPrompt);
      }
      console.log('');
    }
  }

  private executeMappingProof(intentName: string, prompt: string) {
    // In a production scenario, this would call the Cognitive Gateway.
    // Here we provide the proof of mapping existence.
    const status = prompt.length > 50 ? '📝 Detailed' : '⚡ Short';
    console.log(`   [${status}] Intent: ${intentName} <= "${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}"`);
  }
}

// Auto-run if main
if (process.argv[1]?.includes('prompts2intents.ts')) {
  const rootDir = process.cwd();
  const filePath = path.join(rootDir, 'Coggate', 'openintent.json');
  new Prompts2IntentsExecutor().run(filePath);
}
