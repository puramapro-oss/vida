'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from './useAuth'

interface WalletState {
  balance: number
  totalEarned: number
  loading: boolean
}

export function useWallet() {
  const { user } = useAuth()
  const [state, setState] = useState<WalletState>({ balance: 0, totalEarned: 0, loading: true })
  const supabase = createClient()

  const fetchWallet = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('wallets').select('balance, total_earned').eq('user_id', user.id).single()
    if (data) {
      setState({ balance: Number(data.balance), totalEarned: Number(data.total_earned), loading: false })
    } else {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [user, supabase])

  useEffect(() => {
    fetchWallet()
  }, [fetchWallet])

  return { ...state, refetch: fetchWallet }
}
