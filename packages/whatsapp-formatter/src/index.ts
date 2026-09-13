import { z } from 'zod';

/**
 * Interface para a resposta padronizada de actions
 * 
 * @description Todas as actions devem retornar dados neste formato
 * para garantir consistência na formatação WhatsApp.
 */
export interface ActionResponse {
  /**
   * Indica se a operação foi bem-sucedida
   */
  success: boolean;
  
  /**
   * Nome da intenção executada
   */
  intent: string;
  
  /**
   * Dados retornados pela action
   */
  data?: any;
  
  /**
   * Mensagem descritiva do resultado
   */
  message?: string;
  
  /**
   * Mensagem de erro (apenas quando success === false)
   */
  error?: string;
  
  /**
   * Metadados opcionais
   */
  metadata?: {
    count?: number;
    page?: number;
    total?: number;
    [key: string]: any;
  };
}

/**
 * Formatação de respostas para WhatsApp
 * 
 * @description
 * Formata respostas de actions do OmniChannelBridge CRM para exibição
 * otimizada no WhatsApp, com emojis, negrito e estrutura visual clara.
 * 
 * @example
 * ```typescript
 * const response: ActionResponse = {
 *   success: true,
 *   intent: 'listProducts',
 *   data: [{ name: 'Produto A', price: 10.99 }]
 * };
 * 
 * const formatted = WhatsappFormatter.format(response);
 * // Retorna: "📋 LISTA DE PRODUTOS (1)\n\n• Produto A..."
 * ```
 */
export class WhatsappFormatter {
  /**
   * Formata uma resposta de action para WhatsApp
   * 
   * @param response - Resposta da action a ser formatada
   * @returns String formatada para WhatsApp
   */
  public static format(response: ActionResponse | string): string {
    // Strings passam direto (já formatadas)
    if (typeof response === 'string') return response;
    
    if (!response) return '❌ *Erro:* Resposta inválida.';
    
    // Tratamento de erro
    if (!response.success) {
      const errorStr = response.error || response.message || 'Erro desconhecido';
      
      const missingParamMatch = errorStr.match(/(?:(?:^|:\s*)([a-zA-Z0-9_]+)\s+é obrigatório)/i);
      if (missingParamMatch && missingParamMatch[1]) {
        const paramName = missingParamMatch[1];
        const translated = this.translateKey(paramName);
        return `❓ *Faltam Informações*\n\nPara que eu possa concluir sua solicitação, por favor, me informe:\n\n👉 *${translated}*`;
      }

      return `❌ *Falha na operação*\n\n*Motivo:* ${errorStr}`;
    }

    const intent = response.intent;
    const data = response.data;

    if (!intent) return this.formatGeneric(response);

    // ==================== FINANCEIRO ====================
    if (intent.startsWith('getKPIs') || intent === 'getFinancialDashboard') {
      return this.formatKPIs(data, response);
    }
    if (intent === 'getProductProfit' || intent === 'getMostProfitableProduct') {
      return this.formatProductProfit(data, response);
    }
    if (intent === 'getDailyRevenue') {
      return this.formatRevenue(data, response);
    }

    // ==================== ESTOQUE / PRODUTOS ====================
    if (intent === 'checkStock' || intent === 'hasProduct' || intent === 'checkProductAvailability') {
      return this.formatStockCheck(data, response);
    }
    if (intent === 'listProducts') {
      return this.formatProductList(data, response);
    }
    if (intent === 'predictStockout') {
      return this.formatStockPrediction(data, response);
    }
    if (intent === 'getProductDetails' || intent === 'getProduct') {
      return this.formatProductDetails(data, response);
    }
    if (intent === 'listCategories') {
      return this.formatCategories(data, response);
    }

    // ==================== PEDIDOS ====================
    if (intent === 'getOrder' || intent === 'getLastOrder') {
      return this.formatOrder(data, response);
    }
    if (intent === 'listOrders' || intent === 'listStockOrders') {
      return this.formatOrderList(data, response);
    }
    if (intent === 'getOrderDetails') {
      return this.formatOrderDetails(data, response);
    }

    // ==================== FORNECEDORES ====================
    if (intent === 'listSuppliers') {
      return this.formatSuppliers(data, response);
    }
    if (intent === 'findSupplierByProduct') {
      return this.formatSupplierByProduct(data, response);
    }
    if (intent === 'getSupplierCatalog') {
      return this.formatSupplierCatalog(data, response);
    }
    if (intent === 'requestSupplierCatalog') {
      return this.formatCatalogRequest(response);
    }
    if (intent === 'checkStockNeeds') {
      return this.formatStockNeeds(data, response);
    }
    if (intent === 'executeRestockCycle') {
      return this.formatRestockCycle(response);
    }
    if (intent === 'manageSupplier') {
      return this.formatSupplierManagement(response);
    }

    // ==================== FARMÁCIA / MEDICAMENTOS ====================
    if (intent === 'getSuggestedMedication' || intent === 'getSymptomRemedy') {
      return this.formatMedicationSuggestion(data, response);
    }
    if (intent === 'checkPrescription') {
      return this.formatPrescriptionCheck(response);
    }
    if (intent === 'checkDrugInteraction') {
      return this.formatDrugInteraction(response);
    }

    // ==================== CLIENTES ====================
    if (intent === 'getCustomerHistory') {
      return this.formatCustomerHistory(data, response);
    }
    if (intent === 'getCustomerComplaints') {
      return this.formatCustomerComplaints(data, response);
    }
    if (intent === 'getChurnedCustomers') {
      return this.formatChurnedCustomers(data, response);
    }
    if (intent === 'getLoyalCustomers') {
      return this.formatLoyalCustomers(data, response);
    }

    // ==================== ENTREGAS ====================
    if (intent === 'checkDeliveryStatus' || intent === 'trackOrder') {
      return this.formatDeliveryStatus(data, response);
    }
    if (intent === 'getDeliveryFee') {
      return this.formatDeliveryFee(data, response);
    }

    // ==================== PREÇOS / PROMOÇÕES ====================
    if (intent === 'getPrice') {
      return this.formatPrice(data, response);
    }
    if (intent === 'getPromotions') {
      return this.formatPromotions(data, response);
    }
    if (intent === 'suggestDynamicPricing') {
      return this.formatDynamicPricing(data, response);
    }
    if (intent === 'checkDiscountEligibility') {
      return this.formatDiscountCheck(response);
    }

    // ==================== CARRINHO / E-COMMERCE ====================
    if (intent === 'getCart' || intent === 'listCarts') {
      return this.formatCart(data, response);
    }
    if (intent === 'getAbandonedCarts') {
      return this.formatAbandonedCarts(data, response);
    }
    if (intent === 'getMetrics' || intent === 'getDashboard') {
      return this.formatMetrics(data, response);
    }

    // ==================== FILTROS ====================
    if (intent === 'filterAndSortResults') {
      return this.formatFilteredResults(response);
    }

    // ==================== CAMPANHAS ====================
    if (intent === 'listCampaigns' || intent === 'getCampaign') {
      return this.formatCampaigns(data, response);
    }
    if (intent === 'getCampaignStats') {
      return this.formatCampaignStats(data, response);
    }

    // ==================== FIDELIDADE ====================
    if (intent === 'getAccount' || intent === 'listPoints') {
      return this.formatFidelityPoints(data, response);
    }
    if (intent === 'getHistory' && response.intent.includes('fidelity')) {
      return this.formatFidelityHistory(data, response);
    }

    // ==================== GENÉRICO ====================
    return this.formatGeneric(response);
  }

