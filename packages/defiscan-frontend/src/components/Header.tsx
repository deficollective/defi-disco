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
        <Link to="/" className="text-xl font-bold text-text-primary hover:text-brand-600 transition-colors duration-200">
          DeFiScan
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
