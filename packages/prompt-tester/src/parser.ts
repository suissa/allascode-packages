import { 
  OpenIntent, 
  Intent, 
  Domain, 
  createDomain, 
  createPromptText, 
  createLanguage, 
  createControllerPath, 
  createOperationId 
} from './types/index.ts';

/**
 * Parser for OpenIntent JSON files.
 */
export class IntentParser {
  /**
   * Parses the raw JSON object into structured OpenIntent data with semantic types.
   */
  public parse(rawData: any): OpenIntent {
    if (this.isInvalidData(rawData)) {
      throw new Error('Invalid OpenIntent data: Missing intents');
    }

    return {
      openintent: rawData.openintent || '1.0.0',
      intents: this.parseIntents(rawData.intents),
    };
  }

  private isInvalidData(rawData: any): boolean {
    return !rawData || !rawData.intents;
  }

  private parseIntents(rawIntents: Record<string, any>): Record<string, Intent> {
    const intents: Record<string, Intent> = {};

    for (const [key, value] of Object.entries(rawIntents)) {
      intents[key] = this.parseSingleIntent(value);
    }

    return intents;
  }

  private parseSingleIntent(value: any): Intent {
    return {
      prompt: createPromptText(value.prompt || ''),
      examples: value.examples || [],
      behavior: {
        controller: createControllerPath(value.behavior?.controller || ''),
        operationId: createOperationId(value.behavior?.operationId || ''),
      },
      context: {
        domain: createDomain(value.context?.domain || 'unknown'),
        language: createLanguage(value.context?.language || 'pt-BR'),
      },
      schema: value.schema || null,
    };
  }

  /**
   * Groups intents by their domain.
   */
  public groupByDomain(data: OpenIntent): Map<Domain, Intent[]> {
    const grouped = new Map<Domain, Intent[]>();

    for (const intent of Object.values(data.intents)) {
      this.addToGroup(grouped, intent);
    }

    return grouped;
  }

  private addToGroup(grouped: Map<Domain, Intent[]>, intent: Intent): void {
    const domain = intent.context.domain;
    const list = grouped.get(domain) || [];
    list.push(intent);
    grouped.set(domain, list);
  }
}