  // ==================== FORMATADORES ESPECÍFICOS ====================

  private static formatKPIs(data: any, response: ActionResponse): string {
    if (!data) return response.message || '📊 *KPIs*\n\nNenhum dado disponível.';

    const items = Array.isArray(data) ? data : [data];
    let msg = '💰 *RELATÓRIO FINANCEIRO*\n\n';

    items.slice(0, 5).forEach((kpi: any, i: number) => {
      const name = kpi.name || kpi.kpi_name || `KPI ${i + 1}`;
      const value = kpi.value || kpi.current_value || kpi.result;
      
      msg += `📊 *${name}*\n`;
      msg += `   Valor: *${typeof value === 'number' ? this.formatMoney(value) : value}*\n`;
      
      if (kpi.target) msg += `   Meta: *${this.formatMoney(kpi.target)}*\n`;
      if (kpi.comparison || kpi.variation) {
        const comp = kpi.comparison || kpi.variation;
        const arrow = comp > 0 ? '📈' : comp < 0 ? '📉' : '➡️';
        msg += `   Variação: ${arrow} *${Math.abs(comp)}%*\n`;
      }
      msg += '\n';
    });

    if (response.message) msg += `${response.message}\n`;
    return msg;
  }

  private static formatStockCheck(data: any, response: ActionResponse): string {
    // Formato com found + products
    if (response.metadata?.found || (data as any)?.found) {
      const products = (data as any)?.products || [data];
      if (!products || products.length === 0) {
        return '❌ *INDISPONÍVEL*\n\nProduto não encontrado no estoque.';
      }
      
      const p = products[0];
      return `✅ *DISPONÍVEL*\n\n` +
             `📦 *${p.name || p.product_name}*\n` +
             `💵 Preço: *R$ ${this.formatMoney(p.price || p.selling_price)}*\n` +
             `🔢 Estoque: *${p.qty || p.quantity || p.stock_quantity} unidades*\n` +
             `${p.last_arrival ? `📅 Última chegada: ${this.formatDate(p.last_arrival)}\n` : ''}`;
    }

    // Formato direto
    if (!data) {
      return response.message || '❌ *INDISPONÍVEL*\n\nProduto não encontrado.';
    }

    const available = data.available || (data.stock_quantity && data.stock_quantity > 0);
    const status = available ? '✅ *DISPONÍVEL*' : '❌ *INDISPONÍVEL*';
    
    let msg = `${status}\n\n`;
    msg += `📦 *${data.product_name || data.name}*\n`;
    msg += `🔢 Estoque: *${data.quantity ?? data.stock_quantity ?? 0} unidades*\n`;
    if (data.price || data.selling_price) {
      msg += `💵 Preço: *R$ ${this.formatMoney(data.price || data.selling_price)}*\n`;
    }
    if (data.last_arrival) {
      msg += `📅 Última chegada: *${this.formatDate(data.last_arrival)}*\n`;
    }

    return msg;
  }

