'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import { ONBOARDING_QUESTIONS } from '@/lib/constants'

type Answers = {
  objective?: string
  interest?: string
  rhythm?: string
}

export default function OnboardingPage() {
  const { user, loading: authLoading, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [submitting, setSubmitting] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (profile?.onboarding_completed) router.push('/dashboard')
  }, [authLoading, user, profile, router])

  const questions = ONBOARDING_QUESTIONS
  const totalSteps = questions.length + 2 // 3 questions + plan generation + welcome
  const progress = ((step + 1) / totalSteps) * 100

  async function handleAnswer(questionId: string, optionId: string) {
    const next = { ...answers, [questionId]: optionId }
    setAnswers(next)
    if (step + 1 < questions.length) {
      setStep(step + 1)
    } else {
      // Generate the plan
      setStep(questions.length)
      await generatePlan(next)
    }
  }

  async function generatePlan(finalAnswers: Answers) {
    if (!user) return
    setGenerating(true)
    try {
      // Save answers to profile
      await supabase
        .from('profiles')
        .update({
          onboarding_objective: finalAnswers.objective,
          onboarding_interest: finalAnswers.interest,
          onboarding_rhythm: finalAnswers.rhythm,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      // Compose personalized plan text (local, not AI call to save latency)
      const objMap: Record<string, string> = {
        calm: 'retrouver du calme',
        energy: 'augmenter ton énergie',
        sleep: 'mieux dormir',
        impact: 'contribuer au monde',
        focus: 'te concentrer',
        heal: 'te soigner naturellement',
      }
      const intMap: Record<string, string> = {
        health: 'santé holistique',
        ecology: 'écologie & planète',
        community: 'communauté & entraide',
        mind: 'esprit & conscience',
        body: 'corps & mouvement',
        nature: 'nature & ancrage',
      }
      const rhMap: Record<string, string> = {
        slow: 'doux et lent',
        balanced: 'équilibré',
        dynamic: 'dynamique',
        intuitive: 'intuitif, sans pression',
      }

      const objective = objMap[finalAnswers.objective ?? ''] ?? 'avancer'
      const interest = intMap[finalAnswers.interest ?? ''] ?? 'ton bien-être'
      const rhythm = rhMap[finalAnswers.rhythm ?? ''] ?? 'adapté'

      setPlan(
        `Tu veux ${objective}, avec un angle ${interest}, à un rythme ${rhythm}. Je te propose 1 micro-action par jour (2 minutes), et tu pourras monter progressivement. Rien de forcé. Tu es déjà en chemin.`
      )
    } catch {
      toast.error("Je n'ai pas pu sauvegarder. On recommence ?")
      setStep(0)
    } finally {
      setGenerating(false)
    }
  }

  async function handleFinish() {
    if (!user) return
    setSubmitting(true)
    try {
      // Add first life thread entry
      await supabase.from('life_thread_entries').insert({
        user_id: user.id,
        action_type: 'achievement',
        title: 'Début du chemin',
        description: "Tu viens de rejoindre VIDA. Une graine est plantée.",
        icon: '🌱',
        xp_earned: 100,
      })
      // +100 xp
      await supabase
        .from('profiles')
        .update({ vida_xp: (profile?.vida_xp ?? 0) + 100, intro_seen: true })
        .eq('id', user.id)
      router.push('/dashboard')
    } catch {
      toast.error('Retry in a second')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--emerald)]" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Progress bar */}
      <div className="absolute left-0 right-0 top-0 h-1 bg-[var(--border)]">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--emerald)] to-[#84cc16]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="w-full max-w-xl">
        <AnimatePresence mode="wait">
          {step < questions.length && (
            <motion.div
              key={`q-${step}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="vida-chip mx-auto mb-4">
                  <Leaf className="h-3.5 w-3.5" />
                  Étape {step + 1} sur 3
                </div>
                <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  {questions[step].question}
                </h1>
                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  Tap sur ce qui résonne. Il n&apos;y a pas de mauvaise réponse.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {questions[step].options.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(questions[step].id, option.id)}
                    className="glass-card group flex items-center gap-4 p-5 text-left transition"
                  >
                    <span className="text-3xl">{option.emoji}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--emerald)]">
                      {option.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === questions.length && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8 text-center"
            >
              {generating ? (
                <>
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-[var(--emerald)]" />
                  <p className="text-lg text-[var(--text-secondary)]">
                    Je compose ton chemin VIDA…
                  </p>
                </>
              ) : (
                <>
                  <div className="vida-chip mx-auto">
                    <Sparkles className="h-3.5 w-3.5" /> Plan personnalisé
                  </div>
                  <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
                    Voici ton chemin VIDA
                  </h1>
                  <p className="mx-auto max-w-lg text-lg text-[var(--text-secondary)]">
                    {plan}
                  </p>
                  <div className="glass-card mx-auto max-w-md p-6">
                    <div className="mb-2 text-xs uppercase tracking-wider text-[var(--text-muted)]">
                      Ton premier impact est déjà lancé
                    </div>
                    <div className="flex items-center justify-center gap-3 text-2xl">
                      🌱 +1 graine plantée · +100 XP
                    </div>
                  </div>
                  <Button onClick={handleFinish} disabled={submitting} className="btn-gradient">
                    {submitting ? 'Chargement…' : 'Entrer dans VIDA'}
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
