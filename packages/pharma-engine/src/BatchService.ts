/**
 * BatchService - Gerenciamento de Lotes com Lógica FEFO
 * (First Expired, First Out)
 */

import { supabase } from '@/config/supabase';
import { createLogger } from '@/services/logger';

const logger = createLogger('BatchService');

export interface Batch {
  id?: string;
  product_id: string;
  location_id?: string;
  batch_number: string;
  supplier_id?: string;
  manufacturing_date: string;
  expiration_date: string;
  receipt_date?: string;
  initial_quantity: number;
  current_quantity: number;
  reserved_quantity?: number;
  available_quantity?: number;
  status?: 'active' | 'depleted' | 'expired' | 'quarantined' | 'recalled';
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface BatchAllocation {
  batch_id: string;
  batch_number: string;
  expiration_date: string;
  available_quantity: number;
  quantity_to_pick: number;
}

export interface RegisterBatchInput {
  product_id: string;
  location_id?: string;
  batch_number: string;
  supplier_id?: string;
  manufacturing_date: string;
  expiration_date: string;
  initial_quantity: number;
  metadata?: Record<string, any>;
}

export interface WithdrawalResult {
  success: boolean;
  allocations: BatchAllocation[];
  total_withdrawn: number;
  message?: string;
}

export class BatchService {
  /**
   * Registrar novo lote no sistema
   */
  async registerBatch(data: RegisterBatchInput): Promise<Batch> {
    logger.info('Registering new batch', { batch_number: data.batch_number });

    const { data: batch, error } = await supabase
      .from('pharma_stock_batches')
      .insert({
        product_id: data.product_id,
        location_id: data.location_id,
        batch_number: data.batch_number,
        supplier_id: data.supplier_id,
        manufacturing_date: data.manufacturing_date,
        expiration_date: data.expiration_date,
        initial_quantity: data.initial_quantity,
        current_quantity: data.initial_quantity,
        metadata: data.metadata || {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Error registering batch', { error });
      throw new Error(`Failed to register batch: ${error.message}`);
    }

    logger.info('Batch registered successfully', { batch_id: batch.id });
    return batch;
  }

  /**
   * Obter alocação FEFO para uma quantidade solicitada
   */
  async getBatchesForPicking(
    productId: string,
    locationId: string | null,
    quantity: number
  ): Promise<BatchAllocation[]> {
    logger.info('Getting FEFO batch allocation', { productId, locationId, quantity });

    const { data, error } = await supabase.rpc('get_batches_fefo', {
      p_product_id: productId,
      p_location_id: locationId,
      p_required_quantity: quantity,
    });

    if (error) {
      logger.error('Error getting FEFO allocation', { error });
      throw new Error(`Failed to get batch allocation: ${error.message}`);
    }

    // Mapear retorno out_ para BatchAllocation
    return (data || []).map((item: any) => ({
      batch_id: item.out_batch_id,
      batch_number: item.out_batch_number,
      expiration_date: item.out_expiration_date,
      available_quantity: item.out_available_quantity,
      quantity_to_pick: item.out_quantity_to_pick,
    }));
  }

  /**
   * Processar saída FEFO (venda, transferência, etc)
   */
  async processFEFOWithdrawal(
    productId: string,
    locationId: string | null,
    quantity: number
  ): Promise<WithdrawalResult> {
    logger.info('Processing FEFO withdrawal', { productId, locationId, quantity });

    // 1. Obter alocação FEFO
    const allocations = await this.getBatchesForPicking(productId, locationId, quantity);

    if (allocations.length === 0) {
      return {
        success: false,
        allocations: [],
        total_withdrawn: 0,
        message: 'No batches available for withdrawal',
      };
    }

    // 2. Calcular total disponível
    const totalAvailable = allocations.reduce(
      (sum, alloc) => sum + alloc.quantity_to_pick,
      0
    );

    if (totalAvailable < quantity) {
      return {
        success: false,
        allocations,
        total_withdrawn: 0,
        message: `Insufficient quantity. Required: ${quantity}, Available: ${totalAvailable}`,
      };
    }

    // 3. Processar retiradas de cada lote
    for (const allocation of allocations) {
      await this.withdrawFromBatch(
        allocation.batch_id,
        allocation.quantity_to_pick
      );
    }

    return {
      success: true,
      allocations,
      total_withdrawn: totalAvailable,
    };
  }

  /**
   * Retirar quantidade de um lote específico
   */
  async withdrawFromBatch(batchId: string, quantity: number): Promise<void> {
    logger.info('Withdrawing from batch', { batchId, quantity });

    const { data: batch, error: fetchError } = await supabase
      .from('pharma_stock_batches')
      .select('current_quantity')
      .eq('id', batchId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch batch: ${fetchError.message}`);
    }

    const newQuantity = batch.current_quantity - quantity;

    if (newQuantity < 0) {
      throw new Error(`Insufficient quantity in batch ${batchId}`);
    }

    const { error: updateError } = await supabase
      .from('pharma_stock_batches')
      .update({
        current_quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    if (updateError) {
      logger.error('Error updating batch quantity', { error: updateError });
      throw new Error(`Failed to update batch: ${updateError.message}`);
    }
  }

  /**
   * Listar lotes próximos do vencimento
   */
  async getExpiringBatches(daysUntilExpiration: number = 30): Promise<any[]> {
    logger.info('Getting expiring batches', { daysUntilExpiration });

    const { data, error } = await supabase.rpc('get_expiring_batches', {
      days_threshold: daysUntilExpiration,
    });

    if (error) {
      logger.error('Error getting expiring batches', { error });
      throw new Error(`Failed to get expiring batches: ${error.message}`);
    }

    // Mapear retorno out_ para objetos Batch legíveis
    return (data || []).map((item: any) => ({
      batch_id: item.out_batch_id,
      product_id: item.out_product_id,
      product_name: item.out_product_name,
      batch_number: item.out_batch_number,
      expiration_date: item.out_expiration_date,
      days_until_expiration: item.out_days_until_expiration,
      current_quantity: item.out_current_quantity,
      location_id: item.out_location_id,
    }));
  }

  /**
   * Marcar lote como vencido
   */
  async markBatchAsExpired(batchId: string): Promise<void> {
    logger.info('Marking batch as expired', { batchId });

    const { error } = await supabase
      .from('pharma_stock_batches')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    if (error) {
      logger.error('Error marking batch as expired', { error });
      throw new Error(`Failed to mark batch as expired: ${error.message}`);
    }
  }

  /**
   * Obter detalhes de um lote
   */
  async getBatchById(batchId: string): Promise<Batch | null> {
    const { data, error } = await supabase
      .from('pharma_stock_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get batch: ${error.message}`);
    }

    return data;
  }

  /**
   * Listar todos os lotes de um produto
   */
  async getBatchesByProduct(
    productId: string,
    locationId?: string,
    status: string = 'active'
  ): Promise<Batch[]> {
    let query = supabase
      .from('pharma_stock_batches')
      .select('*')
      .eq('product_id', productId)
      .eq('status', status)
      .order('expiration_date', { ascending: true });

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error listing batches', { error });
      throw new Error(`Failed to list batches: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Atualizar status de um lote
   */
  async updateBatchStatus(
    batchId: string,
    status: 'active' | 'depleted' | 'expired' | 'quarantined' | 'recalled'
  ): Promise<void> {
    logger.info('Updating batch status', { batchId, status });

    const { error } = await supabase
      .from('pharma_stock_batches')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    if (error) {
      logger.error('Error updating batch status', { error });
      throw new Error(`Failed to update batch status: ${error.message}`);
    }
  }
}

export const batchService = new BatchService();
