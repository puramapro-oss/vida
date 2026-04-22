import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { supabase } from '../../src/lib/supabase'

interface Msg {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hey 🌿 Je suis VIDA. Pose-moi une question sur tes droits, tes aides, ta santé, ou juste ce qui se passe en toi aujourd\'hui.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  async function send() {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    await Haptics.selectionAsync()

    const userMsg: Msg = { id: String(Date.now()), role: 'user', content: trimmed }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data: sess } = await supabase.auth.getSession()
      const token = sess.session?.access_token
      const res = await fetch('https://vida.purama.dev/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            id: String(Date.now() + 1),
            role: 'assistant',
            content: "Je n'arrive pas à te répondre à l'instant. Réessaie dans quelques secondes 🌿",
          },
        ])
        return
      }

      const text = await res.text()
      setMessages((m) => [
        ...m,
        { id: String(Date.now() + 1), role: 'assistant', content: text || '…' },
      ])
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: 'Problème de connexion. Vérifie ton réseau et réessaie.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-void">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <View className="px-6 pt-2 pb-3 border-b border-border">
          <Text className="text-text-primary text-2xl font-bold">Chat VIDA</Text>
          <Text className="text-text-muted text-xs mt-0.5">
            Expert droits sociaux · santé · bien-être
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              className={`mb-3 max-w-[88%] rounded-2xl px-4 py-3 ${
                m.role === 'user'
                  ? 'bg-emerald self-end'
                  : 'bg-white/5 border border-border self-start'
              }`}
            >
              <Text
                className={m.role === 'user' ? 'text-white text-base' : 'text-text-primary text-base'}
              >
                {m.content}
              </Text>
            </View>
          ))}
          {loading && (
            <View className="self-start bg-white/5 border border-border rounded-2xl px-4 py-3 mb-3">
              <ActivityIndicator color="#10B981" size="small" />
            </View>
          )}
        </ScrollView>

        <View className="px-4 pb-4 pt-2 border-t border-border bg-void">
          <View className="flex-row items-end gap-2">
            <TextInput
              testID="chat-input"
              value={input}
              onChangeText={setInput}
              placeholder="Pose ta question…"
              placeholderTextColor="rgba(240,253,244,0.35)"
              multiline
              className="flex-1 bg-white/5 border border-border rounded-2xl px-4 py-3 text-text-primary text-base"
              style={{ maxHeight: 120 }}
              editable={!loading}
            />
            <Pressable
              testID="chat-send"
              onPress={send}
              disabled={!input.trim() || loading}
              className="bg-emerald rounded-2xl px-5 py-3 active:opacity-70"
              style={{ opacity: input.trim() && !loading ? 1 : 0.4 }}
            >
              <Text className="text-white font-semibold">Envoyer</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
