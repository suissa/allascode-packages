// ============================================
// Tipos TypeScript para o Módulo de Estoque Preditivo
// ============================================

export interface PharmaProduct {
  id?: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category?: string;
  therapeutic_class?: string;
  active_ingredient?: string;
  manufacturer?: string;
  registration_number?: string;
  prescription_required?: boolean;
  controlled_substance?: boolean;
  unit_type?: string;
  unit_quantity?: number;
  cost_price?: number;
  selling_price?: number;
  margin_percentage?: number;
  shelf_life_days?: number;
  requires_cold_chain?: boolean;
  storage_temperature_min?: number;
  storage_temperature_max?: number;
  is_active?: boolean;
  is_discontinued?: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface PharmaStock {
  id?: string;
  product_id: string;
  location_id?: string;
  location_name?: string;
  shelf_location?: string;
  current_quantity: number;
  reserved_quantity?: number;
  available_quantity?: number;
  batch_number?: string;
  expiration_date?: string;
  manufacturing_date?: string;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  is_active?: boolean;
  is_quarantined?: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface StockMovement {
  id?: string;
  stock_id: string;
  product_id: string;
  movement_type:
    | "entrada"
    | "saida"
    | "ajuste"
    | "transferencia"
    | "venda"
    | "perda"
    | "vencimento"
    | "devolucao";
  movement_reason?: string;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reference_type?: string;
  reference_id?: string;
  batch_id?: string;
  batch_number?: string;
  expiration_date?: string;
  unit_cost?: number;
  total_cost?: number;
  notes?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface StockPrediction {
  id?: string;
  product_id: string;
  stock_id?: string;
  prediction_type:
    | "demanda"
    | "stockout"
    | "reorder"
    | "expiration"
    | "seasonality";
  prediction_date: string;
  horizon_days: number;
  predicted_value?: number;
  confidence?: number;
  lower_bound?: number;
  upper_bound?: number;
  model_name?: string;
  model_version?: string;
  model_features?: Record<string, any>;
  actual_value?: number;
  accuracy?: number;
  alert_level?: "low" | "medium" | "high" | "critical";
  alert_message?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface StockAlert {
  id?: string;
  product_id: string;
  stock_id?: string;
  batch_id?: string;
  alert_type:
    | "low_stock"
    | "out_of_stock"
    | "expiration"
    | "overstock"
    | "anomaly"
    | "reorder"
    | "quality_issue";
  severity: "low" | "medium" | "high" | "critical";
  alert_message: string;
  current_value?: number;
  threshold_value?: number;
  status?: "active" | "acknowledged" | "resolved" | "dismissed";
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  suggested_action?: string;
  action_taken?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface SalesHistory {
  id?: string;
  product_id: string;
  stock_id?: string;
  sale_date: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  customer_id?: string;
  order_id?: string;
  day_of_week?: number;
  month?: number;
  season?: string;
  is_holiday?: boolean;
  is_weekend?: boolean;
  discount_percentage?: number;
  promotion_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface StockReport {
  product_id: string;
  product_name: string;
  sku: string;
  location_name?: string;
  current_quantity: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_point?: number;
  status: "out_of_stock" | "low_stock" | "normal" | "overstock";
  earliest_expiration?: string;
  days_until_expiration?: number;
}

export interface PredictionRequest {
  product_id: string;
  stock_id?: string;
  prediction_type: 'demanda' | 'stockout' | 'reorder' | 'expiration' | 'seasonality';
  horizon_days: number;
  model_name?: string;
}

export interface AlertConfig {
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold_value?: number;
  enabled: boolean;
}