  private static formatProductList(data: any, response: ActionResponse): string {
    const items = Array.isArray(data) ? data : data?.items || [];
    
    if (items.length === 0) {
      return '📭 *Nenhum produto encontrado.*\n\n' + (response.message || '');
    }

    let msg = `📋 *PRODUTOS (${items.length})*\n\n`;
    
    items.slice(0, 10).forEach((item: any) => {
      msg += `• *${item.name}*\n`;
      msg += `  SKU: ${item.sku || 'N/A'}\n`;
      msg += `  💵 *R$ ${this.formatMoney(item.price || item.selling_price)}*\n`;
      msg += `  📦 Est: ${item.stock_quantity ?? item.quantity ?? 0}\n\n`;
    });

    if (items.length > 10) {
      msg += `_... e mais ${items.length - 10} produtos._\n`;
    }

    return msg;
  }

  private static formatProductDetails(data: any, response: ActionResponse): string {
    if (!data) {
      return response.message || '📭 Produto não encontrado.';
    }

    const product = Array.isArray(data) ? data[0] : data;
    
    let msg = `🏷️ *${product.name}*\n\n`;
    msg += `🔖 SKU: *${product.sku || 'N/A'}*\n`;
    msg += `💵 Preço: *R$ ${this.formatMoney(product.price || product.selling_price)}*\n`;
    msg += `📦 Estoque: *${product.stock_quantity || product.quantity || 0} unidades*\n`;
    
    if (product.description) {
      msg += `\n📝 *Descrição:*\n${product.description}\n`;
    }
    if (product.category) {
      msg += `📂 Categoria: *${product.category}*\n`;
    }
    if (product.brand) {
      msg += `🏭 Marca: *${product.brand}*\n`;
    }

    return msg;
  }

  private static formatOrder(data: any, response: ActionResponse): string {
    if (!data) {
      return response.message || '📭 Pedido não encontrado.';
    }

    const order = Array.isArray(data) ? data[0] : data;
    
    let msg = '📦 *PEDIDO*\n\n';
    msg += `🆔 *ID:* #${order.id?.split('-')[0] || order.order_id}\n`;
    msg += `📅 *Data:* ${this.formatDate(order.created_at || order.order_date)}\n`;
    msg += `👤 *Cliente:* ${order.customer_name || 'Cliente Final'}\n`;
    msg += `📊 *Status:* ${this.formatStatus(order.status)}\n`;
    msg += `💰 *Total: R$ ${this.formatMoney(order.total_amount || order.total || order.total_cost)}*\n\n`;

    const items = order.items || order.order_items || [];
    if (items.length > 0) {
      msg += '*Itens:*\n';
      items.forEach((item: any) => {
        msg += `• ${item.quantity || item.quantity_ordered}x ${item.product_name || item.name}\n`;
        msg += `  (R$ ${this.formatMoney(item.unit_price || item.unit_cost)} cada)\n`;
      });
    }

    if (order.shipping_address) {
      msg += `\n📍 *Entrega:*\n${order.shipping_address}\n`;
    }

    return msg;
  }

  private static formatOrderList(data: any, response: ActionResponse): string {
    const orders = Array.isArray(data) ? data : data?.orders || [];
    
    if (orders.length === 0) {
      return '📭 *Nenhum pedido encontrado.*';
    }

    let msg = '📑 *ÚLTIMOS PEDIDOS*\n\n';
    
    orders.slice(0, 5).forEach((order: any) => {
      msg += `• *#${order.id?.split('-')[0]}* - ${this.formatStatus(order.status)}\n`;
      msg += `  💰 *R$ ${this.formatMoney(order.total_amount || order.total || order.total_cost)}*\n`;
      msg += `  📅 ${this.formatDate(order.created_at || order.order_date)}\n\n`;
    });

    if (orders.length > 5) {
      msg += `_... e mais ${orders.length - 5} pedidos._\n`;
    }

    return msg;
  }

  private static formatOrderDetails(data: any, response: ActionResponse): string {
    return this.formatOrder(data, response);
  }

  private static formatRevenue(data: any, response: ActionResponse): string {
    if (!data) return response.message || '📭 Sem dados de faturamento.';

    const revenue = data.revenue || data.total_revenue || data.amount;
    const target = data.target || data.target_revenue;
    const projection = data.projection || data.projected_revenue;

    let msg = '💰 *FATURAMENTO*\n\n';
    msg += `• Realizado: *R$ ${this.formatMoney(revenue)}*\n`;
    
    if (target) {
      const percent = ((revenue / target) * 100).toFixed(1);
      msg += `• Meta: *R$ ${this.formatMoney(target)}* (${percent}% atingido)\n`;
    }
    
    if (projection) {
      msg += `• Projeção: *R$ ${this.formatMoney(projection)}*\n`;
    }

    return msg;
  }

