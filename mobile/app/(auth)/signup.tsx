import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { Link, router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { supabase } from '../../src/lib/supabase'

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignup() {
    setError(null)
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password || !fullName) {
      setError('Tous les champs sont requis.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setLoading(true)
    const { error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: fullName.trim() } },
    })
    setLoading(false)
    if (authError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setError(mapError(authError.message))
      return
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.replace('/(tabs)')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-void"
    >
      <LinearGradient
        colors={['rgba(16,185,129,0.15)', 'transparent']}
        className="absolute inset-x-0 top-0 h-80"
        pointerEvents="none"
      />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-10">
          <Text className="text-5xl font-bold text-emerald mb-2" testID="signup-title">
            VIDA
          </Text>
          <Text className="text-text-secondary text-base">Rejoins le mouvement</Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="text-text-muted text-xs mb-2 uppercase tracking-wider">Prénom</Text>
            <TextInput
              testID="signup-name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoComplete="name"
              placeholder="Alice"
              placeholderTextColor="rgba(240,253,244,0.35)"
              className="bg-white/5 border border-border rounded-2xl px-4 py-4 text-text-primary text-base"
              editable={!loading}
            />
          </View>

          <View>
            <Text className="text-text-muted text-xs mb-2 uppercase tracking-wider">Email</Text>
            <TextInput
              testID="signup-email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="toi@exemple.fr"
              placeholderTextColor="rgba(240,253,244,0.35)"
              className="bg-white/5 border border-border rounded-2xl px-4 py-4 text-text-primary text-base"
              editable={!loading}
            />
          </View>

          <View>
            <Text className="text-text-muted text-xs mb-2 uppercase tracking-wider">
              Mot de passe
            </Text>
            <TextInput
              testID="signup-password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              placeholderTextColor="rgba(240,253,244,0.35)"
              className="bg-white/5 border border-border rounded-2xl px-4 py-4 text-text-primary text-base"
              editable={!loading}
            />
          </View>

          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          <Pressable
            testID="signup-submit"
            onPress={handleSignup}
            disabled={loading}
            className="bg-emerald rounded-2xl py-4 items-center mt-2 active:opacity-80"
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Créer mon compte</Text>
            )}
          </Pressable>

          <View className="flex-row justify-center mt-4">
            <Text className="text-text-muted text-sm">Déjà inscrit·e ? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-emerald text-sm font-medium">Se connecter</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function mapError(msg: string): string {
  if (msg.includes('already registered')) return 'Cet email est déjà inscrit. Connecte-toi.'
  if (msg.includes('rate limit')) return 'Trop de tentatives. Réessaie dans quelques minutes.'
  if (msg.includes('Password should be')) return 'Mot de passe trop faible (8 caractères min).'
  return 'Inscription impossible. Vérifie ta connexion et réessaie.'
}
