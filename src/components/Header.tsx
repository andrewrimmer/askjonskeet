import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getRandomFact } from '../data/skeetFacts'

export default function Header() {
  const [fact, setFact] = useState(getRandomFact)
  const [factKey, setFactKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  useEffect(() => {
    const interval = setInterval(() => {
      setFact(getRandomFact())
      setFactKey((k) => k + 1)
    }, 12000)
    return () => clearInterval(interval)
  }, [])

  const navLinks = [
    { to: '/', label: 'Ask' },
    { to: '/latest', label: 'Latest' },
    { to: '/about', label: 'About' },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const navClass = (to: string, size: 'desktop' | 'mobile') => {
    const base = size === 'desktop' ? 'px-3 py-1.5' : 'px-3 py-2'
    return `${base} rounded text-sm font-medium transition-colors ${
      isActive(to)
        ? 'bg-skeet-orange text-white'
        : 'text-gray-300 hover:text-white hover:bg-white/10'
    }`
  }

  return (
    <header className="bg-skeet-dark text-white">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/jonskeet.png"
              alt="Jon Skeet"
              className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-skeet-orange/50 group-hover:border-skeet-orange transition-colors"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight group-hover:text-skeet-orange transition-colors">
                Ask Jon Skeet
              </h1>
              <p className="text-[11px] text-gray-500 -mt-0.5">
                The #1 Stack Overflow knowledge base
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={navClass(to, 'desktop')}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="md:hidden mt-3 flex flex-col gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={navClass(to, 'mobile')}>
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Rotating fact - speech bubble style */}
        <div className="mt-3 flex items-start gap-2">
          <span className="text-skeet-orange text-sm shrink-0 mt-px">&ldquo;</span>
          <p
            key={factKey}
            className="text-xs text-gray-400 italic leading-relaxed animate-fade-in-up"
          >
            {fact}
          </p>
          <span className="text-skeet-orange text-sm shrink-0 mt-px">&rdquo;</span>
        </div>
      </div>
    </header>
  )
}