  private static formatMedicationSuggestion(data: any, response: ActionResponse): string {
    const suggestions = Array.isArray(data) ? data : data?.suggestions || data?.medications || [];
    
    if (suggestions.length === 0) {
      return response.message || '💊 *SUGESTÃO FARMACÊUTICA*\n\n_Consulte um farmacêutico para indicações precisas._';
    }

    let msg = '💊 *SUGESTÃO FARMACÊUTICA*\n\n';
    const symptom = response.metadata?.symptom || data?.symptom || 'sintoma';
    msg += `Para: *${symptom}*\n\n`;

    suggestions.forEach((s: any) => {
      msg += `• *${s.name || s.product_name}*\n`;
      if (s.dosage) msg += `  Dosagem: ${s.dosage}\n`;
      if (s.instruction) msg += `  _${s.instruction}_\n`;
      msg += '\n';
    });

    msg += '⚠️ *Atenção:* Use apenas sob orientação profissional.\n';
    return msg;
  }

  private static formatCustomerHistory(data: any, response: ActionResponse): string {
    if (!data) return response.message || '📭 Histórico não encontrado.';

    let msg = '👤 *HISTÓRICO DO CLIENTE*\n\n';
    msg += `• Compras: *${data.total_orders || 0}*\n`;
    msg += `• Gasto total: *R$ ${this.formatMoney(data.total_spent || 0)}*\n`;
    msg += `• Último pedido: ${this.formatDate(data.last_order_date)}\n`;
    
    if (data.preferred_categories?.length > 0) {
      msg += `• Categorias: ${data.preferred_categories.join(', ')}\n`;
    }
    if (data.avg_ticket) {
      msg += `• Ticket médio: *R$ ${this.formatMoney(data.avg_ticket)}*\n`;
    }

    return msg;
  }

  private static formatStockPrediction(data: any, response: ActionResponse): string {
    const items = Array.isArray(data) ? data : data?.at_risk || data?.products || [];
    
    if (items.length === 0) {
      return '✅ *Estoque saudável.*\n\nNenhum produto com risco de ruptura hoje.';
    }

    let msg = '⚠️ *RISCO DE RUPTURA*\n\n';
    items.slice(0, 10).forEach((item: any) => {
      msg += `• *${item.name || item.product_name}*\n`;
      msg += `  Acaba em: *${item.days_left || item.days_until_stockout || '?'} dias*\n`;
      msg += `  Restam: ${item.current_stock || item.quantity || 0} unidades\n\n`;
    });

    return msg;
  }

  private static formatDeliveryStatus(data: any, response: ActionResponse): string {
    if (!data) return response.message || '📭 Status de entrega não encontrado.';

    const isDelivered = ['delivered', 'entregue'].includes(data.status);
    const isShipped = ['shipped', 'enviado', 'em_transito', 'em trânsito'].includes(data.status);
    const emoji = isDelivered ? '✅' : isShipped ? '🚚' : '⏳';

    let msg = `${emoji} *ENTREGA*\n\n`;
    msg += `📦 *Pedido:* #${data.order_id || data.tracking_code}\n`;
    msg += `📊 *Status:* ${this.formatStatus(data.status)}\n`;
    
    if (data.eta || data.estimated_arrival) {
      msg += `📅 *Previsão:* ${this.formatDate(data.eta || data.estimated_arrival)}\n`;
    }
    if (data.carrier) {
      msg += `🚚 Transportadora: *${data.carrier}*\n`;
    }

    return msg;
  }

  private static formatDeliveryFee(data: any, response: ActionResponse): string {
    if (!data) return response.message || '📭 Taxa de entrega não disponível.';

    let msg = '🚚 *TAXA DE ENTREGA*\n\n';
    msg += `💵 Valor: *R$ ${this.formatMoney(data.fee || data.amount || data.delivery_fee)}*\n`;
    
    if (data.estimated_time) {
      msg += `⏱️ Tempo estimado: ${data.estimated_time}\n`;
    }
    if (data.free_threshold) {
      msg += `🎁 Grátis para pedidos acima de R$ ${this.formatMoney(data.free_threshold)}\n`;
    }

    return msg;
  }

  private static formatPrice(data: any, response: ActionResponse): string {
    if (!data) return response.message || '📭 Preço não disponível.';

    let msg = '💵 *PREÇO*\n\n';
    msg += `📦 *${data.product_name || data.name}*\n`;
    msg += `💰 *R$ ${this.formatMoney(data.price || data.selling_price)}*\n`;
    
    if (data.old_price) {
      msg += `  De: R$ ${this.formatMoney(data.old_price)}\n`;
    }
    if (data.promotion) {
      msg += `🎉 *Oferta:* ${data.promotion}\n`;
    }
    if (data.installments) {
      msg += `  Parcelamento: ${data.installments}\n`;
    }

    return msg;
  }

  private static formatProductProfit(data: any, response: ActionResponse): string {
    const products = Array.isArray(data) ? data : data?.products || [];
    
    if (products.length === 0) {
      return '📈 *Nenhuma análise de lucro disponível.*';
    }

    let msg = '📊 *LUCRATIVIDADE POR PRODUTO*\n\n';
    products.slice(0, 5).forEach((p: any) => {
      msg += `• *${p.name}*\n`;
      msg += `  Lucro: *R$ ${this.formatMoney(p.profit)}*\n`;
      msg += `  Margem: *${p.margin_percentage || p.margin}%*\n`;
      msg += `  Vendidos: ${p.quantity_sold || p.sold}\n\n`;
    });

    return msg;
  }

