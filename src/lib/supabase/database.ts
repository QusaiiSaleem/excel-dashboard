import { createClient } from './client'
import type { Database } from './types'

export type BankGuarantee = Database['public']['Tables']['bank_guarantees']['Row']
export type BankGuaranteeInsert = Database['public']['Tables']['bank_guarantees']['Insert']
export type BankGuaranteeUpdate = Database['public']['Tables']['bank_guarantees']['Update']

export class BankGuaranteeService {
  private supabase = createClient()

  private checkConnection() {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Please check environment variables.')
    }
    return this.supabase
  }

  async getAll() {
    const supabase = this.checkConnection()
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async getById(id: string) {
    const supabase = this.checkConnection()
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  async create(guarantee: BankGuaranteeInsert) {
    const supabase = this.checkConnection()
    const { data, error } = await supabase
      .from('bank_guarantees')
      .insert(guarantee)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async update(id: string, guarantee: BankGuaranteeUpdate) {
    const supabase = this.checkConnection()
    const { data, error } = await supabase
      .from('bank_guarantees')
      .update(guarantee)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async delete(id: string) {
    const supabase = this.checkConnection()
    const { error } = await supabase
      .from('bank_guarantees')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  subscribeToChanges(callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: BankGuarantee | null
    old: BankGuarantee | null
  }) => void) {
    const supabase = this.checkConnection()
    return supabase
      .channel('bank_guarantees_changes')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'bank_guarantees'
        },
        callback
      )
      .subscribe()
  }

  async getStatistics() {
    const supabase = this.checkConnection()
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('status, guarantee_type, value')
    
    if (error) throw error

    const stats = {
      total: data.length,
      totalValue: data.reduce((sum, item) => sum + Number(item.value), 0),
      activeCount: data.filter(item => item.status === 'active').length,
      pendingCount: data.filter(item => item.status === 'pending').length,
      expiredCount: data.filter(item => item.status === 'expired').length,
      typeDistribution: data.reduce((acc: Record<string, number>, item) => {
        acc[item.guarantee_type] = (acc[item.guarantee_type] || 0) + 1
        return acc
      }, {})
    }

    return stats
  }
}

export const bankGuaranteeService = new BankGuaranteeService()