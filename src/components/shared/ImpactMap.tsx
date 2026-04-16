'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { createClient } from '@/lib/supabase'
import 'leaflet/dist/leaflet.css'

interface ImpactPoint {
  id: string
  title: string
  impact_type: string
  location_lat: number
  location_lng: number
  partner_name: string | null
  created_at: string
}

// Fix default marker icon path (Next.js webpack)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

export default function ImpactMap() {
  const [points, setPoints] = useState<ImpactPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('impact_events')
      .select('id, title, impact_type, location_lat, location_lng, partner_name, created_at')
      .not('location_lat', 'is', null)
      .not('location_lng', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data }) => setPoints((data ?? []) as ImpactPoint[]))
      .then(() => setLoading(false))
  }, [])

  return (
    <div className="relative h-[460px] w-full rounded-3xl overflow-hidden border border-white/[0.08]">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#0A0A0F' }}
        worldCopyJump
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
        />
        {points.map(p => (
          <CircleMarker
            key={p.id}
            center={[p.location_lat, p.location_lng]}
            radius={6}
            pathOptions={{
              color: '#10B981',
              fillColor: '#10B981',
              fillOpacity: 0.6,
              weight: 1,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{p.title}</p>
                {p.partner_name && <p className="text-xs opacity-70">{p.partner_name}</p>}
                <p className="text-xs opacity-60 mt-1">
                  {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0F]/70 backdrop-blur-sm text-xs text-[var(--text-muted)]">
          Chargement du vivant…
        </div>
      )}
      {!loading && points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0F]/60 backdrop-blur-sm">
          <p className="text-sm text-[var(--text-muted)] italic px-6 text-center max-w-xs">
            La carte s'allumera dès la première action géolocalisée de la communauté.
          </p>
        </div>
      )}
    </div>
  )
}
