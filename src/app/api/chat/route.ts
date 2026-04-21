import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { streamClaude, getSystemPrompt } from '@/lib/claude'
import { PLAN_LIMITS, SUPER_ADMIN_EMAIL } from '@/lib/constants'
import { LAW_CONTEXT, isDroitsQuery } from '@/lib/legifrance'

export const runtime = 'nodejs'
export const maxDuration = 120

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

    const body = (await req.json()) as { messages: ChatMessage[]; conversationId?: string }
    const { messages, conversationId } = body
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages requis' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: profile } = await service
      .from('profiles')
      .select('plan, daily_ai_messages, email')
      .eq('id', user.id)
      .single()

    const plan: 'free' | 'premium' = profile?.plan === 'premium' ? 'premium' : 'free'
    const isSuperAdmin = profile?.email === SUPER_ADMIN_EMAIL

    const limit = PLAN_LIMITS[plan].daily_ai_messages
    const used = profile?.daily_ai_messages ?? 0
    if (!isSuperAdmin && limit !== -1 && used >= limit) {
      return NextResponse.json(
        { error: `Tu as atteint ta limite quotidienne (${limit} messages). Passe à VIDA Premium pour des conversations illimitées.`, limit, used },
        { status: 429 }
      )
    }

    let currentConvId = conversationId
    if (!currentConvId) {
      const firstMsg = messages.find(m => m.role === 'user')?.content ?? 'Nouvelle conversation'
      const { data: newConv } = await service
        .from('conversations')
        .insert({ user_id: user.id, title: firstMsg.slice(0, 60), context: 'general' })
        .select('id')
        .single()
      currentConvId = newConv?.id ?? undefined
    }

    const lastUserMsg = messages[messages.length - 1]
    if (lastUserMsg?.role === 'user' && currentConvId) {
      await service.from('messages').insert({
        conversation_id: currentConvId,
        role: 'user',
        content: lastUserMsg.content,
      })
    }

    if (!isSuperAdmin) {
      await service
        .from('profiles')
        .update({ daily_ai_messages: used + 1 })
        .eq('id', user.id)
    }

    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (currentConvId) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ conversationId: currentConvId })}\n\n`))
          }
          const lastMsg = messages[messages.length - 1]?.content ?? ''
          const context = isDroitsQuery(lastMsg) ? { articles: [LAW_CONTEXT] } : undefined
          for await (const chunk of streamClaude(messages, plan, getSystemPrompt(context), context)) {
            fullResponse += chunk
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
          }
          if (currentConvId && fullResponse) {
            await service.from('messages').insert({
              conversation_id: currentConvId,
              role: 'assistant',
              content: fullResponse,
            })
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
