import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'

export function Header() {
  const location = useLocation()

  function navClass(path: string) {
    const active = path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path)
    return clsx(
      'relative py-1 text-sm tracking-wide transition-colors duration-200',
      active
        ? 'text-text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-600 after:rounded-full'
        : 'text-text-secondary hover:text-text-primary',
    )
  }

  return (
    <header className="border-b border-border/60 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-display text-xl text-text-primary">DeFiScan</span>
        </Link>
        <nav className="flex items-center gap-8">
          <Link to="/" className={navClass('/')}>
            Reviews
          </Link>
          <Link to="/compare" className={navClass('/compare')}>
            Compare
          </Link>
          <Link to="/about" className={navClass('/about')}>
            About
          </Link>
        </nav>
      </div>
    </header>
  )
}
