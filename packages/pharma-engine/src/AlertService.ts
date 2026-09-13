import { supabase } from "@/config/supabase";
import { StockAlert } from "./types";
import { StockService } from "./StockService";
import { PredictionService } from "./PredictionService";
import { BatchService } from "./BatchService";

export class AlertService {
  private stockService: StockService;
  private predictionService: PredictionService;
  private batchService: BatchService;

  constructor() {
    this.stockService = new StockService();
    this.predictionService = new PredictionService();
    this.batchService = new BatchService();
  }

  // ============================================
  // Alertas
  // ============================================

  async createAlert(alert: StockAlert): Promise<StockAlert> {
    const { data, error } = await supabase
      .from("pharma_stock_alerts")
      .insert(alert)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAlert(id: string): Promise<StockAlert | null> {
    const { data, error } = await supabase
      .from("pharma_stock_alerts")
      .select("*")
      .eq("id", id)
      .is("valid_to", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  }

  async getAlerts(filters?: {
    product_id?: string;
    stock_id?: string;
    alert_type?: string;
    severity?: string;
    status?: string;
    limit?: number;
  }): Promise<StockAlert[]> {
    let query = supabase
      .from("pharma_stock_alerts")
      .select("*")
      .is("valid_to", null)
      .order("created_at", { ascending: false });

    if (filters?.product_id) {
      query = query.eq("product_id", filters.product_id);
    }

    if (filters?.stock_id) {
      query = query.eq("stock_id", filters.stock_id);
    }

    if (filters?.alert_type) {
      query = query.eq("alert_type", filters.alert_type);
    }

    if (filters?.severity) {
      query = query.eq("severity", filters.severity);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getActiveAlerts(severity?: string): Promise<StockAlert[]> {
    return this.getAlerts({
      status: "active",
      severity: severity,
      limit: 100,
    });
  }

  async acknowledgeAlert(id: string, userId: string): Promise<StockAlert> {
    const { data, error } = await supabase
      .from("pharma_stock_alerts")
      .update({
        status: "acknowledged",
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async resolveAlert(
    id: string,
    userId: string,
    actionTaken?: string,
  ): Promise<StockAlert> {
    const { data, error } = await supabase
      .from("pharma_stock_alerts")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        action_taken: actionTaken,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async dismissAlert(id: string): Promise<StockAlert> {
    const { data, error } = await supabase
      .from("pharma_stock_alerts")
      .update({
        status: "dismissed",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================
  // Geração Automática de Alertas
  // ============================================

  async checkAndGenerateAlerts(): Promise<StockAlert[]> {
    const alerts: StockAlert[] = [];

    // Verificar estoques baixos
    const stockReport = await this.stockService.getStockReport();

    for (const stock of stockReport) {
      if (stock.status === "out_of_stock") {
        const alert = await this.createAlert({
          product_id: stock.product_id,
          alert_type: "out_of_stock",
          severity: "critical",
          alert_message: `Produto ${stock.product_name} está sem estoque`,
          current_value: stock.current_quantity,
          threshold_value: 0,
          status: "active",
        });
        alerts.push(alert);
      } else if (stock.status === "low_stock") {
        const alert = await this.createAlert({
          product_id: stock.product_id,
          alert_type: "low_stock",
          severity: stock.current_quantity === 0 ? "critical" : "high",
          alert_message: `Estoque baixo para ${stock.product_name}: ${stock.current_quantity} unidades (mínimo: ${stock.min_stock_level})`,
          current_value: stock.current_quantity,
          threshold_value: stock.min_stock_level || 0,
          status: "active",
          suggested_action: `Reabastecer ${
            stock.reorder_point || stock.min_stock_level || 0
          } unidades`,
        });
        alerts.push(alert);
      }
    }

    // Verificar produtos próximos do vencimento usando LOTES FEFO
    const expiringBatches = await this.batchService.getExpiringBatches(30);

    for (const batch of expiringBatches) {
      const daysUntilExpiration = batch.days_until_expiration;
      const severity =
        daysUntilExpiration <= 7
          ? "critical"
          : daysUntilExpiration <= 15
            ? "high"
            : "medium";

      const alert = await this.createAlert({
        product_id: batch.product_id,
        batch_id: batch.batch_id, // Usar novo campo batch_id
        alert_type: "expiration",
        severity: severity,
        alert_message: `${batch.product_name} (Lote: ${batch.batch_number}) vence em ${daysUntilExpiration} dias`,
        current_value: daysUntilExpiration,
        threshold_value: 30,
        status: "active",
        suggested_action: `Verificar e priorizar venda do lote antes do vencimento`,
      });
      alerts.push(alert);
    }

    // Verificar previsões de stockout
    const predictions = await this.predictionService.getPredictions({
      prediction_type: "stockout",
      limit: 50,
    });

    for (const prediction of predictions) {
      if (
        prediction.alert_level === "critical" ||
        prediction.alert_level === "high"
      ) {
        // Verificar se já existe alerta ativo para este produto
        const existingAlerts = await this.getAlerts({
          product_id: prediction.product_id,
          alert_type: "reorder",
          status: "active",
        });

        if (existingAlerts.length === 0) {
          const alert = await this.createAlert({
            product_id: prediction.product_id,
            stock_id: prediction.stock_id,
            alert_type: "reorder",
            severity: prediction.alert_level,
            alert_message:
              prediction.alert_message || "Estoque previsto para acabar",
            current_value: prediction.predicted_value,
            threshold_value: 0,
            status: "active",
            suggested_action: "Reabastecer estoque urgentemente",
          });
          alerts.push(alert);
        }
      }
    }

    return alerts;
  }
}

// Exporta instância singleton
export const alertService = new AlertService();
