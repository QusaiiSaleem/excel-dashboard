'use client'

import { useState, useEffect } from 'react'
import { bankGuaranteeService, type BankGuarantee } from '@/lib/supabase/database'

export function useBankGuarantees() {
  const [guarantees, setGuarantees] = useState<BankGuarantee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let channel: ReturnType<typeof bankGuaranteeService.subscribeToChanges>

    const fetchGuarantees = async () => {
      try {
        setLoading(true)
        const data = await bankGuaranteeService.getAll()
        setGuarantees(data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch guarantees')
      } finally {
        setLoading(false)
      }
    }

    const setupRealtimeSubscription = () => {
      channel = bankGuaranteeService.subscribeToChanges((payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload

        setGuarantees((current) => {
          switch (eventType) {
            case 'INSERT':
              return newRecord ? [newRecord, ...current] : current
            
            case 'UPDATE':
              return newRecord ? current.map((item) =>
                item.id === newRecord.id ? newRecord : item
              ) : current
            
            case 'DELETE':
              return oldRecord ? current.filter((item) => item.id !== oldRecord.id) : current
            
            default:
              return current
          }
        })
      })
    }

    fetchGuarantees()
    setupRealtimeSubscription()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [])

  const refresh = async () => {
    try {
      setLoading(true)
      const data = await bankGuaranteeService.getAll()
      setGuarantees(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh guarantees')
    } finally {
      setLoading(false)
    }
  }

  return {
    guarantees,
    loading,
    error,
    refresh
  }
}