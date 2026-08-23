// VIDA chat types — conversations, messages

export interface Conversation {
  id: string
  user_id: string
  title: string | null
  context: 'dashboard' | 'missions' | 'coach' | 'general' | null
  is_favorite: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens_used: number | null
  created_at: string
}
