// VIDA commerce types — produits, commandes, dons

export interface Product {
  id: string
  slug: string
  name: string
  description: string | null
  long_description: string | null
  image_urls: string[] | null
  price_cents: number
  subscriber_discount_percent: number
  cashback_points: number
  stock: number
  category: string | null
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  user_id: string | null
  items_json: Array<{ product_id: string; quantity: number; price_cents: number }>
  subtotal_cents: number
  discount_cents: number
  total_cents: number
  cashback_points: number
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'canceled'
  shipping_address: Record<string, unknown> | null
  stripe_payment_intent: string | null
  created_at: string
}

export interface Donation {
  id: string
  user_id: string | null
  amount_cents: number
  destination: 'association_vida' | 'ecology' | 'social'
  stripe_payment_intent: string | null
  rewards_json: Record<string, unknown>
  contest_tickets_earned: number
  points_earned: number
  message: string | null
  anonymous: boolean
  status: 'pending' | 'succeeded' | 'failed'
  created_at: string
}
