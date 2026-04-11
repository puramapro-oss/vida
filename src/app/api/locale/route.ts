import { NextRequest, NextResponse } from 'next/server'
import { locales } from '@/i18n/config'

export async function POST(request: NextRequest) {
  try {
    const { locale } = await request.json()

    if (!locale || !locales.includes(locale)) {
      return NextResponse.json(
        { error: 'Langue non supportee' },
        { status: 400 }
      )
    }

    const response = NextResponse.json({ locale, success: true })
    response.cookies.set('locale', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })

    return response
  } catch {
    return NextResponse.json(
      { error: 'Requete invalide' },
      { status: 400 }
    )
  }
}
