import { 
  Intent, 
  Domain, 
  createPromptText,
  PromptText
} from './types/index.ts';

/**
 * Generator for missing prompts, ensuring entity names are avoided.
 */
export class PromptGenerator {
  private readonly entitySynonyms: Record<string, string[]> = {
    users: ['colaboradores', 'perfis', 'identidades', 'membros', 'pessoas'],
    user: ['colaborador', 'perfil', 'identidade', 'membro', 'pessoa'],
    orders: ['solicitações', 'demandas', 'requisições', 'pedidos'],
    order: ['solicitação', 'demanda', 'requisição', 'pedido'],
    products: ['itens', 'mercadorias', 'artigos', 'unidades'],
    product: ['item', 'mercadoria', 'artigo', 'unidade'],
    default: ['registros', 'entradas', 'elementos', 'dados']
  };

  /**
   * Fills missing prompts in the intent map.
   */
  public fillMissingPrompts(intents: Record<string, Intent>): Record<string, Intent> {
    const entries = Object.entries(intents);
    
    for (const [name, intent] of entries) {
      this.processIntent(name, intent);
    }

    return intents;
  }

  private processIntent(name: string, intent: Intent): void {
    if (this.hasPrompt(intent)) {
      return;
    }

    intent.prompt = this.generatePrompt(name, intent.context.domain);
  }

  private hasPrompt(intent: Intent): boolean {
    return intent.prompt && intent.prompt.trim().length > 0;
  }

  private generatePrompt(intentName: string, domain: Domain): PromptText {
    const synonym = this.getSynonym(domain);
    const concept = this.mapIntentToConcept(intentName);

    return createPromptText(`Use esta intenção quando o objetivo for ${concept} ${synonym}. Extraia os parâmetros relevantes para a operação.`);
  }

  private mapIntentToConcept(intentName: string): string {
    const name = intentName.toLowerCase();
    
    if (name.includes('create')) return 'adicionar novos';
    if (name.includes('delete')) return 'remover';
    if (name.includes('list')) return 'visualizar a listagem de';
    if (name.includes('update')) return 'alterar informações de';
    if (name.includes('read')) return 'obter detalhes de';
    
    return 'gerenciar';
  }

  private getSynonym(domain: Domain): string {
    const domainStr = String(domain).toLowerCase();
    const synonyms = this.entitySynonyms[domainStr] || this.entitySynonyms.default;
    
    // Deterministic selection for consistency in tests, or random? 
    // User said "gera prompts condizentes". Let's pick the first one for now or a stable one.
    return synonyms[0];
  }
}
