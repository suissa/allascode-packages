// @ts-nocheck
import { supabase } from "@/config/supabase";
import { StockService } from "./StockService";

export class PriceOptimizationService {
  private stockService: StockService;

  constructor() {
    this.stockService = new StockService();
  }

  // ============================================
  // Otimização de Lucro Líquido
  // ============================================

  async calculateOrderNetProfit(
    items: Array<{ product_id: string; quantity: number; unit_price: number }>
  ) {
    let totalRevenue = 0;
    let totalCost = 0;
    const breakdown = [] as any[];

    for (const item of items) {
      const product = await this.stockService.getProduct(item.product_id);
      if (!product) continue;

      const productPrice = product.selling_price || product.price || 0;
      const productCost = product.cost_price || product.cost || 0;
      
      const revenue = item.unit_price * item.quantity;
      const cost = productCost * item.quantity;

      totalRevenue += revenue;
      totalCost += cost;

      breakdown.push({
        product_name: product.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_price: product.cost_price,
        margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
        net_profit: revenue - cost,
      });
    }

    const netProfit = totalRevenue - totalCost;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      total_revenue: totalRevenue,
      total_cost: totalCost,
      net_profit: netProfit,
      net_margin: netMargin,
      breakdown,
    };
  }

  async optimizeOrderProfit(
    items: Array<{ product_id: string; quantity: number; unit_price: number }>
  ) {
    const analysis = await this.calculateOrderNetProfit(items);

    // Identify low margin items (< 15%)
    const lowMarginItems = analysis.breakdown.filter((i) => i.margin < 15);
    const suggestions = [] as any[];

    for (const item of lowMarginItems) {
      // Simple optimization: Suggest increasing price by 5% if elasticity allows (mocked here)
      // Or suggest generic substitute (would require similar product search logic from ecommerce service)
      suggestions.push({
        type: "price_adjustment",
        product: item.product_name,
        current_margin: item.margin.toFixed(2) + "%",
        suggestion: `Consider increasing price to ${(
          item.unit_price * 1.05
        ).toFixed(2)} to improve margin.`,
      });
    }

    return {
      analysis,
      suggestions,
    };
  }

  // ============================================
  // Precificação Dinâmica & Sazonalidade
  // ============================================

  async detectSeasonality(productId: string) {
    // Fetch sales for last 12 months via RPC or query
    // This is a simplified implementation assuming we can fetch raw sales
    const sales = await this.stockService.getSalesHistory({
      product_id: productId,
      date_from: new Date(
        new Date().setFullYear(new Date().getFullYear() - 1)
      ).toISOString(),
      limit: 1000,
    });

    // Group by month
    const monthlySales: Record<number, number> = {}; // Month index 0-11 -> total qty
    sales.forEach((sale) => {
      const date = new Date(sale.sale_date);
      const month = date.getMonth();
      monthlySales[month] = (monthlySales[month] || 0) + sale.quantity;
    });

    // Calculate Average
    const monthsWithData = Object.keys(monthlySales).length;
    if (monthsWithData < 3)
      return { has_seasonality: false, message: "Dados insuficientes" };

    const totalQty = Object.values(monthlySales).reduce((a, b) => a + b, 0);
    const avgMonthly = totalQty / 12; // Normalize over year

    // Check if current month is Peak ( > 30% above avg)
    const currentMonth = new Date().getMonth();
    const isPeak = (monthlySales[currentMonth] || 0) > avgMonthly * 1.3;
    const isLow = (monthlySales[currentMonth] || 0) < avgMonthly * 0.7;

    let sentiment = "neutral";
    if (isPeak) sentiment = "high_demand";
    if (isLow) sentiment = "low_demand";

    return {
      has_seasonality: isPeak || isLow,
      seasonality_type: sentiment,
      avg_monthly_sales: avgMonthly,
      current_month_sales: monthlySales[currentMonth] || 0,
      factor: (monthlySales[currentMonth] || 0) / (avgMonthly || 1),
    };
  }

  async suggestDynamicPrice(productId: string) {
    const product = await this.stockService.getProduct(productId);
    if (!product) throw new Error("Produto não encontrado");

    const seasonality = await this.detectSeasonality(productId);
    const basePrice = product.selling_price || product.price || 0;
    const costPrice = product.cost_price || product.cost || 0;
    
    let suggestedPrice = basePrice;
    let reason = "Preço base mantido (demanda estável).";

    if (seasonality.seasonality_type === "high_demand") {
      suggestedPrice = basePrice * 1.1; // +10%
      reason = `Alta sazonalidade detectada (Demanda ${(
        seasonality.factor * 100
      ).toFixed(0)}% da média). Sugerido aumento de 10%.`;
    } else if (seasonality.seasonality_type === "low_demand") {
      suggestedPrice = basePrice * 0.95; // -5% promo
      reason = `Baixa sazonalidade (Demanda ${(
        seasonality.factor * 100
      ).toFixed(0)}% da média). Sugerido desconto de 5% para giro.`;
    }

    // Ensure we don't go below cost + 10% margin
    const minPrice = costPrice * 1.1;
    if (suggestedPrice < minPrice) {
      suggestedPrice = minPrice;
      reason += " (Limitado pela margem mínima de 10%)";
    }

    return {
      product_name: product.name,
      current_price: basePrice,
      suggested_price: Number(suggestedPrice.toFixed(2)),
      seasonality_analysis: seasonality,
      reason,
    };
  }
}

// Exporta instância singleton
export const priceOptimizationService = new PriceOptimizationService();
