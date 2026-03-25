import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  function navClass(path: string) {
    const active =
      path === '/protocols'
        ? location.pathname === '/protocols' ||
          location.pathname.startsWith('/protocol/')
        : location.pathname === path
    return clsx(
      'text-sm font-medium transition-colors tracking-[-0.35px]',
      active
        ? 'text-accent border-b-2 border-accent pb-0.5'
        : 'text-text-muted hover:text-accent',
    )
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/protocols?search=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  return (
    <header className="bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="mx-auto max-w-[1536px] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center">
            <img
              src="/defiscan-logo-blue.svg"
              alt="DEFISCAN"
              className="h-7"
            />
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/protocols" className={navClass('/protocols')}>
              Reports
            </Link>
            <Link to="/about" className={navClass('/about')}>
              About
            </Link>
          </nav>
        </div>
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search protocol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-64 rounded border border-border bg-hover text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        </form>
      </div>
    </header>
  )
}
