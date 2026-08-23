'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Leaf, Menu, X } from 'lucide-react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-[100] transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-xl bg-[rgba(3,8,6,0.85)] border-b border-[var(--border)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-[var(--emerald)]" />
            <span className="gradient-text font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
              VIDA
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-secondary)]">
            <a href="#manifeste" className="hover:text-[var(--text-primary)] transition-colors">
              Manifeste
            </a>
            <a href="#piliers" className="hover:text-[var(--text-primary)] transition-colors">
              Piliers
            </a>
            <a href="#comment" className="hover:text-[var(--text-primary)] transition-colors">
              Comment
            </a>
            <Link href="/pricing" className="hover:text-[var(--text-primary)] transition-colors">
              Tarifs
            </Link>
            <Link href="/aide" className="hover:text-[var(--text-primary)] transition-colors">
              Aide
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
            >
              Commencer
            </Link>
          </div>

          <button
            className="md:hidden text-[var(--text-secondary)] p-2"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[rgba(3,8,6,0.95)] backdrop-blur-xl">
          <div className="px-4 py-4 flex flex-col gap-3">
            <a
              href="#manifeste"
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--text-secondary)] py-2"
            >
              Manifeste
            </a>
            <a
              href="#piliers"
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--text-secondary)] py-2"
            >
              Piliers
            </a>
            <a
              href="#comment"
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--text-secondary)] py-2"
            >
              Comment ça marche
            </a>
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="text-sm text-[var(--text-secondary)] py-2"
            >
              Tarifs
            </Link>
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-center text-[var(--text-secondary)]"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="rounded-2xl bg-gradient-to-r from-[var(--emerald)] to-[var(--sage)] px-4 py-2.5 text-sm font-semibold text-white text-center"
              >
                Commencer
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
