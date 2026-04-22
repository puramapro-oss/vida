import { useEffect, useState } from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../src/hooks/useAuth'

interface Profile {
  wallet_balance: number | null
  purama_points: number | null
  tier: string | null
}

export default function WalletScreen() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('wallet_balance, purama_points, tier')
      .eq('id', user.id)
      .maybeSingle<Profile>()
    if (data) setProfile(data)
  }

  useEffect(() => {
    load()
  }, [user])

  async function onRefresh() {
    setRefreshing(true)
    await Haptics.selectionAsync()
    await load()
    setRefreshing(false)
  }

  const balance = profile?.wallet_balance ?? 0
  const points = profile?.purama_points ?? 0
  const tier = profile?.tier ?? 'bronze'

  return (
    <SafeAreaView className="flex-1 bg-void">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
      >
        <View className="px-6 pt-4 pb-2">
          <Text className="text-text-primary text-3xl font-bold">Wallet</Text>
        </View>

        {/* Balance card */}
        <View className="px-6 pt-4">
          <View className="rounded-3xl overflow-hidden">
            <LinearGradient
              colors={['rgba(16,185,129,0.25)', 'rgba(132,204,22,0.10)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-6 border border-border"
              style={{ borderRadius: 24 }}
            >
              <Text className="text-text-muted text-xs uppercase tracking-wider">Solde</Text>
              <Text className="text-text-primary text-5xl font-bold mt-2" testID="wallet-balance">
                {balance.toFixed(2)} €
              </Text>
              <Text className="text-text-secondary text-sm mt-2">
                Retrait dès 5€ · IBAN · 48h
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Points */}
        <View className="px-6 mt-4">
          <View className="bg-white/5 border border-border rounded-3xl p-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-text-muted text-xs uppercase tracking-wider">
                  Purama Points
                </Text>
                <Text className="text-text-primary text-2xl font-bold mt-1" testID="wallet-points">
                  {points.toLocaleString('fr-FR')} pts
                </Text>
              </View>
              <View className="bg-emerald/10 border border-emerald/30 rounded-full px-3 py-1">
                <Text className="text-emerald text-xs font-semibold uppercase">{tier}</Text>
              </View>
            </View>
            <Text className="text-text-muted text-xs mt-3">
              1 pt = 0,01 € · Boutique, coupons, tickets, conversion cash
            </Text>
          </View>
        </View>

        {/* Quick info */}
        <View className="px-6 mt-4">
          <View className="bg-white/5 border border-border rounded-2xl p-5">
            <Text className="text-text-primary font-semibold mb-2">Ce que tu peux faire</Text>
            <Text className="text-text-secondary text-sm leading-6">
              • Missions réelles (santé, écologie, bénévolat){'\n'}
              • Parrainage : 50% du 1er abo filleul{'\n'}
              • Classement hebdo · tirage mensuel{'\n'}
              • Retrait IBAN dès 5€ (48h)
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
