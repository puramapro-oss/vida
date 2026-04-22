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
  Alert,
} from 'react-native'
import { Link, router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { supabase } from '../../src/lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setError(null)
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      setError('Email et mot de passe requis.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      return
    }
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
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
          <Text className="text-5xl font-bold text-emerald mb-2" testID="login-title">
            VIDA
          </Text>
          <Text className="text-text-secondary text-base">Ton écosystème vivant</Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="text-text-muted text-xs mb-2 uppercase tracking-wider">Email</Text>
            <TextInput
              testID="login-email"
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
              testID="login-password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              placeholder="••••••••"
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
            testID="login-submit"
            onPress={handleLogin}
            disabled={loading}
            className="bg-emerald rounded-2xl py-4 items-center mt-2 active:opacity-80"
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Se connecter</Text>
            )}
          </Pressable>

          <View className="flex-row justify-center mt-4">
            <Text className="text-text-muted text-sm">Pas encore de compte ? </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text className="text-emerald text-sm font-medium">S&apos;inscrire</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function mapError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (msg.includes('Email not confirmed')) return 'Confirme ton email avant de te connecter.'
  if (msg.includes('rate limit')) return 'Trop de tentatives. Réessaie dans quelques minutes.'
  return 'Connexion impossible. Vérifie ta connexion internet et réessaie.'
}
