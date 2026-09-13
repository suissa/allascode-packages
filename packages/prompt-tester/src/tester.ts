import { IntentParser } from './parser.ts';
import { PromptGenerator } from './generator.ts';
import { Domain, Intent, OpenIntent } from './types/index.ts';

/**
 * Result of a single intent test.
 */
export interface IntentTestSummary {
  name: string;
  hadOriginalPrompt: boolean;
  finalPrompt: string;
}

/**
 * Grouped results by domain.
 */
export interface DomainTestResult {
  domain: Domain;
  summaries: IntentTestSummary[];
}

/**
 * Main class for testing and processing prompts.
 */
export class PromptTester {
  private readonly parser: IntentParser;
  private readonly generator: PromptGenerator;

  constructor() {
    this.parser = new IntentParser();
    this.generator = new PromptGenerator();
  }

  /**
   * Processes raw OpenIntent data and returns a test report.
   */
  public execute(rawData: any): DomainTestResult[] {
    const openIntent = this.parser.parse(rawData);
    const originalPromptStatus = this.capturePromptStatus(openIntent.intents);
    
    this.generator.fillMissingPrompts(openIntent.intents);
    
    const grouped = this.parser.groupByDomain(openIntent);
    
    return this.buildReport(grouped, originalPromptStatus, openIntent.intents);
  }

  private capturePromptStatus(intents: Record<string, Intent>): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const [name, intent] of Object.entries(intents)) {
      status[name] = intent.prompt && intent.prompt.trim().length > 0;
    }
    return status;
  }

  private buildReport(
    grouped: Map<Domain, Intent[]>, 
    status: Record<string, boolean>,
    finalIntents: Record<string, Intent>
  ): DomainTestResult[] {
    const results: DomainTestResult[] = [];

    for (const [domain, intents] of grouped.entries()) {
      results.push({
        domain,
        summaries: this.buildSummaries(intents, status, finalIntents)
      });
    }

    return results;
  }

  private buildSummaries(
    intents: Intent[], 
    status: Record<string, boolean>,
    finalIntents: Record<string, Intent>
  ): IntentTestSummary[] {
    // We need to match intents back to their names. 
    // In a real scenario, we'd keep the name in the Intent interface.
    // Let's assume the names are unique across the whole file.
    
    return intents.map(intent => {
      const name = this.findIntentName(intent, finalIntents);
      return {
        name,
        hadOriginalPrompt: status[name] || false,
        finalPrompt: String(intent.prompt)
      };
    });
  }

  private findIntentName(target: Intent, allIntents: Record<string, Intent>): string {
    for (const [name, intent] of Object.entries(allIntents)) {
      if (intent === target) return name;
    }
    return 'unknown';
  }
}