  private static formatCategories(data: any, response: ActionResponse): string {
    const categories = Array.isArray(data) ? data : [];
    
    if (categories.length === 0) {
      return '📭 *Nenhuma categoria encontrada.*';
    }

    let msg = `📂 *CATEGORIAS (${categories.length})*\n\n`;
    categories.slice(0, 10).forEach((cat: any) => {
      msg += `• *${cat.name}*\n`;
      if (cat.product_count) msg += `  ${cat.product_count} produtos\n`;
      msg += '\n';
    });

    return msg;
  }

  private static formatSuppliers(data: any, response: ActionResponse): string {
    const suppliers = Array.isArray(data) ? data : [];
    
    if (suppliers.length === 0) {
      return '📭 *Nenhum fornecedor cadastrado.*';
    }

    let msg = `🤝 *FORNECEDORES (${suppliers.length})*\n\n`;
    suppliers.slice(0, 10).forEach((s: any, i: number) => {
      msg += `• *${s.name}*\n`;
      if (s.phone) msg += `  📞 ${s.phone}\n`;
      if (s.email) msg += `  ✉️ ${s.email}\n`;
      if (s.products) msg += `  📦 ${s.products} produtos\n`;
      msg += '\n';
    });

    return msg;
  }

  private static formatSupplierByProduct(data: any, response: ActionResponse): string {
    const suppliers = Array.isArray(data) ? data : [];
    
    if (suppliers.length === 0) {
      const productName = response.metadata?.product_name || 'este produto';
      return `😔 Não encontrei fornecedores para *${productName}*. `;
    }

    let msg = '🔍 *FORNECEDORES ENCONTRADOS*\n\n';
    suppliers.slice(0, 5).forEach((s: any, i: number) => {
      msg += `• *${s.supplier?.name || s.name}*\n`;
      if (s.best_quote?.unit_price) {
        msg += `  💵 Melhor preço: R$ ${this.formatMoney(s.best_quote.unit_price)}\n`;
      }
      if (s.best_quote?.minimum_order_quantity) {
        msg += `  📦 MOQ: ${s.best_quote.minimum_order_quantity} un\n`;
      }
      msg += '\n';
    });

    return msg;
  }

  private static formatSupplierCatalog(data: any, response: ActionResponse): string {
    const items = Array.isArray(data) ? data : [];
    
    if (items.length === 0) {
      const supplierName = response.metadata?.supplier_name || 'este fornecedor';
      return `📭 Catálogo vazio para *${supplierName}*. `;
    }

    let msg = `📋 *CATÁLOGO*\n\n`;
    items.slice(0, 10).forEach((q: any, i: number) => {
      msg += `• *${q.product_name}*\n`;
      msg += `  💵 R$ ${this.formatMoney(q.unit_price)}\n`;
      if (q.minimum_order_quantity) {
        msg += `  📦 MOQ: ${q.minimum_order_quantity} un\n`;
      }
      msg += '\n';
    });

    return msg;
  }

  private static formatCatalogRequest(response: ActionResponse): string {
    const details = response.metadata?.details || [];
    
    if (!Array.isArray(details) || details.length === 0) {
      return `📩 *SOLICITAÇÃO DE CATÁLOGO*\n\n${response.message || ''}`;
    }

    let msg = '📩 *CATÁLOGOS SOLICITADOS*\n\n';
    details.forEach((d: any) => {
      const status = d.status === 'sent' ? '✅ Enviado' : '❌ Falha';
      msg += `• ${d.supplier}: ${status}\n`;
    });

    if (response.message) msg += `\n${response.message}\n`;
    return msg;
  }

  private static formatStockNeeds(data: any, response: ActionResponse): string {
    const orders = Array.isArray(data) ? data : [];
    
    if (orders.length === 0) {
      return '📋 *REPOSIÇÃO*\n\n✅ Tudo em dia com o estoque!\n\n' + (response.message || '');
    }

    let msg = '📋 *SUGESTÃO DE REPOSIÇÃO*\n\n';
    orders.slice(0, 5).forEach((o: any) => {
      msg += `🏢 *${o.supplier || o.supplier_name}*\n`;
      msg += `  💰 Total: R$ ${this.formatMoney(o.total || o.total_amount)}\n`;
      if (o.items) {
        const itemsList = Array.isArray(o.items) 
          ? o.items.map((i: any) => `${i.quantity}x ${i.product_name}`).join(', ')
          : o.items;
        msg += `  📦 Itens: ${itemsList}\n`;
      }
      msg += '\n';
    });

    if (response.message) msg += `${response.message}\n`;
    return msg;
  }

  private static formatRestockCycle(response: ActionResponse): string {
    const report = response.metadata?.report || [];
    
    if (!Array.isArray(report) || report.length === 0) {
      return `🚀 *REPOSIÇÃO*\n\n${response.message || 'Operação realizada'}`;
    }

    let msg = '🚀 *CICLO DE REPOSIÇÃO*\n\n';
    report.forEach((r: any) => {
      const icon = r.status === 'success' ? '✅' : '❌';
      msg += `${icon} *${r.supplier}*: `;
      msg += r.status === 'success' ? `Pedido #${r.order_id}` : 'Falha';
      msg += '\n';
    });

    if (response.message) msg += `\n${response.message}\n`;
    return msg;
  }

