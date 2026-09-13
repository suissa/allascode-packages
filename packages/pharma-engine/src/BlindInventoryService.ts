// ============================================
// Serviço de Inventário Cego
// Ferramenta para contagem periódica de estoque
// ============================================

import type {
  BlindInventorySession,
  BlindInventoryCount,
  BlindInventoryDiscrepancy,
  BlindInventoryReport,
  BlindInventorySessionId,
  BlindInventoryCountId,
  ProductId,
  UserId,
  LocationId,
} from "./types/blind-inventory.types";

/**
 * Serviço para gerenciar contagens cegas de inventário
 * Permite contagem sem visualização de valores atuais
 */
export class BlindInventoryService {
  private sessions: Map<string, BlindInventorySession> = new Map();
  private counts: Map<string, BlindInventoryCount> = new Map();

  /**
   * Cria uma nova sessão de inventário cego
   */
  async createSession(params: {
    name: string;
    description?: string;
    location_ids?: LocationId[];
    product_ids?: ProductId[];
    created_by: UserId;
  }): Promise<BlindInventorySession> {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();

    const session: BlindInventorySession = {
      id: sessionId,
      name: params.name,
      description: params.description,
      status: "active",
      location_ids: params.location_ids || [],
      product_ids: params.product_ids || [],
      started_at: now,
      created_by: params.created_by,
      created_at: now,
      updated_at: now,
      count_ids: [],
      metadata: {},
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Registra uma contagem individual
   * Não expõe valores de estoque atual
   */
  async recordCount(params: {
    session_id: BlindInventorySessionId;
    product_id: ProductId;
    location_id?: LocationId;
    counted_quantity: number;
    batch_number?: string;
    expiration_date?: string;
    notes?: string;
    counted_by: UserId;
  }): Promise<BlindInventoryCount> {
    const session = this.sessions.get(params.session_id);
    if (!session) {
      throw new Error(`Sessão ${params.session_id} não encontrada`);
    }

    if (session.status !== "active") {
      throw new Error(
        `Sessão ${params.session_id} não está ativa (status: ${session.status})`
      );
    }

    const countId = this.generateCountId();
    const now = new Date().toISOString();

    const count: BlindInventoryCount = {
      id: countId,
      session_id: params.session_id,
      product_id: params.product_id,
      location_id: params.location_id,
      counted_quantity: params.counted_quantity,
      batch_number: params.batch_number,
      expiration_date: params.expiration_date,
      notes: params.notes,
      counted_by: params.counted_by,
      counted_at: now,
      created_at: now,
      metadata: {},
    };

    this.counts.set(countId, count);
    session.count_ids.push(countId);
    session.updated_at = now;

    return count;
  }

  /**
   * Finaliza uma sessão e calcula divergências
   * Compara contagens com estoque real
   */
  async finalizeSession(
    sessionId: BlindInventorySessionId,
    finalized_by: UserId
  ): Promise<BlindInventoryReport> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Sessão ${sessionId} não encontrada`);
    }

    if (session.status !== "active") {
      throw new Error(`Sessão ${sessionId} já foi finalizada`);
    }

    const now = new Date().toISOString();
    session.status = "finalized";
    session.finalized_at = now;
    session.finalized_by = finalized_by;
    session.updated_at = now;

    // Calcular divergências
    const discrepancies = await this.calculateDiscrepancies(sessionId);

    const report: BlindInventoryReport = {
      session_id: sessionId,
      session_name: session.name,
      total_items_counted: session.count_ids.length,
      total_discrepancies: discrepancies.length,
      accuracy_percentage: this.calculateAccuracy(
        session.count_ids.length,
        discrepancies.length
      ),
      discrepancies,
      started_at: session.started_at,
      finalized_at: now,
      created_by: session.created_by,
      finalized_by,
      metadata: {},
    };

    return report;
  }

  /**
   * Calcula divergências entre contagem e estoque real
   */
  private async calculateDiscrepancies(
    sessionId: BlindInventorySessionId
  ): Promise<BlindInventoryDiscrepancy[]> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const discrepancies: BlindInventoryDiscrepancy[] = [];

    for (const countId of session.count_ids) {
      const count = this.counts.get(countId);
      if (!count) continue;

      // Aqui você integraria com o StockService para obter quantidade real
      // Por ora, simulamos com valor mockado
      const systemQuantity = await this.getSystemQuantity(
        count.product_id,
        count.location_id
      );

      const difference = count.counted_quantity - systemQuantity;

      if (difference !== 0) {
        discrepancies.push({
          count_id: countId,
          product_id: count.product_id,
          location_id: count.location_id,
          counted_quantity: count.counted_quantity,
          system_quantity: systemQuantity,
          difference,
          difference_percentage: this.calculateDifferencePercentage(
            systemQuantity,
            difference
          ),
          severity: this.calculateSeverity(difference, systemQuantity),
          counted_by: count.counted_by,
          counted_at: count.counted_at,
        });
      }
    }

    return discrepancies;
  }

  /**
   * Obtém quantidade do sistema (integração com StockService)
   */
  private async getSystemQuantity(
    productId: ProductId,
    locationId?: LocationId
  ): Promise<number> {
    // TODO: Integrar com StockService
    // Por ora retorna valor mockado
    return Math.floor(Math.random() * 100);
  }

  /**
   * Calcula acurácia da contagem
   */
  private calculateAccuracy(
    totalCounts: number,
    totalDiscrepancies: number
  ): number {
    if (totalCounts === 0) return 100;
    return Number(
      (((totalCounts - totalDiscrepancies) / totalCounts) * 100).toFixed(2)
    );
  }

  /**
   * Calcula percentual de diferença
   */
  private calculateDifferencePercentage(
    systemQuantity: number,
    difference: number
  ): number {
    if (systemQuantity === 0) return 0;
    return Number(((difference / systemQuantity) * 100).toFixed(2));
  }

  /**
   * Determina severidade da divergência
   */
  private calculateSeverity(
    difference: number,
    systemQuantity: number
  ): "low" | "medium" | "high" | "critical" {
    const absDiff = Math.abs(difference);
    const percentage = systemQuantity > 0 ? (absDiff / systemQuantity) * 100 : 0;

    if (percentage >= 50) return "critical";
    if (percentage >= 25) return "high";
    if (percentage >= 10) return "medium";
    return "low";
  }

  /**
   * Lista sessões ativas
   */
  async getActiveSessions(): Promise<BlindInventorySession[]> {
    return Array.from(this.sessions.values()).filter(
      (s) => s.status === "active"
    );
  }

  /**
   * Obtém detalhes de uma sessão
   */
  async getSession(
    sessionId: BlindInventorySessionId
  ): Promise<BlindInventorySession | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Obtém contagens de uma sessão
   */
  async getSessionCounts(
    sessionId: BlindInventorySessionId
  ): Promise<BlindInventoryCount[]> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.count_ids
      .map((id) => this.counts.get(id))
      .filter((c): c is BlindInventoryCount => c !== undefined);
  }

  /**
   * Cancela uma sessão ativa
   */
  async cancelSession(
    sessionId: BlindInventorySessionId,
    cancelled_by: UserId
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Sessão ${sessionId} não encontrada`);
    }

    if (session.status !== "active") {
      throw new Error(`Sessão ${sessionId} não pode ser cancelada`);
    }

    session.status = "cancelled";
    session.cancelled_at = new Date().toISOString();
    session.cancelled_by = cancelled_by;
    session.updated_at = new Date().toISOString();
  }

  // Helpers para geração de IDs
  private generateSessionId(): BlindInventorySessionId {
    return `BIS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as BlindInventorySessionId;
  }

  private generateCountId(): BlindInventoryCountId {
    return `BIC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as BlindInventoryCountId;
  }
}

// Exporta instância singleton
export const blindInventoryService = new BlindInventoryService();
