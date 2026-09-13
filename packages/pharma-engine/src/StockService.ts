import { supabase } from "@/config/supabase";
import {
  PharmaProduct,
  PharmaStock,
  StockMovement,
  StockReport,
  SalesHistory,
} from "./types";
import { BatchService } from "./BatchService";
import { InvariantEngine } from "@/shared/services/InvariantEngine";
import { stockInvariants } from "../invariants";

export class StockService {
  private batchService: BatchService;

  constructor() {
    this.batchService = new BatchService();
  }
  // ============================================
  // Produtos
  // ============================================

  async createProduct(product: PharmaProduct): Promise<PharmaProduct> {
    // Invariants-as-Code (Backend Stage)
    InvariantEngine.validate("pharma_product", product, stockInvariants, "backend");

    // Usar ecommerce_products ao invés de pharma_products
    const { data, error } = await supabase
      .from("ecommerce_products")
      .insert({
        ...product,
        status: product.is_active !== false ? "active" : "draft",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getProduct(id: string): Promise<PharmaProduct | null> {
    // Usar ecommerce_products
    const { data, error } = await supabase
      .from("ecommerce_products")
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

  async getProductBySku(sku: string): Promise<PharmaProduct | null> {
    // Usar ecommerce_products
    const { data, error } = await supabase
      .from("ecommerce_products")
      .select("*")
      .eq("sku", sku)
      .is("valid_to", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  }

  async listProducts(filters?: {
    category?: string;
    is_active?: boolean;
    search?: string;
    business_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<PharmaProduct[]> {
    // Usar ecommerce_products
    let query = supabase
      .from("ecommerce_products")
      .select("*")
      .is("valid_to", null)
      .order("name");

    // Filtrar por status ao invés de is_active
    if (filters?.is_active !== undefined) {
      query = query.eq("status", filters.is_active ? "active" : "draft");
    } else {
      // Por padrão, mostrar apenas ativos
      query = query.eq("status", "active");
    }

    if (filters?.business_id) {
      query = query.eq("business_id", filters.business_id);
    }

    if (filters?.category) {
      // Buscar por category_id se for UUID, ou por nome da categoria
      query = query.eq("category_id", filters.category);
    }

    if (filters?.search) {
      // Split search into terms and filter for each term (AND logic)
      const terms = filters.search.split(/\s+/).filter((t) => t.length > 0);
      terms.forEach((term) => {
        query = query.ilike("name", `%${term}%`);
      });
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1,
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async updateProduct(
    id: string,
    updates: Partial<PharmaProduct>,
  ): Promise<PharmaProduct> {
    // Usar ecommerce_products
    const updateData: any = { ...updates };

    // Converter is_active para status
    if ("is_active" in updates) {
      updateData.status = updates.is_active ? "active" : "draft";
      delete updateData.is_active;
    }

    const { data, error } = await supabase
      .from("ecommerce_products")
      .update(updateData)
      .eq("id", id)
      .is("valid_to", null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================
  // Estoque
  // ============================================

  async createStock(stock: PharmaStock): Promise<PharmaStock> {
    // Invariants-as-Code (Backend Stage)
    InvariantEngine.validate("pharma_stock", stock, stockInvariants, "backend");

    const { data, error } = await supabase
      .from("pharma_stock")
      .insert(stock)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getStock(id: string): Promise<PharmaStock | null> {
    const { data, error } = await supabase
      .from("pharma_stock")
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

  async getStockByProduct(
    productId: string,
    locationId?: string,
    business_id?: string,
  ): Promise<PharmaStock[]> {
    let query = supabase
      .from("pharma_stock")
      .select("*")
      .eq("product_id", productId)
      .is("valid_to", null)
      .eq("is_active", true);

    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    if (business_id) {
      query = query.eq("business_id", business_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async updateStock(
    id: string,
    updates: Partial<PharmaStock>,
  ): Promise<PharmaStock> {
    const { data, error } = await supabase
      .from("pharma_stock")
      .update(updates)
      .eq("id", id)
      .is("valid_to", null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async stockInWithBatch(params: {
    product_id: string;
    location_id: string;
    quantity: number;
    batch_number: string;
    manufacturing_date: string;
    expiration_date: string;
    unit_cost?: number;
    supplier_id?: string;
  }): Promise<{ stock: PharmaStock; batch: any; movement: StockMovement }> {
    // 1. Criar ou obter registro de estoque principal
    let stockList = await this.getStockByProduct(
      params.product_id,
      params.location_id,
    );
    let stock: PharmaStock;

    if (stockList.length === 0) {
      stock = await this.createStock({
        product_id: params.product_id,
        location_id: params.location_id,
        current_quantity: 0,
        is_active: true,
      });
    } else {
      stock = stockList[0];
    }

    // 2. Criar o lote
    const batch = await this.batchService.registerBatch({
      product_id: params.product_id,
      location_id: params.location_id,
      batch_number: params.batch_number,
      manufacturing_date: params.manufacturing_date,
      expiration_date: params.expiration_date,
      initial_quantity: params.quantity,
      supplier_id: params.supplier_id,
    });

    // 3. Registrar a movimentação
    const movement = await this.createMovement({
      stock_id: stock.id!,
      product_id: params.product_id,
      movement_type: "entrada",
      movement_reason: "Entrada via Lote",
      quantity: params.quantity,
      quantity_before: stock.current_quantity,
      quantity_after: stock.current_quantity + params.quantity,
      batch_id: batch.id,
      unit_cost: params.unit_cost,
      total_cost: params.unit_cost
        ? params.unit_cost * params.quantity
        : undefined,
    });

    // 4. Recarregar estoque atualizado
    const updatedStock = await this.getStock(stock.id!);

    return { stock: updatedStock!, batch, movement };
  }

  async getStockReport(locationId?: string): Promise<StockReport[]> {
    const { data, error } = await supabase.rpc("get_stock_report", {
      p_location_id: locationId || null,
    });

    if (error) throw error;

    // Mapear retorno out_ para StockReport
    return (data || []).map((item: any) => ({
      product_id: item.out_product_id,
      product_name: item.out_product_name,
      sku: item.out_sku,
      location_name: item.out_location_name,
      current_quantity: item.out_current_quantity,
      min_stock_level: item.out_min_stock_level,
      max_stock_level: item.out_max_stock_level,
      reorder_point: item.out_reorder_point,
      status: item.out_status,
      earliest_expiration: item.out_earliest_expiration,
      days_until_expiration: item.out_days_until_expiration,
    })) as StockReport[];
  }

  // ============================================
  // Movimentações
  // ============================================

  async createMovement(movement: StockMovement): Promise<StockMovement> {
    // Obter quantidade atual
    const stock = await this.getStock(movement.stock_id);
    if (!stock) {
      throw new Error("Estoque não encontrado");
    }

    const quantityBefore = stock.current_quantity;
    let quantityAfter = quantityBefore;

    // Calcular quantidade após movimentação
    if (["entrada", "ajuste", "devolucao"].includes(movement.movement_type)) {
      quantityAfter = quantityBefore + movement.quantity;
    } else if (
      ["saida", "venda", "perda", "vencimento"].includes(movement.movement_type)
    ) {
      quantityAfter = Math.max(0, quantityBefore - movement.quantity);
    }

    const movementData: StockMovement = {
      ...movement,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
    };

    // Registrar no lote se batch_id estiver presente
    if (movement.batch_id) {
      if (
        ["saida", "venda", "perda", "vencimento"].includes(
          movement.movement_type,
        )
      ) {
        await this.batchService.withdrawFromBatch(
          movement.batch_id,
          movement.quantity,
        );
      }
    }

    const { data, error } = await supabase
      .from("pharma_stock_movements")
      .insert(movementData)
      .select()
      .single();

    if (error) throw error;

    // Atualizar a quantidade atual na tabela pharma_stock principal
    await supabase
      .from("pharma_stock")
      .update({ current_quantity: quantityAfter })
      .eq("id", movement.stock_id);

    return data;
  }

  async getMovements(filters?: {
    product_id?: string;
    stock_id?: string;
    movement_type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<StockMovement[]> {
    let query = supabase
      .from("pharma_stock_movements")
      .select("*")
      .is("valid_to", null)
      .order("created_at", { ascending: false });

    if (filters?.product_id) {
      query = query.eq("product_id", filters.product_id);
    }

    if (filters?.stock_id) {
      query = query.eq("stock_id", filters.stock_id);
    }

    if (filters?.movement_type) {
      query = query.eq("movement_type", filters.movement_type);
    }

    if (filters?.date_from) {
      query = query.gte("created_at", filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte("created_at", filters.date_to);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  // ============================================
  // Histórico de Vendas
  // ============================================

  async recordSale(sale: SalesHistory): Promise<SalesHistory> {
    // Criar pedido no ecommerce_orders e order_items
    // Primeiro criar o pedido
    const { data: order, error: orderError } = await supabase
      .from("ecommerce_orders")
      .insert({
        customer_id: sale.customer_id,
        order_number: "ORD-" + Date.now(),
        subtotal: sale.total_amount,
        total: sale.total_amount,
        status: "confirmed",
        payment_status: "paid",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Criar item do pedido
    const { data: orderItem, error: itemError } = await supabase
      .from("ecommerce_order_items")
      .insert({
        order_id: order.id,
        product_id: sale.product_id,
        product_name: "", // Buscar do produto
        product_sku: "", // Buscar do produto
        quantity: sale.quantity,
        unit_price: sale.unit_price,
        total_price: sale.total_amount,
        batch_number: sale.metadata?.batch_number,
        expiration_date: sale.metadata?.expiration_date,
        day_of_week: new Date(sale.sale_date).getDay(),
        month: new Date(sale.sale_date).getMonth() + 1,
        discount_percentage: sale.discount_percentage,
      })
      .select()
      .single();

    if (itemError) throw itemError;

    // Criar movimentação de saída automaticamente com FEFO
    if (sale.stock_id) {
      const stock = await this.getStock(sale.stock_id);
      if (stock) {
        // Tentar realizar baixa FEFO
        const fefoResult = await this.batchService.processFEFOWithdrawal(
          sale.product_id,
          stock.location_id || null,
          sale.quantity,
        );

        if (fefoResult.success) {
          // Registrar movimentação principal vinculada ao primeiro lote (ou múltiplos)
          await this.createMovement({
            stock_id: sale.stock_id,
            product_id: sale.product_id,
            movement_type: "venda",
            movement_reason: `Venda via FEFO - Alocações: ${fefoResult.allocations.length}`,
            quantity: sale.quantity,
            quantity_before: stock.current_quantity,
            quantity_after: stock.current_quantity - sale.quantity,
            reference_type: "order",
            reference_id: order.id,
            metadata: {
              ...sale.metadata,
              fefo_allocations: fefoResult.allocations,
            },
          });
        } else {
          // Se não houver lotes, registra movimentação simples (estoque legado)
          await this.createMovement({
            stock_id: sale.stock_id,
            product_id: sale.product_id,
            movement_type: "venda",
            movement_reason: "Venda registrada (Sem lote disponível)",
            quantity: sale.quantity,
            quantity_before: stock.current_quantity,
            quantity_after: stock.current_quantity - sale.quantity,
            reference_type: "order",
            reference_id: order.id,
          });
        }
      }
    }

    // Retornar dados no formato SalesHistory
    return {
      id: orderItem.id,
      product_id: sale.product_id,
      stock_id: sale.stock_id,
      sale_date: sale.sale_date,
      quantity: sale.quantity,
      unit_price: sale.unit_price,
      total_amount: sale.total_amount,
      customer_id: sale.customer_id,
      order_id: order.id,
    };
  }

  async getSalesHistory(filters?: {
    product_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<SalesHistory[]> {
    // Usar view materializada pharma_sales_history ou ecommerce_order_items
    let query = supabase
      .from("pharma_sales_history")
      .select("*")
      .order("sale_date", { ascending: false });

    if (filters?.product_id) {
      query = query.eq("product_id", filters.product_id);
    }

    if (filters?.date_from) {
      query = query.gte("sale_date", filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte("sale_date", filters.date_to);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  // ============================================
  // Funções Auxiliares
  // ============================================

  async getExpiringProducts(daysAhead: number = 30): Promise<any[]> {
    const { data, error } = await supabase.rpc("get_expiring_products", {
      p_days_ahead: daysAhead,
    });

    if (error) throw error;
    return data || [];
  }

  async calculateAverageDemand(
    productId: string,
    days: number = 30,
  ): Promise<number> {
    const { data, error } = await supabase.rpc("calculate_average_demand", {
      p_product_id: productId,
      p_days: days,
    });

    if (error) throw error;
    return data || 0;
  }

  async calculateStockTurnover(
    productId: string,
    periodDays: number = 90,
  ): Promise<number> {
    const { data, error } = await supabase.rpc("calculate_stock_turnover", {
      p_product_id: productId,
      p_period_days: periodDays,
    });

    if (error) throw error;
    return data || 0;
  }

  async getLowTurnoverProducts(
    minTurnover: number = 0.5,
    periodDays: number = 90,
  ): Promise<any[]> {
    const { data, error } = await supabase.rpc("get_low_turnover_products", {
      p_min_turnover: minTurnover,
      p_period_days: periodDays,
    });

    if (error) throw error;
    return data || [];
  }

  // ============================================
  // Compliance Logs (Receitas e Auditoria)
  // ============================================

  async listComplianceLogs(filters?: {
    search?: string;
    product_name?: string;
    prescription_id?: string;
    status?: 'approved' | 'rejected' | 'pending' | 'blocked' | 'allowed' | 'warning';
    limit?: number;
  }): Promise<any[]> {
    let query = supabase
      .from("pharma_compliance_logs")
      .select("*, products:product_id(name), customers:customer_id(name)")
      .order("created_at", { ascending: false });

    if (filters?.search) {
      // Busca por nome do produto via join
      query = query.ilike("product_id", `%${filters.search}%`);
    }

    if (filters?.product_name) {
      // Nota: product_name não é coluna direta, precisa filtrar depois ou usar join
      // Mantido para compatibilidade, mas o filtro real será feito no produto
    }

    if (filters?.prescription_id) {
      query = query.eq("prescription_id", filters.prescription_id);
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
}

// Exporta instância singleton
export const stockService = new StockService();
