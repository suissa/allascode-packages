// ============================================
// Módulo de Estoque Preditivo para Farmácias
// Exportações principais
// ============================================

import { StockService } from "./StockService";
import { PredictionService } from "./PredictionService";
import { AlertService } from "./AlertService";
import { PriceOptimizationService } from "./PriceOptimizationService";
import { BatchService } from "./BatchService";
import { BlindInventoryService } from "./BlindInventoryService";

export { StockService, stockService } from "./StockService";
export { PredictionService, predictionService } from "./PredictionService";
export { AlertService, alertService } from "./AlertService";
export {
  PriceOptimizationService,
  priceOptimizationService,
} from "./PriceOptimizationService";
export { BatchService, batchService } from "./BatchService";
export {
  BlindInventoryService,
  blindInventoryService,
} from "./BlindInventoryService";
export * from "./types";
export * from "./types/blind-inventory.types";

// Factory para criar instâncias dos serviços
export class PharmaStockModule {
  public stockService: StockService;
  public predictionService: PredictionService;
  public alertService: AlertService;
  public priceService: PriceOptimizationService;
  public blindInventoryService: BlindInventoryService;

  constructor() {
    this.stockService = new StockService();
    this.predictionService = new PredictionService();
    this.alertService = new AlertService();
    this.priceService = new PriceOptimizationService();
    this.blindInventoryService = new BlindInventoryService();
  }
}
