import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? 'VIDA'
  const subtitle = searchParams.get('subtitle') ?? '47+ outils IA. 1 abonnement. Des 7€/mois.'

  return new ImageResponse(
    (
      <div
        style={{
          background: '#03040a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '5%',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '100px',
            padding: '8px 20px',
            marginBottom: '32px',
            color: '#10B981',
            fontSize: '16px',
            fontWeight: '600',
          }}
        >
          🌌 Ecosysteme IA tout-en-un
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 20 ? 56 : 72,
            fontWeight: '900',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #10B981 0%, #a855f7 50%, #ff6b9d 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1.1,
            marginBottom: '24px',
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginTop: '48px',
          }}
        >
          {['47+ Outils', 'Des 7€/mois', '100% RGPD', 'Made in France 🇫🇷'].map((stat) => (
            <div
              key={stat}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '10px 20px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              {stat}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