  private static formatSupplierManagement(response: ActionResponse): string {
    const data = response.data;
    const operation = response.metadata?.operation || 'Operação';
    
    let msg = `👤 *${operation}*\n\n`;
    msg += `✅ ${response.message || 'Realizada com sucesso'}\n`;
    
    if (data?.id) msg += `ID: ${data.id}\n`;
    if (data?.name) msg += `Nome: ${data.name}\n`;

    return msg;
  }

  private static formatCustomerComplaints(data: any, response: ActionResponse): string {
    const complaints = Array.isArray(data) ? data : [];
    
    if (complaints.length === 0) {
      return '✅ *Nenhuma reclamação pendente.*';
    }

    let msg = `⚠️ *RECLAMAÇÕES (${complaints.length})*\n\n`;
    complaints.slice(0, 5).forEach((c: any) => {
      msg += `• *Cliente:* ${c.customer_name}\n`;
      msg += `  📝 ${c.description}\n`;
      msg += `  📅 ${this.formatDate(c.created_at)}\n\n`;
    });

    return msg;
  }

  private static formatChurnedCustomers(data: any, response: ActionResponse): string {
    const customers = Array.isArray(data) ? data : [];
    
    if (customers.length === 0) {
      return '✅ *Nenhum cliente com churn identificado.*';
    }

    let msg = `⚠️ *CLIENTES COM RISCO DE CHURN (${customers.length})*\n\n`;
    customers.slice(0, 5).forEach((c: any) => {
      msg += `• *${c.name}*\n`;
      msg += `  Últ. compra: ${this.formatDate(c.last_purchase)}\n`;
      msg += `  Risco: ${c.risk_level || 'Médio'}\n\n`;
    });

    return msg;
  }

  private static formatLoyalCustomers(data: any, response: ActionResponse): string {
    const customers = Array.isArray(data) ? data : [];
    
    if (customers.length === 0) {
      return '📭 Nenhum cliente fiel encontrado.';
    }

    let msg = `⭐ *CLIENTES FIEIS (${customers.length})*\n\n`;
    customers.slice(0, 5).forEach((c: any) => {
      msg += `• *${c.name}*\n`;
      msg += `  Compras: ${c.total_orders}\n`;
      msg += `  Gasto: R$ ${this.formatMoney(c.total_spent)}\n\n`;
    });

    return msg;
  }

  private static formatPromotions(data: any, response: ActionResponse): string {
    const promotions = Array.isArray(data) ? data : [];
    
    if (promotions.length === 0) {
      return '📭 *Nenhuma promoção ativa no momento.*';
    }

    let msg = `🎉 *PROMOÇÕES ATIVAS (${promotions.length})*\n\n`;
    promotions.slice(0, 5).forEach((p: any) => {
      msg += `• *${p.name || p.title}*\n`;
      if (p.discount) msg += `  Desconto: ${p.discount}%\n`;
      if (p.end_date) msg += `  Até: ${this.formatDate(p.end_date)}\n\n`;
    });

    return msg;
  }

  private static formatDynamicPricing(data: any, response: ActionResponse): string {
    const items = Array.isArray(data) ? data : [];
    
    if (items.length === 0) {
      return '📭 Sem sugestões de preço no momento.';
    }

    let msg = '⚡ *PRECIFICAÇÃO DINÂMICA*\n\n';
    items.slice(0, 5).forEach((p: any) => {
      msg += `• *${p.product_name}*\n`;
      msg += `  Atual: R$ ${this.formatMoney(p.current_price)}\n`;
      msg += `  Sugestão: R$ ${this.formatMoney(p.suggested_price)}\n`;
      msg += `  Motivo: ${p.reason}\n\n`;
    });

    return msg;
  }

  private static formatDiscountCheck(response: ActionResponse): string {
    const eligible = response.data?.eligible || response.metadata?.eligible;
    
    if (eligible) {
      return `✅ *ELEGÍVEL PARA DESCONTO*\n\n` +
             `${response.message || 'Você tem direito a desconto nesta compra.'}`;
    }
    
    return `❌ *NÃO ELEGÍVEL*\n\n` +
           `${response.message || 'Este pedido não atende aos critérios para desconto.'}`;
  }

  private static formatCart(data: any, response: ActionResponse): string {
    if (!data) return response.message || '🛒 Carrinho não encontrado.';

    const cart = Array.isArray(data) ? data[0] : data;
    const items = cart.items || [];

    let msg = '🛒 *CARRINHO*\n\n';
    msg += `🆔 *ID:* #${cart.id?.split('-')[0]}\n`;
    msg += `📊 *Status:* ${this.formatStatus(cart.status)}\n`;
    msg += `💰 *Total: R$ ${this.formatMoney(cart.total || cart.total_amount)}*\n\n`;

    if (items.length > 0) {
      msg += '*Itens:*\n';
      items.forEach((item: any) => {
        msg += `• ${item.quantity}x ${item.product_name}\n`;
      });
    }

    return msg;
  }

