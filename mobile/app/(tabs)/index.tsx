import { useEffect, useState } from 'react'
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../../src/hooks/useAuth'

interface Impact {
  missions_count: number
  aides_count: number
  faq_count: number
  users_count: number
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const [impact, setImpact] = useState<Impact | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const res = await fetch('https://vida.purama.dev/api/impact/public', {
        cache: 'no-store' as RequestCache,
      })
      if (res.ok) setImpact(await res.json())
    } catch {
      // silent fallback
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onRefresh() {
    setRefreshing(true)
    await Haptics.selectionAsync()
    await load()
    setRefreshing(false)
  }

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'toi'

  return (
    <SafeAreaView className="flex-1 bg-void">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
            colors={['#10B981']}
          />
        }
      >
        <LinearGradient
          colors={['rgba(16,185,129,0.18)', 'transparent']}
          className="absolute inset-x-0 top-0 h-64"
          pointerEvents="none"
        />

        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-text-muted text-sm uppercase tracking-wider">Bonjour</Text>
          <Text className="text-text-primary text-4xl font-bold mt-1" testID="greeting">
            {firstName}
          </Text>
          <Text className="text-text-secondary text-base mt-2">
            Ton écosystème vivant t&apos;attend.
          </Text>
        </View>

        {/* Impact section */}
        <View className="px-6 mb-6">
          <Text className="text-emerald text-xs uppercase tracking-widest mb-3">Ensemble</Text>
          <Text className="text-text-primary text-2xl font-semibold mb-6">
            On construit, pas à pas.
          </Text>

          <View className="flex-row flex-wrap gap-3">
            <StatCard label="missions réelles" value={impact?.missions_count ?? 0} />
            <StatCard label="aides recensées" value={impact?.aides_count ?? 0} />
            <StatCard label="réponses claires" value={impact?.faq_count ?? 0} />
            <StatCard label="graines plantées" value={impact?.users_count ?? 0} />
          </View>
        </View>

        {/* Quick actions */}
        <View className="px-6 mb-8">
          <Text className="text-emerald text-xs uppercase tracking-widest mb-3">Aujourd&apos;hui</Text>

          <View className="gap-3">
            <ActionRow
              emoji="🌬"
              title="Respire avec moi"
              desc="57 secondes — 4-7-8"
              testID="action-breath"
            />
            <ActionRow
              emoji="👣"
              title="Tes pas du jour"
              desc="Connecté à HealthKit / Health Connect"
              testID="action-steps"
            />
            <ActionRow
              emoji="💚"
              title="Journal gratitude"
              desc="3 lignes avant de dormir"
              testID="action-gratitude"
            />
            <ActionRow
              emoji="📝"
              title="Intention du jour"
              desc="Ce que tu veux semer"
              testID="action-intention"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <View
      className="bg-white/5 border border-border rounded-3xl p-4"
      style={{ width: '48%' }}
    >
      <Text className="text-text-primary text-3xl font-bold">
        {value.toLocaleString('fr-FR')}
      </Text>
      <Text className="text-text-muted text-xs uppercase tracking-wider mt-1">{label}</Text>
    </View>
  )
}

function ActionRow({
  emoji,
  title,
  desc,
  testID,
}: {
  emoji: string
  title: string
  desc: string
  testID?: string
}) {
  return (
    <Pressable
      testID={testID}
      onPress={() => Haptics.selectionAsync()}
      className="bg-white/5 border border-border rounded-2xl px-5 py-4 active:opacity-70 flex-row items-center"
    >
      <Text className="text-2xl mr-4">{emoji}</Text>
      <View className="flex-1">
        <Text className="text-text-primary text-base font-medium">{title}</Text>
        <Text className="text-text-muted text-sm mt-0.5">{desc}</Text>
      </View>
    </Pressable>
  )
}
