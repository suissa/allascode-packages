// @ts-nocheck
import { supabase } from "@/config/supabase";
import { StockPrediction, PredictionRequest } from "./types";
import { StockService } from "./StockService";

export class PredictionService {
  private stockService: StockService;

  constructor() {
    this.stockService = new StockService();
  }

  // ============================================
  // Previsões
  // ============================================

  async createPrediction(
    prediction: StockPrediction
  ): Promise<StockPrediction> {
    // Usar ecommerce_predictions com entity_type = 'pharma_stock'
    const { data, error } = await supabase
      .from("ecommerce_predictions")
      .insert({
        prediction_type: prediction.prediction_type,
        entity_type: "pharma_stock",
        entity_id: prediction.stock_id || prediction.product_id,
        predicted_value: prediction.predicted_value,
        confidence: prediction.confidence,
        prediction_date: prediction.prediction_date,
        horizon_days: prediction.horizon_days,
        model_name: prediction.model_name,
        model_version: prediction.model_version,
        features: prediction.model_features,
        metadata: {
          ...prediction.metadata,
          product_id: prediction.product_id,
          stock_id: prediction.stock_id,
        },
        lower_bound: prediction.lower_bound,
        upper_bound: prediction.upper_bound,
        alert_level: prediction.alert_level,
        alert_message: prediction.alert_message,
      })
      .select()
      .single();

    if (error) throw error;

    // Converter de volta para formato StockPrediction
    return {
      id: data.id,
      product_id: data.metadata?.product_id || prediction.product_id,
      stock_id: data.metadata?.stock_id || prediction.stock_id,
      prediction_type: data.prediction_type as any,
      prediction_date: data.prediction_date,
      horizon_days: data.horizon_days,
      predicted_value: data.predicted_value,
      confidence: data.confidence,
      lower_bound: data.lower_bound,
      upper_bound: data.upper_bound,
      model_name: data.model_name,
      model_version: data.model_version,
      model_features: data.features,
      actual_value: data.actual_value,
      accuracy: data.accuracy,
      alert_level: data.alert_level as any,
      alert_message: data.alert_message,
      metadata: data.metadata,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  async getPrediction(id: string): Promise<StockPrediction | null> {
    // Usar ecommerce_predictions
    const { data, error } = await supabase
      .from("ecommerce_predictions")
      .select("*")
      .eq("id", id)
      .is("valid_to", null)
      .eq("entity_type", "pharma_stock")
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return this.convertPrediction(data);
  }

  async getPredictions(filters?: {
    product_id?: string;
    stock_id?: string;
    prediction_type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<StockPrediction[]> {
    // Usar ecommerce_predictions
    let query = supabase
      .from("ecommerce_predictions")
      .select("*")
      .is("valid_to", null)
      .eq("entity_type", "pharma_stock")
      .order("prediction_date", { ascending: false });

    if (filters?.prediction_type) {
      query = query.eq("prediction_type", filters.prediction_type);
    }

    if (filters?.date_from) {
      query = query.gte("prediction_date", filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte("prediction_date", filters.date_to);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filtrar por product_id ou stock_id no metadata
    let results = (data || []).map((d) => this.convertPrediction(d));

    if (filters?.product_id) {
      results = results.filter((p) => p.product_id === filters.product_id);
    }

    if (filters?.stock_id) {
      results = results.filter((p) => p.stock_id === filters.stock_id);
    }

    return results;
  }

  private convertPrediction(data: any): StockPrediction {
    return {
      id: data.id,
      product_id: data.metadata?.product_id,
      stock_id: data.metadata?.stock_id || data.entity_id,
      prediction_type: data.prediction_type,
      prediction_date: data.prediction_date,
      horizon_days: data.horizon_days,
      predicted_value: data.predicted_value,
      confidence: data.confidence,
      lower_bound: data.lower_bound,
      upper_bound: data.upper_bound,
      model_name: data.model_name,
      model_version: data.model_version,
      model_features: data.features,
      actual_value: data.actual_value,
      accuracy: data.accuracy,
      alert_level: data.alert_level,
      alert_message: data.alert_message,
      metadata: data.metadata,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  // ============================================
  // Geração de Previsões
  // ============================================

  async predictStockLevel(
    request: PredictionRequest
  ): Promise<StockPrediction> {
    // Obter estoque atual
    let stock = null;
    if (request.stock_id) {
      stock = await this.stockService.getStock(request.stock_id);
    } else {
      const stocks = await this.stockService.getStockByProduct(
        request.product_id
      );
      stock = stocks[0] || null;
    }

    if (!stock) {
      throw new Error("Estoque não encontrado para o produto");
    }

    // Calcular demanda média
    const avgDemand = await this.stockService.calculateAverageDemand(
      request.product_id,
      30
    );

    // Previsão simples baseada em média móvel
    const currentQty = stock.current_quantity;
    const avgDailyDemand = avgDemand / 30;
    const predictedQty = Math.max(
      0,
      currentQty - avgDailyDemand * request.horizon_days
    );

    // Calcular confiança baseada na quantidade de dados históricos
    const salesHistory = await this.stockService.getSalesHistory({
      product_id: request.product_id,
      limit: 100,
    });
    const confidence = Math.min(0.95, Math.max(0.5, salesHistory.length / 100));

    // Determinar nível de alerta
    let alertLevel: "low" | "medium" | "high" | "critical" = "low";
    let alertMessage = "";

    if (predictedQty <= 0) {
      alertLevel = "critical";
      alertMessage = `Estoque previsto para acabar em ${request.horizon_days} dias`;
    } else if (predictedQty < (stock.min_stock_level || 0)) {
      alertLevel = "high";
      alertMessage = `Estoque previsto abaixo do mínimo em ${request.horizon_days} dias`;
    } else if (predictedQty < (stock.reorder_point || 0)) {
      alertLevel = "medium";
      alertMessage = `Estoque previsto abaixo do ponto de reposição em ${request.horizon_days} dias`;
    }

    const prediction: StockPrediction = {
      product_id: request.product_id,
      stock_id: request.stock_id || stock?.id,
      prediction_type: request.prediction_type,
      prediction_date: new Date().toISOString().split("T")[0],
      horizon_days: request.horizon_days,
      predicted_value: predictedQty,
      confidence: confidence,
      lower_bound: Math.max(
        0,
        predictedQty - avgDailyDemand * request.horizon_days * 0.2
      ),
      upper_bound: predictedQty + avgDailyDemand * request.horizon_days * 0.2,
      model_name: request.model_name || "simple_moving_average",
      model_version: "1.0",
      model_features: {
        avg_daily_demand: avgDailyDemand,
        current_quantity: currentQty,
        historical_data_points: salesHistory.length,
      },
      alert_level: alertLevel,
      alert_message: alertMessage,
    };

    return await this.createPrediction(prediction);
  }

  async predictDemand(request: {
    product_id: string;
    horizon_days: number;
    model_name?: string;
  }): Promise<StockPrediction> {
    // Calcular demanda média histórica
    const avgDemand = await this.stockService.calculateAverageDemand(
      request.product_id,
      30
    );

    const avgDailyDemand = avgDemand / 30;
    const predictedDemand = avgDailyDemand * request.horizon_days;

    // Obter histórico de vendas para calcular confiança
    const salesHistory = await this.stockService.getSalesHistory({
      product_id: request.product_id,
      limit: 100,
    });
    const confidence = Math.min(0.95, Math.max(0.5, salesHistory.length / 100));

    const prediction: StockPrediction = {
      product_id: request.product_id,
      prediction_type: "demanda",
      prediction_date: new Date().toISOString().split("T")[0],
      horizon_days: request.horizon_days,
      predicted_value: predictedDemand,
      confidence: confidence,
      lower_bound: predictedDemand * 0.8,
      upper_bound: predictedDemand * 1.2,
      model_name: request.model_name || "simple_moving_average",
      model_version: "1.0",
      model_features: {
        avg_daily_demand: avgDailyDemand,
        historical_data_points: salesHistory.length,
      },
    };

    return await this.createPrediction(prediction);
  }

  async predictStockout(request: {
    product_id: string;
    stock_id?: string;
  }): Promise<StockPrediction | null> {
    // Obter estoque atual
    let stock = null;
    if (request.stock_id) {
      stock = await this.stockService.getStock(request.stock_id);
    } else {
      const stocks = await this.stockService.getStockByProduct(
        request.product_id
      );
      stock = stocks[0] || null;
    }

    if (!stock) {
      throw new Error("Estoque não encontrado");
    }

    // Calcular demanda média diária
    const avgDemand = await this.stockService.calculateAverageDemand(
      request.product_id,
      30
    );
    const avgDailyDemand = avgDemand / 30;

    if (avgDailyDemand <= 0) {
      return null; // Sem demanda, não há risco de stockout
    }

    // Calcular dias até stockout
    const daysUntilStockout = Math.ceil(
      stock.current_quantity / avgDailyDemand
    );

    const prediction: StockPrediction = {
      product_id: request.product_id,
      stock_id: request.stock_id || stock.id,
      prediction_type: "stockout",
      prediction_date: new Date().toISOString().split("T")[0],
      horizon_days: daysUntilStockout,
      predicted_value: 0,
      confidence: 0.75,
      alert_level:
        daysUntilStockout <= 7
          ? "critical"
          : daysUntilStockout <= 14
          ? "high"
          : "medium",
      alert_message: `Estoque previsto para acabar em ${daysUntilStockout} dias`,
      model_name: "stockout_calculator",
      model_version: "1.0",
      model_features: {
        current_quantity: stock.current_quantity,
        avg_daily_demand: avgDailyDemand,
      },
    };

    return await this.createPrediction(prediction);
  }

  // ============================================
  // Atualização de Previsões com Valores Reais
  // ============================================

  async updatePredictionAccuracy(
    predictionId: string,
    actualValue: number
  ): Promise<StockPrediction> {
    const prediction = await this.getPrediction(predictionId);
    if (!prediction) {
      throw new Error("Previsão não encontrada");
    }

    const predictedValue = prediction.predicted_value || 0;
    const error = Math.abs(predictedValue - actualValue);
    const accuracy =
      predictedValue > 0
        ? Math.max(0, 1 - error / predictedValue)
        : actualValue === 0
        ? 1
        : 0;

    // Usar ecommerce_predictions
    const { data, error: updateError } = await supabase
      .from("ecommerce_predictions")
      .update({
        actual_value: actualValue,
        accuracy: accuracy,
      })
      .eq("id", predictionId)
      .select()
      .single();

    if (updateError) throw updateError;
    return this.convertPrediction(data);
  }
}

// Exporta instância singleton
export const predictionService = new PredictionService();
