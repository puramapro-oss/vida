// VIDA support types — FAQ, contact

export interface FaqArticle {
  id: string
  category: string
  question: string
  answer: string
  search_keywords: string[] | null
  view_count: number
  helpful_count: number
  display_order: number
  created_at: string
}

export interface ContactMessage {
  name: string
  email: string
  subject: string
  message: string
}
