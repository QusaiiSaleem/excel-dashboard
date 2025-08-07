'use client'

import { useState, useEffect } from 'react'
import { bankGuaranteeService } from '@/lib/supabase/database'

export interface Statistics {
  total: number
  totalValue: number
  activeCount: number
  pendingCount: number
  expiredCount: number
  typeDistribution: Record<string, number>
}

export function useStatistics() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true)
        const stats = await bankGuaranteeService.getStatistics()
        setStatistics(stats)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()

    // Set up interval to refresh statistics every 30 seconds
    const interval = setInterval(fetchStatistics, 30000)

    return () => clearInterval(interval)
  }, [])

  const refresh = async () => {
    try {
      setLoading(true)
      const stats = await bankGuaranteeService.getStatistics()
      setStatistics(stats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh statistics')
    } finally {
      setLoading(false)
    }
  }

  return {
    statistics,
    loading,
    error,
    refresh
  }
}