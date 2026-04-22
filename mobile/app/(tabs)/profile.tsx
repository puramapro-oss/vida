import { View, Text, Pressable, ScrollView, Linking, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../../src/hooks/useAuth'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    await Haptics.selectionAsync()
    Alert.alert('Se déconnecter', 'Tu es sûr·e ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'toi'
  const initial = firstName.charAt(0).toUpperCase()

  return (
    <SafeAreaView className="flex-1 bg-void">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View className="px-6 pt-8 pb-6 items-center">
          <View className="w-24 h-24 rounded-full bg-emerald/20 border-2 border-emerald items-center justify-center mb-4">
            <Text className="text-emerald text-4xl font-bold">{initial}</Text>
          </View>
          <Text className="text-text-primary text-2xl font-bold" testID="profile-name">
            {firstName}
          </Text>
          <Text className="text-text-muted text-sm mt-1">{user?.email}</Text>
        </View>

        {/* Menu */}
        <View className="px-4">
          <Row
            label="Tes préférences"
            sub="Notifications, thème, langue"
            testID="profile-settings"
            onPress={() => Alert.alert('Bientôt', 'Tes préférences arrivent')}
          />
          <Row
            label="Santé & HealthKit"
            sub="Connecter / déconnecter"
            testID="profile-health"
            onPress={() => Alert.alert('Santé', 'Configuration HealthKit à venir')}
          />
          <Row
            label="Parrainage"
            sub="Invite tes proches"
            testID="profile-referral"
            onPress={() => Linking.openURL('https://vida.purama.dev/dashboard/referral')}
          />
          <Row
            label="Facturation"
            sub="Abonnement, factures"
            testID="profile-billing"
            onPress={() => Linking.openURL('https://vida.purama.dev/dashboard/settings/abonnement')}
          />
          <Row
            label="Aide"
            sub="FAQ, chatbot, contact"
            testID="profile-help"
            onPress={() => Linking.openURL('https://vida.purama.dev/aide')}
          />
          <Row
            label="Confidentialité"
            sub="Exporter / supprimer mes données"
            testID="profile-privacy"
            onPress={() =>
              Linking.openURL('https://vida.purama.dev/politique-confidentialite')
            }
          />
        </View>

        {/* Logout */}
        <View className="px-4 mt-4">
          <Pressable
            testID="profile-logout"
            onPress={handleSignOut}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl py-4 items-center active:opacity-70"
          >
            <Text className="text-red-400 font-semibold">Se déconnecter</Text>
          </Pressable>
        </View>

        <Text className="text-text-muted text-xs text-center mt-8 px-6">
          VIDA · SASU PURAMA · Frasne 25560{'\n'}
          art. 293B · RGPD strict · hébergement EU
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function Row({
  label,
  sub,
  onPress,
  testID,
}: {
  label: string
  sub: string
  onPress: () => void
  testID?: string
}) {
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        Haptics.selectionAsync()
        onPress()
      }}
      className="bg-white/5 border border-border rounded-2xl px-5 py-4 mb-2 flex-row items-center justify-between active:opacity-70"
    >
      <View className="flex-1">
        <Text className="text-text-primary text-base font-medium">{label}</Text>
        <Text className="text-text-muted text-xs mt-0.5">{sub}</Text>
      </View>
      <Text className="text-text-muted text-xl">›</Text>
    </Pressable>
  )
}
