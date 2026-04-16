import { redirect } from 'next/navigation'

// Backward-compat redirect — "Influenceur" renamed to "Ambassadeur" per V7.
export default function InfluenceurRedirect() {
  redirect('/ambassadeur')
}