  private static formatAbandonedCarts(data: any, response: ActionResponse): string {
    const carts = Array.isArray(data) ? data : [];
    
    if (carts.length === 0) {
      return '✅ *Nenhum carrinho abandonado.*';
    }

    let msg = `🛒 *CARRINHOS ABANDONADOS (${carts.length})*\n\n`;
    carts.slice(0, 5).forEach((c: any) => {
      msg += `• *#${c.id?.split('-')[0]}*\n`;
      msg += `  Cliente: ${c.customer_name || 'Não identificado'}\n`;
      msg += `  Valor: R$ ${this.formatMoney(c.total || c.total_amount)}\n`;
      msg += `  Abandonado em: ${this.formatDate(c.updated_at)}\n\n`;
    });

    return msg;
  }

  private static formatMetrics(data: any, response: ActionResponse): string {
    if (!data) return response.message || '📭 Sem métricas disponíveis.';

    let msg = '📊 *MÉTRICAS*\n\n';
    
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      if (typeof value === 'number') {
        msg += `• ${label}: *${value.toFixed(2)}*\n`;
      } else if (typeof value === 'string') {
        msg += `• ${label}: *${value}*\n`;
      }
    });

    return msg;
  }

  private static formatFilteredResults(response: ActionResponse): string {
    const filterParams = response.metadata?.filter_params || {};
    const filterLabel = filterParams.sort_by === 'total_purchased' 
      ? 'Volume de Compras' 
      : (filterParams.sort_by || 'Padrão');
    
    const limit = filterParams.limit || 10;
    
    let msg = `🎯 *FILTRADO (Top ${limit} por ${filterLabel})*\n\n`;
    
    // Tenta formatar os dados internos
    if (response.data) {
      msg += this.formatGeneric({ ...response, intent: response.metadata?.original_intent || 'unknown' });
    }
    
    return msg;
  }

  private static formatCampaigns(data: any, response: ActionResponse): string {
    const campaigns = Array.isArray(data) ? data : [];
    
    if (campaigns.length === 0) {
      return '📭 *Nenhuma campanha encontrada.*';
    }

    let msg = `📢 *CAMPANHAS (${campaigns.length})*\n\n`;
    campaigns.slice(0, 5).forEach((c: any) => {
      msg += `• *${c.name}*\n`;
      msg += `  Status: ${this.formatStatus(c.status)}\n`;
      if (c.start_date) msg += `  Início: ${this.formatDate(c.start_date)}\n`;
      if (c.end_date) msg += `  Fim: ${this.formatDate(c.end_date)}\n\n`;
    });

    return msg;
  }

  private static formatCampaignStats(data: any, response: ActionResponse): string {
    if (!data) return response.message || '📭 Sem estatísticas da campanha.';

    let msg = '📊 *ESTATÍSTICAS DA CAMPANHA*\n\n';
    msg += `• Nome: *${data.name}*\n`;
    
    if (data.sent !== undefined) msg += `• Enviados: *${data.sent}*\n`;
    if (data.delivered !== undefined) msg += `• Entregues: *${data.delivered}*\n`;
    if (data.opened !== undefined) msg += `• Abertos: *${data.opened}*\n`;
    if (data.clicked !== undefined) msg += `• Cliques: *${data.clicked}*\n`;
    if (data.converted !== undefined) msg += `• Conversões: *${data.converted}*\n`;
    
    if (data.roi) msg += `• ROI: *${data.roi}%*\n`;

    return msg;
  }

  private static formatFidelityPoints(data: any, response: ActionResponse): string {
    if (!data) return response.message || '📭 Sem dados de fidelidade.';

    const account = Array.isArray(data) ? data[0] : data;
    
    let msg = '⭐ *FIDELIDADE*\n\n';
    msg += `• Pontos disponíveis: *${account.points || account.balance || 0}*\n`;
    
    if (account.tier) {
      msg += `• Nível: *${account.tier}*\n`;
    }
    if (account.next_reward) {
      msg += `• Próxima recompensa: ${account.next_reward}\n`;
    }

    return msg;
  }

  private static formatFidelityHistory(data: any, response: ActionResponse): string {
    const transactions = Array.isArray(data) ? data : [];
    
    if (transactions.length === 0) {
      return '📭 *Nenhuma transação de fidelidade.*';
    }

    let msg = '⭐ *HISTÓRICO DE FIDELIDADE*\n\n';
    transactions.slice(0, 10).forEach((t: any) => {
      const icon = t.type === 'credit' ? '➕' : '➖';
      msg += `${icon} *${t.description}*\n`;
      msg += `  Pontos: ${t.points > 0 ? '+' : ''}${t.points}\n`;
      msg += `  Data: ${this.formatDate(t.created_at)}\n\n`;
    });

    return msg;
  }

  private static formatPrescriptionCheck(response: ActionResponse): string {
    const valid = response.data?.valid || response.metadata?.valid;
    
    if (valid) {
      return `✅ *RECEITA VÁLIDA*\n\n` +
             `${response.message || 'Receita verificada e aprovada.'}`;
    }
    
    return `❌ *RECEITA INVÁLIDA*\n\n` +
           `${response.error || response.message || 'Receita não atende aos requisitos.'}`;
  }

  private static formatDrugInteraction(response: ActionResponse): string {
    const interactions = response.data?.interactions || [];
    
    if (interactions.length === 0) {
      return `✅ *SEM INTERAÇÕES*\n\n` +
             `${response.message || 'Nenhuma interação medicamentosa detectada.'}`;
    }

    let msg = '⚠️ *INTERAÇÕES MEDICAMENTOSAS*\n\n';
    interactions.forEach((i: any) => {
      msg += `• *${i.drug1}* + *${i.drug2}*\n`;
      msg += `  Severidade: ${i.severity}\n`;
      msg += `  ${i.description}\n\n`;
    });

    return msg;
  }

  private static readonly dictionary: Record<string, string> = {
    'date': 'Data',
    'revenue': 'Faturamento',
    'order_count': 'Total de Pedidos',
    'average_ticket': 'Ticket Médio',
    'today': 'Hoje',
    'yesterday': 'Ontem',
    'comparison': 'Comparação',
    'difference': 'Diferença',
    'percentage_change': 'Variação (%)',
    'trend': 'Tendência',
    'status': 'Status',
    'business_id': 'ID do Negócio',
    'target': 'Meta',
    'projection': 'Projeção',
    'products': 'Produtos',
    'qty': 'Quantidade',
    'price': 'Preço',
    'amount': 'Valor',
    'customer': 'Cliente',
    'supplier': 'Fornecedor',
    'items': 'Itens',
    'current_value': 'Valor Atual',
    'previous_value': 'Valor Anterior',
    'total_cost': 'Custo Total',
    'cost': 'Custo'
  };

  private static translateKey(key: string): string {
    if (!key) return '';
    const lowerKey = key.toLowerCase();
    if (this.dictionary[lowerKey]) return this.dictionary[lowerKey];
    return this.capitalize(key);
  }

  private static formatObjectContent(data: any, indentLevel: number = 0): string {
    let msg = '';
    const indent = '  '.repeat(indentLevel);
    
    if (Array.isArray(data)) {
        if (data.length === 0) return '';
        data.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
                msg += `${indent}🔸 *Item ${index + 1}:*\n`;
                msg += this.formatObjectContent(item, indentLevel + 1);
            } else {
                msg += `${indent}• ${item}\n`;
            }
        });
        return msg;
    }

    if (typeof data !== 'object' || data === null) {
        return `${indent}${data}\n`;
    }

    const keys = Object.keys(data).filter(k => 
        !['success', 'intent', 'id', 'created_at', 'updated_at', 'business_id'].includes(k)
    );
    
    if (keys.length === 0) {
        return indentLevel === 0 ? '```\n' + JSON.stringify(data, null, 2) + '\n```' : '';
    }

    keys.forEach(key => {
        const val = data[key];
        const translatedKey = this.translateKey(key);
        
        if (val === null || val === undefined) {
            msg += `${indent}• ${translatedKey}: *N/A*\n`;
        } else if (typeof val === 'object' && !Array.isArray(val)) {
            msg += `${indent}📁 *${translatedKey}:*\n`;
            msg += this.formatObjectContent(val, indentLevel + 1);
        } else if (Array.isArray(val)) {
            msg += `${indent}📋 *${translatedKey}:*\n`;
            msg += this.formatObjectContent(val, indentLevel + 1);
        } else {
            let displayVal = val;
            if (typeof val === 'number') {
                if (key.includes('revenue') || key.includes('price') || key.includes('amount') || key.includes('ticket') || key.includes('difference') || key.includes('cost') || key.includes('total')) {
                    displayVal = 'R$ ' + this.formatMoney(val);
                } else if (key === 'percentage_change') {
                    displayVal = val.toFixed(2) + '%';
                }
            }
            msg += `${indent}• ${translatedKey}: *${displayVal}*\n`;
        }
    });
    
    return msg;
  }

  private static formatGeneric(response: ActionResponse): string {
    const { data, message } = response;

    if (!data && message) {
      return message;
    }

    if (!data) {
      return 'ℹ️ *INFORMAÇÃO*\n\nOperação realizada com sucesso.';
    }

    if (typeof data === 'string') {
      return data;
    }

    let msg = 'ℹ️ *RESULTADO*\n\n';
    if (message) msg += `${message}\n\n`;

    msg += this.formatObjectContent(data);

    return msg.trim();
  }

  // ==================== UTILITÁRIOS ====================

  private static formatMoney(val: number | string): string {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return (num || 0).toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }

  private static formatDate(dateStr: string | Date): string {
    if (!dateStr) return 'N/A';
    
    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      if (isNaN(date.getTime())) return String(dateStr);
      
      return date.toLocaleDateString('pt-BR') + ' ' + 
             date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return String(dateStr);
    }
  }

  private static formatStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendente',
      pending_payment: 'Aguardando pagamento',
      confirmed: 'Confirmado',
      processing: 'Processando',
      shipped: 'Enviado',
      enviado: 'Enviado',
      em_transito: 'Em trânsito',
      'em transito': 'Em trânsito',
      delivered: 'Entregue',
      entregue: 'Entregue',
      cancelled: 'Cancelado',
      canceled: 'Cancelado',
      refunded: 'Reembolsado',
      active: 'Ativo',
      inactive: 'Inativo',
      draft: 'Rascunho',
      archived: 'Arquivado',
      completed: 'Concluído'
    };
    
    if (!status) return 'N/A';
    return map[status.toLowerCase()] || status;
  }

  private static capitalize(s: string): string {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
  }
}
